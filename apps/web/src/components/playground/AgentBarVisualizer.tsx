import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { useMaybeTrackRefContext } from '@livekit/components-react'
import {
	type AgentState,
	useMultibandTrackVolume,
} from '@livekit/components-react'
import * as React from 'react'

import { useBarAnimator } from '@/hooks/useBarAnimator'
import { cn } from '@/lib/utils'

export type AgentBarVisualizerOptions = {
	/** in percentage */
	maxHeight?: number
	/** in percentage */
	minHeight?: number
}

export interface AgentBarVisualizerProps
	extends React.HTMLAttributes<HTMLDivElement> {
	/** State of the voice assistant */
	state?: AgentState
	/** Number of bars in the visualizer */
	barCount?: number
	trackRef?: TrackReferenceOrPlaceholder
	options?: AgentBarVisualizerOptions
}

const sequencerIntervals = new Map<AgentState, number>([
	['connecting', 2000],
	['initializing', 2000],
	['listening', 500],
	['thinking', 150],
])

// Define gradient color schemes for different states
// Avoid orange and dark grey, use vibrant colors that work in light/dark mode
const stateColorMap: Record<
	AgentState | 'disconnected',
	{
		gradientClasses: string
		animation: string
		pulseOpacity: string
	}
> = {
	connecting: {
		gradientClasses: 'from-blue-500 via-indigo-400 to-violet-500',
		animation: 'animate-pulse',
		pulseOpacity: 'opacity-70',
	},
	initializing: {
		gradientClasses: 'from-emerald-500 via-teal-400 to-cyan-500',
		animation: 'animate-bounce',
		pulseOpacity: 'opacity-80',
	},
	listening: {
		gradientClasses: 'from-violet-500 via-purple-400 to-fuchsia-500',
		animation: 'animate-pulse',
		pulseOpacity: 'opacity-90',
	},
	thinking: {
		gradientClasses: 'from-cyan-500 via-blue-400 to-indigo-500',
		animation: 'animate-pulse',
		pulseOpacity: 'opacity-90',
	},
	speaking: {
		gradientClasses: 'from-emerald-500 via-green-400 to-teal-500',
		animation: 'animate-pulse',
		pulseOpacity: 'opacity-90',
	},
	disconnected: {
		gradientClasses:
			'from-slate-400 via-slate-300 to-slate-400 dark:from-slate-600 dark:via-slate-500 dark:to-slate-600',
		animation: '',
		pulseOpacity: 'opacity-50',
	},
}

const getSequencerInterval = (
	state: AgentState | undefined,
	barCount: number,
): number | undefined => {
	if (state === undefined) {
		return 1000
	}
	let interval = sequencerIntervals.get(state)
	if (interval) {
		switch (state) {
			case 'connecting':
				interval /= barCount
				break
			default:
				break
		}
	}
	return interval
}

export const AgentBarVisualizer = React.forwardRef<
	HTMLDivElement,
	AgentBarVisualizerProps
>(function AgentBarVisualizer(
	{
		state,
		options,
		barCount = 7,
		trackRef,
		className,
		...props
	}: AgentBarVisualizerProps,
	ref,
) {
	// Always call hooks unconditionally
	const contextTrackRef = useMaybeTrackRefContext()
	const trackReference = trackRef || contextTrackRef

	// Get volume bands from the track
	const volumeBands = useMultibandTrackVolume(trackReference, {
		bands: barCount,
		loPass: 100,
		hiPass: 200,
	})

	const minHeight = options?.minHeight ?? 20
	const maxHeight = options?.maxHeight ?? 100

	// Use the LiveKit animator hook to determine which bars to highlight
	const highlightedIndices = useBarAnimator(
		state,
		barCount,
		getSequencerInterval(state, barCount) ?? 100,
	)

	// For connecting state, highlight all bars at once
	const isConnecting = state === 'connecting'

	// Get color styles based on current state
	const getBarStyles = (isHighlighted: boolean, index: number) => {
		if (!isHighlighted || !state) {
			return {
				gradientClasses:
					'from-slate-300 to-slate-400 dark:from-slate-700 dark:to-slate-600',
				animation: '',
				pulseOpacity: 'opacity-50',
				animationDuration: '0s',
				animationDelay: '0s',
			}
		}

		const stateStyle = stateColorMap[state] || stateColorMap.disconnected

		return {
			gradientClasses: stateStyle.gradientClasses,
			animation: stateStyle.animation,
			pulseOpacity: stateStyle.pulseOpacity,
			animationDuration: `${index % 2 === 0 ? '1.2s' : '0.8s'}`,
			animationDelay: `${index * 0.1}s`,
		}
	}

	return (
		<div
			ref={ref}
			className={cn(
				'flex h-48 w-full items-center justify-center gap-3 py-2',
				'transition-all duration-500',
				className,
			)}
			data-lk-va-state={state}
			{...props}
		>
			{volumeBands.map((volume, idx) => {
				const isHighlighted = isConnecting
					? true
					: highlightedIndices.includes(idx)
				const styles = getBarStyles(isHighlighted, idx)

				return (
					<div
						key={idx}
						className={cn(
							'relative w-6 rounded-full',
							'transform transition-all duration-100 ease-out',
							isHighlighted ? 'scale-y-105' : '',
						)}
						style={{
							height: `${Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))}%`,
						}}
					>
						<div
							className={cn(
								'absolute inset-0 rounded-full bg-gradient-to-t',
								styles.gradientClasses,
								styles.animation,
								styles.pulseOpacity,
							)}
							style={{
								animationDuration: styles.animationDuration,
								animationDelay: styles.animationDelay,
							}}
						/>
						{/* Add glow effect based on state */}
						<div
							className={cn(
								'absolute inset-0 rounded-full bg-gradient-to-t opacity-70',
								'blur-sm',
								isHighlighted
									? 'from-transparent to-background/50'
									: 'from-transparent to-background/30',
							)}
						/>
					</div>
				)
			})}
		</div>
	)
})

AgentBarVisualizer.displayName = 'AgentBarVisualizer'
