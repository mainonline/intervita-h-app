import type { ChatMessage as ComponentsChatMessage } from '@livekit/components-react'
import { useEffect, useRef } from 'react'

import { ChatMessage } from '@/components/chat/ChatMessage'
import { ChatMessageInput } from '@/components/chat/ChatMessageInput'

const inputHeight = 48

export type ChatMessageType = {
	name: string
	message: string
	isSelf: boolean
	timestamp: number
	id?: string // Optional ID for transcription segments
}

type ChatTileProps = {
	messages: ChatMessageType[]
	onSend?: (message: string) => Promise<ComponentsChatMessage>
}

export const ChatTile = ({ messages, onSend }: ChatTileProps) => {
	const containerRef = useRef<HTMLDivElement>(null)
	useEffect(() => {
		if (containerRef.current) {
			containerRef.current.scrollTop = containerRef.current.scrollHeight
		}
	}, [containerRef, messages])

	return (
		<div className="flex h-full w-full flex-col">
			<div
				ref={containerRef}
				className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent flex-1 overflow-y-auto pb-4"
				style={{
					height: `calc(100% - ${inputHeight}px)`,
				}}
			>
				<div className="flex min-h-full flex-col justify-end">
					{messages.length === 0 ? (
						<div className="flex h-full items-center justify-center">
							<p className="text-muted-foreground">No messages yet</p>
						</div>
					) : (
						messages.map((message, index, allMsg) => {
							const hideName =
								index >= 1 && allMsg[index - 1].name === message.name

							return (
								<ChatMessage
									key={message.id || index}
									hideName={hideName}
									name={message.name}
									message={message.message}
									isSelf={message.isSelf}
								/>
							)
						})
					)}
				</div>
			</div>
			<ChatMessageInput
				height={inputHeight}
				placeholder="Type a message"
				onSend={onSend}
			/>
		</div>
	)
}
