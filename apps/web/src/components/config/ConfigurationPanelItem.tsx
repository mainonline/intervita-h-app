import { TrackToggle } from '@livekit/components-react'
import { Track } from 'livekit-client'
import type { ReactNode } from 'react'

import { PlaygroundDeviceSelector } from '@/components/playground/PlaygroundDeviceSelector'
import { cn } from '@/lib/utils'

type ConfigurationPanelItemProps = {
	title: string
	children?: ReactNode
	deviceSelectorKind?: MediaDeviceKind
}

export const ConfigurationPanelItem: React.FC<ConfigurationPanelItemProps> = ({
	children,
	title,
	deviceSelectorKind,
}) => {
	return (
		<div className="relative w-full py-4 text-foreground">
			<div className="flex flex-row items-center justify-between px-4 text-xs uppercase tracking-wider">
				<h3 className="text-muted-foreground">{title}</h3>
				{deviceSelectorKind && (
					<span className="flex flex-row gap-2">
						<TrackToggle
							className={cn(
								'rounded-sm border px-2 py-1',
								'border-border bg-background text-foreground',
								'hover:bg-muted',
							)}
							source={
								deviceSelectorKind === 'audioinput'
									? Track.Source.Microphone
									: Track.Source.Camera
							}
						/>
						<PlaygroundDeviceSelector kind={deviceSelectorKind} />
					</span>
				)}
			</div>
			<div className="px-4 py-2 text-xs leading-normal text-muted-foreground">
				{children}
			</div>
		</div>
	)
}
