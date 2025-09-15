'use client'

import { env } from '@saas/env'
import type { InterviewContextData, IRawResume } from '@saas/env/types'
import {
	Check,
	ChevronRight,
	File,
	Link as LinkIcon,
	Loader2,
	UploadCloud,
} from 'lucide-react'
import { useCallback, useRef, useState } from 'react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Progress } from '@/components/ui/progress'
import { Steps } from '@/components/ui/steps'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'

interface ResumeUploadDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	contextData: InterviewContextData
	setContextData: React.Dispatch<React.SetStateAction<InterviewContextData>>
	onComplete: () => void
}

export function ResumeUploadDialog({
	open,
	onOpenChange,
	setContextData,
	onComplete,
}: ResumeUploadDialogProps) {
	// Dialog state
	const [currentStep, setCurrentStep] = useState<1 | 2>(1)

	// Resume upload state
	const [uploadProgress, setUploadProgress] = useState<string[]>([])
	const [progressPercentage, setProgressPercentage] = useState(0)
	const [isUploading, setIsUploading] = useState(false)
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [savedResumes, setSavedResumes] = useState<IRawResume[]>([])
	const [selectedResume, setSelectedResume] = useState<IRawResume | null>(null)
	const [resumeText, setResumeText] = useState('')
	const [dragActive, setDragActive] = useState(false)

	// Job context state
	const [jobContextText, setJobContextText] = useState('')

	// Ref for file input and drop area
	const fileInputRef = useRef<HTMLInputElement>(null)
	const dropAreaRef = useRef<HTMLDivElement>(null)

	// Step configuration
	const steps = [
		{
			id: 'step-1',
			name: 'Resume Upload',
			status:
				currentStep === 1
					? 'current'
					: currentStep > 1
						? 'complete'
						: 'upcoming',
		},
		{
			id: 'step-2',
			name: 'Job Context',
			status: currentStep === 2 ? 'current' : 'upcoming',
		},
	] as const

	// Drag and drop handlers
	const handleDragOver = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(true)
	}, [])

	const handleDragLeave = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)
	}, [])

	const handleDrop = useCallback((e: React.DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		setDragActive(false)

		if (e.dataTransfer.files && e.dataTransfer.files[0]) {
			const file = e.dataTransfer.files[0]
			if (file.type === 'application/pdf') {
				handleFileUploadWithFile(file)
			}
		}
	}, [])

	// File upload handler
	const handleFileUpload = async (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const file = event.target.files?.[0]
		if (!file) return

		handleFileUploadWithFile(file)
	}

	// Main file upload function
	const handleFileUploadWithFile = async (file: File) => {
		setIsUploading(true)
		setUploadProgress(['Uploading file...'])
		setProgressPercentage(10)

		try {
			const formData = new FormData()
			formData.append('file', file)

			const response = await fetch(
				`${env.NEXT_PUBLIC_API_URL}/resume/parse?stream=1`,
				{
					method: 'POST',
					body: formData,
					credentials: 'include',
				},
			)

			if (!response.ok) {
				throw new Error(`HTTP error! status: ${response.status}`)
			}

			const reader = response.body?.getReader()
			if (!reader) {
				throw new Error('Response body cannot be read')
			}

			let buffer = ''
			const decoder = new TextDecoder()

			// Track progress state
			let currentTaskCount = 0

			while (true) {
				const { done, value } = await reader.read()
				if (done) break

				buffer += decoder.decode(value, { stream: true })

				const processBuffer = buffer
				buffer = ''

				const events = processBuffer.split('\n\n')
				if (!processBuffer.endsWith('\n\n') && events.length > 0) {
					buffer = events.pop() || ''
				}

				for (const eventStr of events) {
					if (!eventStr.trim()) continue

					const eventLines = eventStr.split('\n')
					let eventType = ''
					let eventData = ''

					for (const line of eventLines) {
						if (line.startsWith('event:')) {
							eventType = line.slice(6).trim()
						} else if (line.startsWith('data:')) {
							eventData = line.slice(5).trim()
						}
					}

					if (eventType && eventData) {
						try {
							const data = JSON.parse(eventData)

							if (eventType === 'progress') {
								currentTaskCount++
								setUploadProgress((prev) => [...prev, data.message])

								// Simulate progress percentage based on task count
								// Reserving 20% for final processing
								setProgressPercentage(Math.min(80, 10 + currentTaskCount * 15))
							} else if (eventType === 'data' && data.type === 'resume') {
								setProgressPercentage(90)

								// Store the resume data
								const resumeData = data.data

								// Update the context with the new resume data
								setContextData((prevState) => ({
									...prevState,
									resume: resumeData,
								}))

								// Update the local state
								setSelectedResume(resumeData)

								setProgressPercentage(95)
							} else if (eventType === 'data' && data.type === 'questions') {
								// Use functional update to ensure we have the latest contextData
								setContextData((prevState) => ({
									...prevState,
									questions: data.data,
								}))

								setProgressPercentage(100)
							} else if (eventType === 'complete') {
								setProgressPercentage(100)
								setIsUploading(false)
							} else if (eventType === 'error') {
								console.error('Error from server:', data.message)
								setIsUploading(false)
							}
						} catch (e) {
							console.error('Error parsing event data:', e)
						}
					}
				}
			}
		} catch (error) {
			console.error('Error uploading file:', error)
			setIsUploading(false)
		}
	}

	// Handle resume selection
	const handleResumeSelect = (resume: IRawResume) => {
		setSelectedResume(resume)
		if (resume.content) {
			setResumeText(JSON.stringify(resume.content, null, 2))
		}
	}

	// Handle next step
	const handleNextStep = () => {
		if (currentStep === 1) {
			setCurrentStep(2)
		} else {
			onComplete()
		}
	}

	// Handle skip
	const handleSkip = () => {
		onOpenChange(false)
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				onEscapeKeyDown={(e) => e.preventDefault()}
				onPointerDown={(e) => e.preventDefault()}
				onInteractOutside={(e) => e.preventDefault()}
				className="overflow-hidden rounded-xl border-0 bg-gradient-to-b from-white to-gray-50 p-0 shadow-xl dark:from-gray-900 dark:to-gray-950 dark:shadow-indigo-950/20 sm:w-full sm:max-w-xl"
			>
				<div className="relative max-h-[85vh] overflow-y-auto p-4 sm:p-6">
					<DialogHeader className="mb-4 sm:mb-6">
						<DialogTitle className="text-xl font-bold dark:text-white sm:text-2xl">
							{currentStep === 1
								? 'Upload Your Resume'
								: 'Provide Job Context (optional)'}
						</DialogTitle>
					</DialogHeader>

					{/* Stepper */}
					<div className="mb-6 sm:mb-8">
						<Steps steps={steps} />
					</div>

					{/* Step 1: Resume Upload */}
					{currentStep === 1 && (
						<div>
							<h2 className="mb-3 text-base font-semibold dark:text-white sm:mb-4 sm:text-lg">
								Upload Your Resume
							</h2>
							<Tabs defaultValue="upload" className="w-full">
								<TabsList className="grid w-full grid-cols-3 bg-gray-100 dark:bg-gray-800">
									<TabsTrigger value="upload" className="text-xs sm:text-sm">
										Upload PDF
									</TabsTrigger>
									<TabsTrigger value="paste" className="text-xs sm:text-sm">
										Paste Text
									</TabsTrigger>
									<TabsTrigger
										value="import"
										disabled
										className="text-xs sm:text-sm"
									>
										Import
										<Badge
											variant="outline"
											className="ml-1 border-indigo-200 bg-indigo-100/50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 sm:ml-2"
										>
											<span className="text-[10px] sm:text-xs">Soon</span>
										</Badge>
									</TabsTrigger>
								</TabsList>

								<TabsContent
									value="upload"
									className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
								>
									<div
										ref={dropAreaRef}
										className={cn(
											'relative overflow-hidden rounded-lg border-2 border-dashed p-4 text-center transition-colors sm:p-8',
											dragActive
												? 'border-indigo-500 bg-indigo-50 dark:border-indigo-600 dark:bg-indigo-900/20'
												: 'border-gray-300 hover:border-indigo-400 dark:border-gray-700 dark:hover:border-indigo-700',
											isUploading && 'pointer-events-none opacity-60',
										)}
										onDragOver={handleDragOver}
										onDragLeave={handleDragLeave}
										onDrop={handleDrop}
										onClick={() => fileInputRef.current?.click()}
									>
										<input
											ref={fileInputRef}
											type="file"
											accept=".pdf"
											className="hidden"
											onChange={handleFileUpload}
										/>
										<div className="flex flex-col items-center justify-center">
											<div className="mb-2 rounded-full bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 sm:mb-3 sm:p-3">
												<UploadCloud className="h-5 w-5 sm:h-7 sm:w-7" />
											</div>
											<h3 className="mb-1 text-sm font-medium text-gray-900 dark:text-white sm:text-base">
												{dragActive
													? 'Drop your PDF here'
													: 'Upload your resume'}
											</h3>
											<p className="mb-3 text-xs text-gray-500 dark:text-gray-400 sm:mb-4 sm:text-sm">
												Drag and drop or click to browse
											</p>
											<Button
												type="button"
												variant="outline"
												size="sm"
												className="bg-white text-xs dark:bg-gray-800 sm:text-sm"
												onClick={(e) => {
													e.stopPropagation()
													fileInputRef.current?.click()
												}}
												disabled={isUploading}
											>
												Select PDF file
											</Button>
										</div>
									</div>

									{/* Upload Progress */}
									{isUploading && (
										<div className="mt-4 space-y-2 rounded-lg border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900 sm:mt-6 sm:space-y-3 sm:p-4">
											<div className="flex items-center justify-between">
												<h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 sm:text-sm">
													Processing Resume
												</h4>
												<div className="flex items-center">
													<Loader2 className="mr-1.5 h-3 w-3 animate-spin text-indigo-500 dark:text-indigo-400 sm:mr-2 sm:h-4 sm:w-4" />
													<span className="text-xs font-medium text-indigo-600 dark:text-indigo-400">
														{progressPercentage}%
													</span>
												</div>
											</div>

											<Progress
												value={progressPercentage}
												max={100}
												className="h-1.5 bg-gray-100 dark:bg-gray-800 sm:h-2"
											/>

											<div className="max-h-[30vh] overflow-y-auto">
												<ul className="space-y-1 text-xs sm:text-sm">
													{uploadProgress.map((step, index) => (
														<li
															key={index}
															className="flex items-center text-gray-700 dark:text-gray-300"
														>
															<Check className="mr-1.5 h-3 w-3 flex-shrink-0 text-emerald-500 sm:mr-2 sm:h-4 sm:w-4" />
															<span>{step}</span>
														</li>
													))}
												</ul>
											</div>
										</div>
									)}
								</TabsContent>

								<TabsContent
									value="paste"
									className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
								>
									<Textarea
										placeholder="Paste your resume content here..."
										className="min-h-[150px] bg-white text-gray-900 dark:bg-gray-800 dark:text-white sm:min-h-[200px]"
										value={resumeText}
										onChange={(e) => setResumeText(e.target.value)}
									/>
								</TabsContent>

								<TabsContent
									value="import"
									className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
								>
									<div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-800 sm:p-8">
										<div className="mb-2 rounded-full bg-gray-100 p-2 text-gray-400 dark:bg-gray-800 sm:mb-3 sm:p-3">
											<LinkIcon className="h-5 w-5 sm:h-7 sm:w-7" />
										</div>
										<p className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
											Import from LinkedIn, Google Drive or other sources coming
											soon!
										</p>
									</div>
								</TabsContent>
							</Tabs>

							{/* Saved Resumes */}
							{savedResumes.length > 0 && (
								<div className="mt-6 sm:mt-8">
									<h3 className="mb-2 text-xs font-medium text-gray-700 dark:text-gray-300 sm:mb-3 sm:text-sm">
										Recent Resumes
									</h3>
									<div className="max-h-[30vh] space-y-1.5 overflow-y-auto rounded-lg border border-gray-200 p-1.5 dark:border-gray-800 sm:space-y-2 sm:p-2">
										{savedResumes.map((resume) => (
											<Card
												key={resume.id}
												className={cn(
													'cursor-pointer border-0 transition-all',
													selectedResume?.id === resume.id
														? 'bg-indigo-50 dark:bg-indigo-900/30'
														: 'dark:hover:bg-gray-750 bg-white hover:bg-gray-50 dark:bg-gray-800',
												)}
												onClick={() => handleResumeSelect(resume)}
											>
												<div className="flex items-center gap-2 p-2 sm:gap-3 sm:p-3">
													<div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-400 sm:h-9 sm:w-9">
														<File className="h-3.5 w-3.5 sm:h-5 sm:w-5" />
													</div>
													<div className="min-w-0 flex-1">
														<p className="truncate text-xs font-medium text-gray-900 dark:text-white sm:text-sm">
															{(resume.content?.name as string) ||
																`Resume ${resume.id}`}
														</p>
														<p className="text-[10px] text-gray-500 dark:text-gray-400 sm:text-xs">
															{new Date(resume.createdAt).toLocaleDateString()}
														</p>
													</div>
													{selectedResume?.id === resume.id && (
														<Check className="h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400 sm:h-5 sm:w-5" />
													)}
												</div>
											</Card>
										))}
									</div>
								</div>
							)}

							<div className="mt-6 flex justify-end sm:mt-8">
								<Button
									onClick={handleNextStep}
									disabled={!selectedResume && !resumeText}
									className="h-8 gap-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 sm:h-10 sm:gap-2 sm:text-sm"
								>
									Continue
									<ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
								</Button>
							</div>
						</div>
					)}

					{/* Step 2: Job Context */}
					{currentStep === 2 && (
						<div>
							<h2 className="mb-3 text-base font-semibold dark:text-white sm:mb-4 sm:text-lg">
								Job Context{' '}
								<span className="text-xs font-normal text-gray-500 dark:text-gray-400 sm:text-sm">
									(Optional)
								</span>
							</h2>
							<Tabs defaultValue="paste" className="w-full">
								<TabsList className="grid w-full grid-cols-2 bg-gray-100 dark:bg-gray-800">
									<TabsTrigger value="paste" className="text-xs sm:text-sm">
										Paste Text
									</TabsTrigger>
									<TabsTrigger
										value="import"
										disabled
										className="text-xs sm:text-sm"
									>
										Import
										<Badge
											variant="outline"
											className="ml-1 border-indigo-200 bg-indigo-100/50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400 sm:ml-2"
										>
											<span className="text-[10px] sm:text-xs">Soon</span>
										</Badge>
									</TabsTrigger>
								</TabsList>

								<TabsContent
									value="paste"
									className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
								>
									<Textarea
										placeholder="Paste job description or context here..."
										className="min-h-[150px] bg-white text-gray-900 dark:bg-gray-800 dark:text-white sm:min-h-[200px]"
										value={jobContextText}
										onChange={(e) => setJobContextText(e.target.value)}
									/>
								</TabsContent>

								<TabsContent
									value="import"
									className="mt-3 space-y-3 sm:mt-4 sm:space-y-4"
								>
									<div className="flex flex-col items-center justify-center rounded-lg border border-gray-200 p-4 dark:border-gray-800 sm:p-8">
										<div className="mb-2 rounded-full bg-gray-100 p-2 text-gray-400 dark:bg-gray-800 sm:mb-3 sm:p-3">
											<LinkIcon className="h-5 w-5 sm:h-7 sm:w-7" />
										</div>
										<p className="text-center text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
											Import from job sites, LinkedIn or other sources coming
											soon!
										</p>
									</div>
								</TabsContent>
							</Tabs>

							<div className="mt-6 flex justify-end space-x-3 sm:mt-8">
								<Button
									variant="outline"
									onClick={handleSkip}
									className="dark:hover:bg-gray-750 h-8 border-gray-200 bg-white text-xs text-gray-700 hover:bg-gray-50 hover:text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:text-white sm:h-10 sm:text-sm"
								>
									Skip
								</Button>
								<Button
									onClick={handleNextStep}
									className="h-8 gap-1 bg-indigo-600 text-xs text-white hover:bg-indigo-700 dark:bg-indigo-700 dark:hover:bg-indigo-600 sm:h-10 sm:gap-2 sm:text-sm"
								>
									Complete
									<Check className="h-3 w-3 sm:h-4 sm:w-4" />
								</Button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	)
}
