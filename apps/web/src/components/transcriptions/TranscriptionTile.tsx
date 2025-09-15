import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'
import {
	useChat,
	useLocalParticipant,
	useTrackTranscription,
} from '@livekit/components-react'
import type { Participant, TranscriptionSegment } from 'livekit-client'
import { LocalParticipant, Track } from 'livekit-client'
import { useEffect, useState } from 'react'

import type { ChatMessageType } from '@/components/chat/ChatTile'
import { ChatTile } from '@/components/chat/ChatTile'

export function TranscriptionTile({
	agentAudioTrack,
}: {
	agentAudioTrack?: TrackReferenceOrPlaceholder
}) {
	const agentMessages = useTrackTranscription(agentAudioTrack || undefined)
	const localParticipant = useLocalParticipant()
	const localMessages = useTrackTranscription({
		publication: localParticipant.microphoneTrack,
		source: Track.Source.Microphone,
		participant: localParticipant.localParticipant,
	})

	const [transcripts, setTranscripts] = useState<Map<string, ChatMessageType>>(
		new Map(),
	)

	const [messages, setMessages] = useState<ChatMessageType[]>([])
	const { chatMessages, send: sendChat } = useChat()

	// store transcripts
	useEffect(() => {
		if (agentAudioTrack) {
			agentMessages.segments.forEach((s) =>
				setTranscripts((prev) => {
					prev.set(
						s.id,
						segmentToChatMessage(
							s,
							prev.get(s.id),
							agentAudioTrack.participant,
						),
					)
					return prev
				}),
			)
		}

		localMessages.segments.forEach((s) =>
			setTranscripts((prev) => {
				prev.set(
					s.id,
					segmentToChatMessage(
						s,
						prev.get(s.id),
						localParticipant.localParticipant,
					),
				)
				return prev
			}),
		)

		const allMessages = Array.from(transcripts.values())
		for (const msg of chatMessages) {
			const isAgent = agentAudioTrack
				? msg.from?.identity === agentAudioTrack.participant?.identity
				: msg.from?.identity !== localParticipant.localParticipant.identity
			const isSelf =
				msg.from?.identity === localParticipant.localParticipant.identity
			let name = msg.from?.name
			if (!name) {
				if (isAgent) {
					name = 'Agent'
				} else if (isSelf) {
					name = 'You'
				} else {
					name = 'Unknown'
				}
			}
			allMessages.push({
				name,
				message: msg.message,
				timestamp: msg.timestamp,
				isSelf,
			})
		}
		allMessages.sort((a, b) => a.timestamp - b.timestamp)
		setMessages(allMessages)
	}, [
		transcripts,
		chatMessages,
		localParticipant.localParticipant,
		agentAudioTrack?.participant,
		agentMessages.segments,
		localMessages.segments,
		agentAudioTrack,
	])

	return <ChatTile messages={messages} onSend={sendChat} />
}

function segmentToChatMessage(
	s: TranscriptionSegment,
	existingMessage: ChatMessageType | undefined,
	participant: Participant,
): ChatMessageType {
	const msg: ChatMessageType = {
		message: s.final ? s.text : `${s.text} ...`,
		name: participant instanceof LocalParticipant ? 'You' : 'Agent',
		isSelf: participant instanceof LocalParticipant,
		timestamp: existingMessage?.timestamp ?? Date.now(),
	}
	return msg
}
