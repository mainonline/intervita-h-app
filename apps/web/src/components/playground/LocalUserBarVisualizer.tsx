import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import {
	useMaybeTrackRefContext,
	useMultibandTrackVolume,
} from '@livekit/components-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

export type LocalUserBarVisualizerOptions = {
	/** in percentage */
	maxHeight?: number
	/** in percentage */
	minHeight?: number
}

export interface LocalUserBarVisualizerProps
	extends React.HTMLAttributes<HTMLDivElement> {
	/** Number of bars in the visualizer */
	barCount?: number
	trackRef?: TrackReferenceOrPlaceholder
	options?: LocalUserBarVisualizerOptions
}

export const LocalUserBarVisualizer = React.forwardRef<
	HTMLDivElement,
	LocalUserBarVisualizerProps
>(function LocalUserBarVisualizer(
	{
		options,
		barCount = 7,
		trackRef,
		className,
		...props
	}: LocalUserBarVisualizerProps,
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

	return (
		<div
			ref={ref}
			className={cn(
				'flex h-48 w-full items-end justify-center gap-1 py-2',
				'transition-all duration-500',
				className,
			)}
			{...props}
		>
			{volumeBands.map((volume, idx) => (
				<div
					key={idx}
					className={cn(
						'relative w-2 rounded-full',
						'transform transition-all duration-100 ease-out',
					)}
					style={{
						height: `${Math.min(maxHeight, Math.max(minHeight, volume * 100 + 5))}%`,
					}}
				>
					<div
						className={cn(
							'absolute inset-0 rounded-full',
							'bg-primary/40 dark:bg-primary/80',
						)}
					/>
					{/* Add subtle glow effect */}
					<div
						className={cn(
							'absolute inset-0 rounded-full opacity-70',
							'blur-sm',
							'from-transparent to-background/30',
						)}
					/>
				</div>
			))}
		</div>
	)
})

LocalUserBarVisualizer.displayName = 'LocalUserBarVisualizer'
