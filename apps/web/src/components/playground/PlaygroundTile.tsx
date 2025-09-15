import type { ReactNode } from 'react'
import { useState } from 'react'

import { cn } from '@/lib/utils'

const titleHeight = 32

type PlaygroundTileProps = {
	title?: string
	children?: ReactNode
	className?: string
	childrenClassName?: string
	padding?: boolean
	backgroundColor?: string
}

export type PlaygroundTab = {
	title: string
	content: ReactNode
}

export type PlaygroundTabbedTileProps = {
	tabs: PlaygroundTab[]
	initialTab?: number
} & PlaygroundTileProps

export const PlaygroundTile: React.FC<PlaygroundTileProps> = ({
	children,
	title,
	className,
	childrenClassName,
	padding = true,
	backgroundColor = 'transparent',
}) => {
	const contentPadding = padding ? 4 : 0
	return (
		<div
			className={cn(
				'flex flex-col rounded-md border border-border text-foreground',
				backgroundColor !== 'transparent' && `bg-${backgroundColor}`,
				className,
			)}
		>
			{title && (
				<div
					className="flex items-center justify-center border-b border-b-border py-2 text-xs tracking-wider text-muted-foreground"
					style={{
						height: `${titleHeight}px`,
					}}
				>
					<h2>{title}</h2>
				</div>
			)}
			<div
				className={cn(
					'flex w-full grow flex-col items-center',
					childrenClassName,
				)}
				style={{
					height: `calc(100% - ${title ? titleHeight + 'px' : '0px'})`,
					padding: `${contentPadding * 4}px`,
				}}
			>
				{children}
			</div>
		</div>
	)
}

export const PlaygroundTabbedTile: React.FC<PlaygroundTabbedTileProps> = ({
	tabs,
	initialTab = 0,
	className,
	childrenClassName,
	backgroundColor = 'transparent',
}) => {
	const contentPadding = 4
	const [activeTab, setActiveTab] = useState(initialTab)
	if (activeTab >= tabs.length) {
		return null
	}
	return (
		<div
			className={cn(
				'flex h-full flex-col rounded-md border border-border text-foreground',
				backgroundColor !== 'transparent' && `bg-${backgroundColor}`,
				className,
			)}
		>
			<div
				className="flex items-center justify-start border-b border-b-border text-xs uppercase tracking-wider"
				style={{
					height: `${titleHeight}px`,
				}}
			>
				{tabs.map((tab, index) => (
					<button
						key={index}
						className={cn(
							'rounded-sm border-r border-r-border px-4 py-2 hover:bg-accent hover:text-accent-foreground',
							index === activeTab
								? 'bg-secondary text-secondary-foreground'
								: 'bg-transparent text-muted-foreground',
						)}
						onClick={() => setActiveTab(index)}
					>
						{tab.title}
					</button>
				))}
			</div>
			<div
				className={cn('w-full', childrenClassName)}
				style={{
					height: `calc(100% - ${titleHeight}px)`,
					padding: `${contentPadding * 4}px`,
				}}
			>
				{tabs[activeTab].content}
			</div>
		</div>
	)
}
