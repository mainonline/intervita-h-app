import { cn } from '@/lib/utils'

type ChatMessageProps = {
	message: string
	name: string
	isSelf: boolean
	hideName?: boolean
}

export const ChatMessage = ({
	name,
	message,
	isSelf,
	hideName,
}: ChatMessageProps) => {
	return (
		<div
			className={cn(
				'group flex w-full flex-col gap-1',
				hideName ? 'mt-1' : 'mt-4',
				isSelf ? 'items-end' : 'items-start',
			)}
		>
			{!hideName && (
				<div
					className={cn(
						'px-2 text-xs font-medium',
						isSelf ? 'text-muted-foreground' : 'text-primary',
					)}
				>
					{name}
				</div>
			)}
			<div
				className={cn(
					'max-w-[85%] whitespace-pre-line rounded-lg px-4 py-2 text-sm',
					isSelf
						? 'bg-primary text-primary-foreground'
						: 'bg-muted text-foreground',
					isSelf ? 'rounded-br-sm' : 'rounded-bl-sm',
				)}
			>
				{message}
			</div>
		</div>
	)
}
