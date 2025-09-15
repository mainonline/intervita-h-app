import type { Metadata } from 'next'
import { redirect } from 'next/navigation'

import { isAuthenticated } from '@/auth'
import { ConfigProvider } from '@/hooks/useConfig'
import { ConnectionProvider } from '@/hooks/useConnection'
export const metadata: Metadata = {
	title: {
		template: '%s | Next.js + RBAC',
		default: 'Dashboard',
	},
}

type AppLayoutProps = Readonly<{
	children: React.ReactNode
	dialog: React.ReactNode
}>

export default function AppLayout({ children, dialog }: AppLayoutProps) {
	if (!isAuthenticated()) {
		redirect('/auth/sign-in')
	}

	return (
		<ConfigProvider>
			<ConnectionProvider>
				{children}
				{dialog}
			</ConnectionProvider>
		</ConfigProvider>
	)
}
