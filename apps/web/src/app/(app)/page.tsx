import { cookies } from 'next/headers'

import { Header } from '@/components/header'
import Interview from '@/components/playground/Interview'
import { TriggerToastLoad } from '@/components/trigger-toast-load'

export default async function Home() {
	const cookieStore = await cookies()

	const transferedOrganizationMessage = cookieStore.get(
		'@SAAS:transferedOrganization',
	)
	const deletedOrganizationMessage = cookieStore.get(
		'@SAAS:deletedOrganization',
	)

	return (
		<div className="flex min-h-svh flex-col px-5 md:px-8">
			<Header />

			{deletedOrganizationMessage && (
				<TriggerToastLoad
					message={deletedOrganizationMessage.value}
					type="success"
				/>
			)}

			{transferedOrganizationMessage && (
				<TriggerToastLoad
					message={transferedOrganizationMessage.value}
					type="success"
				/>
			)}

			<main className="mx-auto flex w-full max-w-[1200px] items-center py-2">
				<Interview />
			</main>
		</div>
	)
}
