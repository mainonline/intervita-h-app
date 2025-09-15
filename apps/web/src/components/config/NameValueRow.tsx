import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

type NameValueRowProps = {
	name: string
	value?: ReactNode
}

export const NameValueRow: React.FC<NameValueRowProps> = ({ name, value }) => {
	return (
		<div className="flex w-full flex-row items-baseline text-sm">
			<div className="shrink-0 grow text-muted-foreground">{name}</div>
			<div className="shrink text-right text-xs text-foreground">{value}</div>
		</div>
	)
}

type EditableNameValueRowProps = {
	name: string
	value: string
	onValueChange?: (value: string) => void
	placeholder?: string
	editable: boolean
}

export const EditableNameValueRow: React.FC<EditableNameValueRowProps> = ({
	name,
	value,
	onValueChange,
	placeholder,
	editable,
}) => {
	if (editable && onValueChange) {
		return (
			<div className="flex w-full flex-row items-baseline text-sm">
				<div className="shrink-0 grow text-muted-foreground">{name}</div>
				<input
					type="text"
					value={value}
					onChange={(e) => onValueChange(e.target.value)}
					className={cn(
						'shrink border-b border-border bg-transparent px-2 py-0 text-right text-xs text-foreground',
						'focus:border-border/60 focus:outline-none focus-visible:ring-1 focus-visible:ring-ring',
					)}
					placeholder={placeholder}
				/>
			</div>
		)
	}
	return <NameValueRow name={name} value={value} />
}
