import { Send } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ChatMessageInput = {
	placeholder: string
	height: number
	onSend?: (message: string) => void
}

export const ChatMessageInput = ({
	placeholder,
	height,
	onSend,
}: ChatMessageInput) => {
	const [message, setMessage] = useState('')
	const inputRef = useRef<HTMLTextAreaElement>(null)

	const handleSend = useCallback(() => {
		if (!onSend || message.trim() === '') {
			return
		}

		onSend(message)
		setMessage('')

		// Refocus the input after sending
		setTimeout(() => {
			inputRef.current?.focus()
		}, 0)
	}, [onSend, message])

	// Handle auto-resize of textarea
	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.style.height = '0px'
			const scrollHeight = Math.min(inputRef.current.scrollHeight, 100)
			inputRef.current.style.height = `${scrollHeight}px`
		}
	}, [message])

	return (
		<div className="flex items-end" style={{ minHeight: height }}>
			<div className="relative flex w-full items-end rounded-md border border-input bg-background p-1">
				<textarea
					ref={inputRef}
					className="max-h-[100px] flex-1 resize-none bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none disabled:cursor-not-allowed disabled:opacity-50"
					placeholder={placeholder}
					value={message}
					rows={1}
					onChange={(e) => setMessage(e.target.value)}
					onKeyDown={(e) => {
						if (e.key === 'Enter' && !e.shiftKey) {
							e.preventDefault()
							handleSend()
						}
					}}
				/>
				<Button
					type="submit"
					size="icon"
					className={cn(
						'h-8 w-8 shrink-0',
						message.trim() === '' && 'text-muted-foreground',
					)}
					disabled={message.trim() === '' || !onSend}
					onClick={handleSend}
				>
					<Send className="h-4 w-4" />
					<span className="sr-only">Send message</span>
				</Button>
			</div>
		</div>
	)
}
