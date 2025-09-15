'use client'

import {
	useConnectionState,
	useLocalParticipant,
	useRoomContext,
	useTracks,
	useVoiceAssistant,
	VideoTrack,
} from '@livekit/components-react'
import type { Participant } from 'livekit-client'
import {
	ConnectionState,
	LocalParticipant,
	RoomEvent,
	Track,
} from 'livekit-client'
import { Loader } from 'lucide-react'
import { useEffect, useMemo } from 'react'

import { AudioInputTile } from '@/components/config/AudioInputTile'
import { ConfigurationPanelItem } from '@/components/config/ConfigurationPanelItem'
import { AgentBarVisualizer } from '@/components/playground/AgentBarVisualizer'
import { PlaygroundHeader } from '@/components/playground/PlaygroundHeader'
import type { PlaygroundTab } from '@/components/playground/PlaygroundTile'
import {
	PlaygroundTabbedTile,
	PlaygroundTile,
} from '@/components/playground/PlaygroundTile'
import { TranscriptionTile } from '@/components/transcriptions/TranscriptionTile'
import { useConfig } from '@/hooks/useConfig'

export interface PlaygroundMeta {
	name: string
	value: string
}

export interface PlaygroundProps {
	onConnect: (connect: boolean) => void
}

export default function Playground({ onConnect }: PlaygroundProps) {
	const { config } = useConfig()
	const { localParticipant } = useLocalParticipant()

	const voiceAssistant = useVoiceAssistant()

	const roomState = useConnectionState()
	const tracks = useTracks()
	const room = useRoomContext()

	useEffect(() => {
		if (roomState === ConnectionState.Connected) {
			localParticipant.setCameraEnabled(config.inputs.camera)
			localParticipant.setMicrophoneEnabled(config.inputs.mic)
		}
	}, [config, localParticipant, roomState])

	useEffect(() => {
		if (!room) return

		// Handler for disconnection events
		const handleDisconnect = () => {
			console.log('Room disconnected from server side')
			// Disconnect client side as well
			onConnect(false)
		}

		// Handler for when connection state changes unexpectedly
		const handleConnectionStateChanged = (state: ConnectionState) => {
			if (state === ConnectionState.Disconnected) {
				console.log('Connection state changed to disconnected')
				// Ensure we update local state
				onConnect(false)
			}
		}

		// Listen for agent disconnection specifically
		const handleParticipantDisconnected = (participant: Participant) => {
			if (participant.isAgent) {
				console.log('Agent participant disconnected')
				// When agent disconnects, disconnect client side as well
				onConnect(false)
			}
		}

		// Add event listeners using LiveKit constants
		room.on(RoomEvent.Disconnected, handleDisconnect)
		room.on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
		room.on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)

		// Clean up listeners when component unmounts
		return () => {
			room.off(RoomEvent.Disconnected, handleDisconnect)
			room.off(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged)
			room.off(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
		}
	}, [room, onConnect])

	const agentVideoTrack = tracks.find(
		(trackRef) =>
			// trackRef.publication.kind === Track.Kind.Video &&
			// trackRef.participant.isAgent
			trackRef.publication.kind === Track.Kind.Video,
	)

	const localTracks = tracks.filter(
		({ participant }) => participant instanceof LocalParticipant,
	)
	const localVideoTrack = localTracks.find(
		({ source }) => source === Track.Source.Camera,
	)
	const localMicTrack = localTracks.find(
		({ source }) => source === Track.Source.Microphone,
	)

	const videoTileContent = useMemo(() => {
		const disconnectedContent = (
			<div className="flex h-full w-full items-center justify-center text-center text-sm text-muted-foreground">
				No video track. Connect to get started.
			</div>
		)

		const loadingContent = (
			<div className="flex h-full w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
				<Loader className="h-5 w-5 animate-spin" />
				Waiting for video track
			</div>
		)

		const videoContent = (
			<VideoTrack
				trackRef={agentVideoTrack}
				className="absolute top-1/2 h-full w-full -translate-y-1/2 object-cover"
			/>
		)

		let content = null
		if (roomState === ConnectionState.Disconnected) {
			content = disconnectedContent
		} else if (agentVideoTrack) {
			content = videoContent
		} else {
			content = loadingContent
		}

		return (
			<div className="relative flex w-full grow flex-col text-foreground">
				{content}
			</div>
		)
	}, [agentVideoTrack, roomState])

	const audioTileContent = useMemo(() => {
		const disconnectedContent = (
			<div className="flex w-full flex-col items-center justify-center gap-2 text-center text-sm text-muted-foreground">
				No audio track. Connect to get started.
			</div>
		)

		const waitingContent = (
			<div className="flex w-full flex-col items-center gap-2 text-center text-sm text-muted-foreground">
				<Loader className="h-5 w-5 animate-spin" />
				Waiting for audio track
			</div>
		)

		const visualizerContent = (
			<div className="flex w-full items-center justify-center">
				<AgentBarVisualizer
					state={voiceAssistant.state}
					trackRef={voiceAssistant.audioTrack}
					barCount={7}
					options={{ minHeight: 20 }}
					className="w-full"
				/>
			</div>
		)

		if (roomState === ConnectionState.Disconnected) {
			return disconnectedContent
		}

		if (!voiceAssistant.audioTrack) {
			return waitingContent
		}

		return visualizerContent
	}, [voiceAssistant.audioTrack, roomState, voiceAssistant.state])

	const chatTileContent = useMemo(() => {
		if (voiceAssistant.agent) {
			return <TranscriptionTile agentAudioTrack={voiceAssistant.audioTrack} />
		}
		return <></>
	}, [voiceAssistant.audioTrack, voiceAssistant.agent])

	const settingsTileContent = useMemo(() => {
		return (
			<div className="flex h-full w-full flex-col items-start gap-4 overflow-y-auto">
				<ConfigurationPanelItem title="Status">
					<div className="flex flex-row items-center gap-4">
						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Room</span>
							{roomState === ConnectionState.Connecting ? (
								<div className="relative">
									<div className="absolute -inset-1 animate-ping rounded-full bg-gray-500 opacity-30"></div>
									<div className="relative h-2 w-2 animate-pulse rounded-full bg-gray-500"></div>
								</div>
							) : roomState === ConnectionState.Connected ? (
								<div className="relative">
									<div className="absolute -inset-1 animate-pulse rounded-full bg-green-500 opacity-30"></div>
									<div className="relative h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_1px_rgba(74,222,128,0.5)]"></div>
								</div>
							) : (
								<div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
							)}
						</div>

						<div className="flex items-center gap-2">
							<span className="text-sm text-muted-foreground">Agent</span>
							{roomState === ConnectionState.Connected &&
							!voiceAssistant.agent ? (
								<div className="relative">
									<div className="absolute -inset-1 animate-ping rounded-full bg-gray-500 opacity-30"></div>
									<div className="relative h-2 w-2 animate-pulse rounded-full bg-gray-500"></div>
								</div>
							) : voiceAssistant.agent ? (
								<div className="relative">
									<div className="absolute -inset-1 animate-pulse rounded-full bg-green-500 opacity-30"></div>
									<div className="relative h-2 w-2 rounded-full bg-green-500 shadow-[0_0_5px_1px_rgba(74,222,128,0.5)]"></div>
								</div>
							) : (
								<div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-600"></div>
							)}
						</div>
					</div>
				</ConfigurationPanelItem>
				{localVideoTrack && (
					<ConfigurationPanelItem
						title="Camera"
						deviceSelectorKind="videoinput"
					>
						<div className="relative">
							<VideoTrack
								className="w-full rounded-md border border-border"
								trackRef={localVideoTrack}
							/>
						</div>
					</ConfigurationPanelItem>
				)}
				{localMicTrack && (
					<ConfigurationPanelItem
						title="Microphone"
						deviceSelectorKind="audioinput"
					>
						<AudioInputTile trackRef={localMicTrack} />
					</ConfigurationPanelItem>
				)}
			</div>
		)
	}, [roomState, localVideoTrack, localMicTrack, voiceAssistant.agent])

	const mobileTabs: PlaygroundTab[] = []
	if (config.outputs.video) {
		mobileTabs.push({
			title: 'Video',
			content: (
				<PlaygroundTile
					className="h-full w-full grow"
					childrenClassName="justify-center"
				>
					{videoTileContent}
				</PlaygroundTile>
			),
		})
	}

	if (config.outputs.audio) {
		mobileTabs.push({
			title: 'Audio',
			content: (
				<PlaygroundTile
					className="h-full w-full grow"
					childrenClassName="justify-center"
				>
					{audioTileContent}
				</PlaygroundTile>
			),
		})
	}

	if (config.chat) {
		mobileTabs.push({
			title: 'Chat',
			content: chatTileContent,
		})
	}

	mobileTabs.push({
		title: 'Settings',
		content: (
			<PlaygroundTile
				padding={false}
				backgroundColor="background"
				className="flex h-full w-full basis-1/4 items-start overflow-y-auto"
				childrenClassName="h-full grow items-start"
			>
				{settingsTileContent}
			</PlaygroundTile>
		),
	})

	// Add effect to handle server disconnection events
	useEffect(() => {
		if (!room) return

		// Handler for disconnection events
		const handleDisconnect = () => {
			console.log('Room disconnected from server side')
			// Use the same onConnect method but with false to disconnect
			onConnect(false)
		}

		// Listen for participant disconnection events that might indicate agent left
		const handleParticipantDisconnected = (participant: Participant) => {
			if (participant.isAgent) {
				console.log('Agent disconnected from room')
				// Optionally disconnect client when agent disconnects
				onConnect(false)
			}
		}

		// Add event listeners
		room.on('disconnected', handleDisconnect)
		room.on('participantDisconnected', handleParticipantDisconnected)

		// Clean up listeners when component unmounts
		return () => {
			room.off('disconnected', handleDisconnect)
			room.off('participantDisconnected', handleParticipantDisconnected)
		}
	}, [room, onConnect])

	return (
		<>
			<PlaygroundHeader
				connectionState={roomState}
				onConnectClicked={() =>
					onConnect(roomState === ConnectionState.Disconnected)
				}
			/>
			<div
				className="flex w-full grow gap-4 py-2 selection:bg-muted"
				style={{
					height: `calc(100vh - 300px)`,
				}}
			>
				<div className="flex h-full grow basis-1/2 flex-col gap-4 lg:hidden">
					<PlaygroundTabbedTile
						className="h-full"
						tabs={mobileTabs}
						initialTab={mobileTabs.length - 1}
					/>
				</div>
				<div
					className={`hidden h-full grow basis-1/2 flex-col gap-4 lg:${
						!config.outputs.audio && !config.outputs.video ? 'hidden' : 'flex'
					}`}
				>
					{config.outputs.video && (
						<PlaygroundTile
							title="Video"
							className="h-full w-full grow"
							childrenClassName="justify-center"
						>
							{videoTileContent}
						</PlaygroundTile>
					)}
					{config.outputs.audio && (
						<PlaygroundTile
							title="Audio"
							className="h-full w-full grow"
							childrenClassName="justify-center"
						>
							{audioTileContent}
						</PlaygroundTile>
					)}
				</div>

				{config.chat && (
					<PlaygroundTile
						title="Chat"
						className="hidden h-full grow basis-1/4 lg:flex"
					>
						{chatTileContent}
					</PlaygroundTile>
				)}
				<PlaygroundTile
					padding={false}
					backgroundColor="background"
					className="hidden h-full w-full max-w-[480px] basis-1/4 items-start overflow-y-auto lg:flex"
					childrenClassName="h-full grow items-start"
				>
					{settingsTileContent}
				</PlaygroundTile>
			</div>
		</>
	)
}
