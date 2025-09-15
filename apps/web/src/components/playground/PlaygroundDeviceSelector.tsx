import { useMediaDeviceSelect } from '@livekit/components-react'
import { IconChevronDown } from '@tabler/icons-react'
import { useEffect, useState } from 'react'

import { cn } from '@/lib/utils'

type PlaygroundDeviceSelectorProps = {
	kind: MediaDeviceKind
}

export const PlaygroundDeviceSelector = ({
	kind,
}: PlaygroundDeviceSelectorProps) => {
	const [showMenu, setShowMenu] = useState(false)
	const deviceSelect = useMediaDeviceSelect({ kind })
	const [selectedDeviceName, setSelectedDeviceName] = useState('')

	useEffect(() => {
		deviceSelect.devices.forEach((device) => {
			if (device.deviceId === deviceSelect.activeDeviceId) {
				setSelectedDeviceName(device.label)
			}
		})
	}, [deviceSelect.activeDeviceId, deviceSelect.devices, selectedDeviceName])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			event.stopPropagation() // Prevent the click event from bubbling up to the parent
			if (showMenu) {
				setShowMenu(false)
			}
		}
		document.addEventListener('click', handleClickOutside)
		return () => {
			document.removeEventListener('click', handleClickOutside)
		}
	}, [showMenu])

	return (
		<div>
			<button
				className="flex items-center gap-2 rounded-sm border border-border bg-background px-2 py-1 text-foreground hover:bg-muted"
				onClick={(e) => {
					setShowMenu(!showMenu)
					e.stopPropagation()
				}}
			>
				<span className="max-w-[80px] overflow-hidden overflow-ellipsis whitespace-nowrap">
					{selectedDeviceName}
				</span>
				<IconChevronDown className="size-4" />
			</button>
			<div
				className="absolute right-4 top-12 z-10 rounded-sm border border-border bg-popover text-popover-foreground"
				style={{
					display: showMenu ? 'block' : 'none',
				}}
			>
				{deviceSelect.devices.map((device, index) => {
					return (
						<div
							onClick={() => {
								deviceSelect.setActiveMediaDevice(device.deviceId)
								setShowMenu(false)
							}}
							className={cn(
								'cursor-pointer bg-background px-2 py-2 text-xs hover:bg-muted hover:text-primary',
								device.deviceId === deviceSelect.activeDeviceId
									? 'text-primary'
									: 'text-muted-foreground',
							)}
							key={index}
						>
							{device.label}
						</div>
					)
				})}
			</div>
		</div>
	)
}
