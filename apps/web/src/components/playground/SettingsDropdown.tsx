import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { Check, ChevronDown } from 'lucide-react'

import { useConfig } from '@/hooks/useConfig'
import { cn } from '@/lib/utils'

type SettingType = 'inputs' | 'outputs' | 'chat' | 'theme_color'

type SettingValue = {
	title: string
	type: SettingType | 'separator'
	key: string
}

const settingsDropdown: SettingValue[] = [
	{
		title: 'Show chat',
		type: 'chat',
		key: 'N/A',
	},
	{
		title: '---',
		type: 'separator',
		key: 'separator_1',
	},
	{
		title: 'Show video',
		type: 'outputs',
		key: 'video',
	},
	{
		title: 'Show audio',
		type: 'outputs',
		key: 'audio',
	},

	{
		title: '---',
		type: 'separator',
		key: 'separator_2',
	},
	{
		title: 'Enable camera',
		type: 'inputs',
		key: 'camera',
	},
	{
		title: 'Enable mic',
		type: 'inputs',
		key: 'mic',
	},
]

export const SettingsDropdown = () => {
	const { config, setConfig } = useConfig()

	const isEnabled = (setting: SettingValue) => {
		if (setting.type === 'separator' || setting.type === 'theme_color')
			return false
		if (setting.type === 'chat') {
			return config.chat
		}

		if (setting.type === 'inputs') {
			const key = setting.key as 'camera' | 'mic'
			return config.inputs[key]
		} else if (setting.type === 'outputs') {
			const key = setting.key as 'video' | 'audio'
			return config.outputs[key]
		}

		return false
	}

	const toggleSetting = (setting: SettingValue) => {
		if (setting.type === 'separator' || setting.type === 'theme_color') return
		const newValue = !isEnabled(setting)
		const newSettings = { ...config }

		if (setting.type === 'chat') {
			newSettings.chat = newValue
		} else if (setting.type === 'inputs') {
			newSettings.inputs[setting.key as 'camera' | 'mic'] = newValue
		} else if (setting.type === 'outputs') {
			newSettings.outputs[setting.key as 'video' | 'audio'] = newValue
		}
		setConfig(newSettings)
	}

	return (
		<DropdownMenu.Root modal={false}>
			<DropdownMenu.Trigger className="group inline-flex max-h-[36px] items-center gap-1 rounded-md border border-border bg-background p-1 pr-2 text-foreground hover:bg-accent">
				<span className="my-auto flex h-full items-center gap-1 py-1 pl-2 text-sm">
					Settings
					<ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
				</span>
			</DropdownMenu.Trigger>
			<DropdownMenu.Portal>
				<DropdownMenu.Content
					className={cn(
						'z-50 flex w-60 flex-col gap-0 overflow-hidden rounded-md',
						'border border-border bg-background py-2 text-sm text-foreground',
						'shadow-md',
					)}
					sideOffset={5}
					collisionPadding={16}
				>
					{settingsDropdown.map((setting) => {
						if (setting.type === 'separator') {
							return (
								<div
									key={setting.key}
									className="my-2 border-t border-border"
								/>
							)
						}

						return (
							<DropdownMenu.Label
								key={setting.key}
								onClick={() => toggleSetting(setting)}
								className={cn(
									'flex max-w-full cursor-pointer flex-row items-end gap-2 px-3 py-2 text-xs',
									'hover:bg-accent hover:text-accent-foreground',
								)}
							>
								<div className="flex h-4 w-4 items-center justify-center">
									{isEnabled(setting) && (
										<Check className="h-3 w-3 text-primary" />
									)}
								</div>
								<span>{setting.title}</span>
							</DropdownMenu.Label>
						)
					})}
				</DropdownMenu.Content>
			</DropdownMenu.Portal>
		</DropdownMenu.Root>
	)
}
