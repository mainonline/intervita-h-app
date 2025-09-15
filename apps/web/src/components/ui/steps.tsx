'use client'

import { Check } from 'lucide-react'
import * as React from 'react'

import { cn } from '@/lib/utils'

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
	steps: ReadonlyArray<{
		id: string
		name: string
		status: 'complete' | 'current' | 'upcoming'
	}>
}

export function Steps({ steps, className, ...props }: StepsProps) {
	return (
		<div className={cn('w-full', className)} {...props}>
			<ol
				role="list"
				className="flex flex-col space-y-3 sm:flex-row sm:space-x-6 sm:space-y-0 md:space-x-8"
			>
				{steps.map((step, index) => (
					<li key={step.id} className="relative flex-1">
						<div
							className={cn(
								'flex items-start py-2 transition-colors sm:items-center sm:py-0',
								{
									'border-primary': step.status === 'current',
								},
							)}
						>
							<span className="flex h-full shrink-0 items-center">
								<span
									className={cn(
										'flex h-8 w-8 items-center justify-center rounded-full border-2 text-center text-sm font-medium shadow-sm transition-all duration-200 sm:h-9 sm:w-9',
										{
											'border-indigo-500 bg-indigo-600 text-white dark:border-indigo-400 dark:bg-indigo-500':
												step.status === 'current',
											'border-emerald-500 bg-emerald-500 text-white dark:border-emerald-400 dark:bg-emerald-500':
												step.status === 'complete',
											'border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400':
												step.status === 'upcoming',
										},
									)}
								>
									{step.status === 'complete' ? (
										<Check className="h-5 w-5 text-white" />
									) : (
										<span>{index + 1}</span>
									)}
								</span>
							</span>

							<span className="ml-3 flex min-w-0 flex-col text-sm">
								<span
									className={cn('font-medium', {
										'text-gray-900 dark:text-white': step.status === 'current',
										'text-emerald-600 dark:text-emerald-400':
											step.status === 'complete',
										'text-gray-500 dark:text-gray-400':
											step.status === 'upcoming',
									})}
								>
									{step.name}
								</span>
							</span>

							{/* Mobile connector line that goes down vertically */}
							{index < steps.length - 1 && (
								<div className="absolute left-4 top-10 h-full w-0.5 bg-gray-200 dark:bg-gray-700 sm:hidden">
									<div
										className={cn('h-full w-full', {
											'bg-indigo-600 dark:bg-indigo-500':
												step.status === 'current',
											'bg-emerald-500': step.status === 'complete',
										})}
										style={{
											width: '100%',
											height:
												step.status === 'complete'
													? '100%'
													: step.status === 'current'
														? '50%'
														: '0%',
										}}
									/>
								</div>
							)}

							{/* Desktop connector line */}
							{index < steps.length - 1 && (
								<div className="hidden h-0.5 flex-1 bg-gray-200 dark:bg-gray-700 sm:ml-6 sm:block">
									<div
										className={cn('h-full', {
											'bg-indigo-600 dark:bg-indigo-500':
												step.status === 'current',
											'bg-emerald-500': step.status === 'complete',
										})}
										style={{
											width:
												step.status === 'complete'
													? '100%'
													: step.status === 'current'
														? '50%'
														: '0%',
										}}
									/>
								</div>
							)}
						</div>
					</li>
				))}
			</ol>
		</div>
	)
}
