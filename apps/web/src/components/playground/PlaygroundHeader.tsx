import { IconLoader2 } from '@tabler/icons-react'
import { ConnectionState } from 'livekit-client'

import { SettingsDropdown } from '@/components/playground/SettingsDropdown'
import { Button } from '@/components/ui/button'
import { useConnection } from '@/hooks/useConnection'

type PlaygroundHeader = {
	connectionState: ConnectionState
	onConnectClicked: () => void
}

export const PlaygroundHeader = ({
	onConnectClicked,
	connectionState,
}: PlaygroundHeader) => {
	const { isGeneratingToken } = useConnection()

	const isConnecting = connectionState === ConnectionState.Connecting

	const getButtonLabel = () => {
		if (isGeneratingToken) {
			return (
				<span className="flex items-center gap-2">
					Starting
					<IconLoader2 size={16} className="animate-spin duration-1000" />
				</span>
			)
		}

		if (connectionState === ConnectionState.Connecting) {
			return (
				<span className="flex items-center gap-2">
					Connecting
					<IconLoader2 size={16} className="animate-spin duration-1000" />
				</span>
			)
		}

		if (connectionState === ConnectionState.Connected) {
			return 'End interview'
		}

		return 'Start interview'
	}

	return (
		<div className="flex w-full shrink-0 items-center justify-between gap-4">
			<div className="flex w-full items-center justify-end gap-2">
				<SettingsDropdown />
				<Button
					className="max-h-[36px]"
					variant={
						connectionState === ConnectionState.Connected
							? 'destructive'
							: 'default'
					}
					disabled={isConnecting || isGeneratingToken}
					onClick={onConnectClicked}
				>
					{getButtonLabel()}
				</Button>
			</div>
		</div>
	)
}
