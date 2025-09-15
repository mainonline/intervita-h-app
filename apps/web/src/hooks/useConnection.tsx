'use client'

import { env } from '@saas/env'
import type { RoomTokenMetadata } from '@saas/env/types'
import React, { createContext, useCallback, useState } from 'react'

import { createRoom } from '@/http/create-room'

export type ConnectionMode = 'cloud' | 'manual' | 'env'

type TokenGeneratorData = {
	shouldConnect: boolean
	wsUrl: string
	token: string
	mode: ConnectionMode
	disconnect: () => Promise<void>
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	connect: (mode: ConnectionMode, resumeData?: any) => Promise<void>
	isGeneratingToken: boolean
}

const ConnectionContext = createContext<TokenGeneratorData | undefined>(
	undefined,
)

export const ConnectionProvider = ({
	children,
}: {
	children: React.ReactNode
}) => {
	const [connectionDetails, setConnectionDetails] = useState<{
		wsUrl: string
		room: string
		token: string
		mode: ConnectionMode
		shouldConnect: boolean
		isGeneratingToken: boolean
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
	}>({
		wsUrl: '',
		room: '',
		token: '',
		shouldConnect: false,
		mode: 'manual',
		isGeneratingToken: false,
	})

	const connect = useCallback(
		async (mode: ConnectionMode, metadata: RoomTokenMetadata) => {
			setConnectionDetails((prev) => ({ ...prev, isGeneratingToken: true }))

			const { room, token } = await createRoom(metadata)

			setConnectionDetails({
				wsUrl: env.NEXT_PUBLIC_LIVEKIT_HOST,
				room,
				token,
				shouldConnect: true,
				mode,
				isGeneratingToken: false,
			})
		},
		[],
	)

	const disconnect = useCallback(async () => {
		setConnectionDetails((prev) => ({ ...prev, shouldConnect: false }))
	}, [])

	return (
		<ConnectionContext.Provider
			value={{
				wsUrl: connectionDetails.wsUrl,
				token: connectionDetails.token,
				shouldConnect: connectionDetails.shouldConnect,
				mode: connectionDetails.mode,
				connect,
				disconnect,
				isGeneratingToken: connectionDetails.isGeneratingToken,
			}}
		>
			{children}
		</ConnectionContext.Provider>
	)
}

export const useConnection = () => {
	const context = React.useContext(ConnectionContext)
	if (context === undefined) {
		throw new Error('useConnection must be used within a ConnectionProvider')
	}
	return context
}
