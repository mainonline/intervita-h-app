import type { TrackReferenceOrPlaceholder } from '@livekit/components-react'

import { cn } from '@/lib/utils'

import { LocalUserBarVisualizer } from '../playground/LocalUserBarVisualizer'

export const AudioInputTile = ({
	trackRef,
}: {
	trackRef: TrackReferenceOrPlaceholder
}) => {
	return (
		<div
			className={cn(
				'flex h-[100px] w-full flex-row items-center justify-center gap-2 rounded-md',
				'border border-border bg-primary/5 dark:bg-primary/5',
			)}
		>
			<LocalUserBarVisualizer
				trackRef={trackRef}
				className="h-full w-full"
				barCount={20}
				options={{ minHeight: 0 }}
			/>
		</div>
	)
}
