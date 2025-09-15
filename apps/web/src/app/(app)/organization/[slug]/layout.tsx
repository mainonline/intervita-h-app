import { Header } from '@/components/header'
import { Tabs } from '@/components/tabs'

type AppLayoutProps = Readonly<{
	children: React.ReactNode
}>

export default function OrganizationLayout({ children }: AppLayoutProps) {
	return (
		<div className="flex min-h-svh flex-col px-5 md:px-8">
			<Header />
			<Tabs />

			<main className="mx-auto flex w-full max-w-[1200px] flex-grow items-center py-6 sm:py-8">
				{children}
			</main>
		</div>
	)
}
