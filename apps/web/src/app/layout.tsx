import '@/app/styles/globals.css'

import type { Metadata } from 'next'

import { Providers } from './providers'

export const metadata: Metadata = {
	title: {
		template: '%s | InterVita - AI Interview Practice',
		default: 'InterVita - Practice Interviews with AI',
	},
	description:
		'Prepare for job interviews with AI-powered practice sessions. Get feedback, improve your responses, and track your progress.',
	keywords: [
		'interview practice',
		'job interview preparation',
		'AI interview',
		'mock interview',
		'interview feedback',
		'technical interview',
	],
	creator: 'InterVita',
	openGraph: {
		type: 'website',
		locale: 'en_US',
		url: 'https://intervita.io',
		siteName: 'InterVita',
		title: 'InterVita - AI-Powered Interview Practice',
		description:
			'Ace your next interview with personalized AI practice sessions',
		images: [
			{
				url: '/og-image.png',
				width: 1200,
				height: 630,
				alt: 'InterVita - Practice Interviews with AI',
			},
		],
	},
	twitter: {
		card: 'summary_large_image',
		title: 'InterVita - AI Interview Practice',
		description: 'Prepare for job interviews with personalized AI feedback',
		images: ['/twitter-image.jpg'],
	},
	robots: {
		index: true,
		follow: true,
		googleBot: {
			index: true,
			follow: true,
			'max-image-preview': 'large',
			'max-snippet': -1,
		},
	},
	icons: [
		{
			url: '/favicon-light.svg',
			media: '(prefers-color-scheme: light)',
			rel: 'icon',
			type: 'image/svg+xml',
		},
		{
			url: '/favicon-dark.svg',
			media: '(prefers-color-scheme: dark)',
			rel: 'icon',
			type: 'image/svg+xml',
		},
		{
			url: '/apple-touch-icon.png',
			rel: 'apple-touch-icon',
			sizes: '180x180',
			type: 'image/png',
		},
		{
			url: '/favicon-96x96.png',
			rel: 'icon',
			sizes: '96x96',
			type: 'image/png',
		},
		{
			url: '/favicon.ico',
			rel: 'shortcut icon',
			type: 'image/x-icon',
			sizes: '16x16 32x32 48x48',
		},
	],
}

type RootLayoutProps = Readonly<{
	children: React.ReactNode
}>

export default function RootLayout({ children }: RootLayoutProps) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body suppressHydrationWarning>
				<Providers>{children}</Providers>
			</body>
		</html>
	)
}
