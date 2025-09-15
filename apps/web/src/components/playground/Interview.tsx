'use client'

import {
	LiveKitRoom,
	RoomAudioRenderer,
	StartAudio,
} from '@livekit/components-react'
import { INTERVIEW_MAX_MINUTES } from '@saas/env/constants'
import type { InterviewContextData, RoomTokenMetadata } from '@saas/env/types'
import { useCallback, useState } from 'react'

import type { ConnectionMode } from '@/hooks/useConnection'
import { useConnection } from '@/hooks/useConnection'
import { cn } from '@/lib/utils'

import { ResumeUploadDialog } from '../resume-upload-dialog'
import Playground from './Playground'

function Interview() {
	const { shouldConnect, wsUrl, token, mode, connect, disconnect } =
		useConnection()

	const [open, setOpen] = useState(true)

	const [contextData, setContextData] = useState<InterviewContextData>({
		resume: null,
		questions: [],
		job_context: '',
	})

	const [metadata, setMetadata] = useState<RoomTokenMetadata | null>(null)

	const handleConnect = useCallback(
		async (shouldConnect: boolean, mode: ConnectionMode) => {
			shouldConnect ? connect(mode, metadata) : disconnect()
		},
		[connect, disconnect, metadata],
	)

	const onComplete = useCallback(() => {
		const newMetadata = {
			job_context: contextData.job_context,
			resume_data: contextData.resume,
			questions: contextData.questions,
			max_interview_minutes: INTERVIEW_MAX_MINUTES,
		}
		setMetadata(newMetadata)

		connect(mode, newMetadata)
		setOpen(false)
	}, [connect, mode, contextData])

	return (
		<div className="flex h-full w-full flex-col overflow-hidden">
			<ResumeUploadDialog
				open={open}
				onOpenChange={setOpen}
				contextData={contextData}
				setContextData={setContextData}
				onComplete={onComplete}
			/>
			<LiveKitRoom
				className="flex h-full w-full flex-col"
				serverUrl={wsUrl}
				token={token}
				connect={shouldConnect}
				onError={(e) => {
					console.error(e)
				}}
			>
				<Playground
					onConnect={(c) => {
						handleConnect(c, mode)
					}}
				/>
				<RoomAudioRenderer />
				<StartAudio
					label="Click to enable audio playback"
					className={cn(
						'fixed bottom-4 left-1/2 z-50 -translate-x-1/2',
						'rounded-md border border-border bg-background px-4 py-2',
						'text-sm font-medium text-foreground shadow-sm',
						'transition-colors hover:bg-accent hover:text-accent-foreground',
						'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
					)}
				/>
			</LiveKitRoom>
		</div>
	)
}

export default Interview
