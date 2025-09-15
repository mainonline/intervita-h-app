'use client'

import React, { createContext, useState } from 'react'

export type AppConfig = {
	chat: boolean
	show_transcript: boolean
	inputs: {
		camera: boolean
		mic: boolean
	}
	outputs: {
		audio: boolean
		video: boolean
	}
	ws_url: string
	token: string
	room_name: string
	participant_name: string
}

const defaultConfig: AppConfig = {
	chat: true,
	show_transcript: true,
	inputs: {
		camera: true,
		mic: true,
	},
	outputs: {
		audio: true,
		video: true,
	},
	ws_url: '',
	token: '',
	room_name: '',
	participant_name: '',
}

type ConfigContextType = {
	config: AppConfig
	setConfig: (config: AppConfig) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

const getConfig = () => {
	if (typeof window !== 'undefined') {
		const config = localStorage.getItem('config')
		return config ? JSON.parse(config) : defaultConfig
	}

	return defaultConfig
}

export const ConfigProvider = ({ children }: { children: React.ReactNode }) => {
	const [config, setConfig] = useState<AppConfig>(getConfig())

	const setConfigFromLocalStorage = (config: AppConfig) => {
		localStorage.setItem('config', JSON.stringify(config))
		setConfig(config)
	}

	return (
		<ConfigContext.Provider
			value={{ config, setConfig: setConfigFromLocalStorage }}
		>
			{children}
		</ConfigContext.Provider>
	)
}

export const useConfig = () => {
	const context = React.useContext(ConfigContext)
	if (context === undefined) {
		throw new Error('useConfig must be used within a ConfigProvider')
	}
	return context
}

export const boolToString = (b: boolean) => (b ? '1' : '0')
