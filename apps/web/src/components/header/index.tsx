import Image from 'next/image'
import Link from 'next/link'

import brandLogo from '@/assets/brand-logo.svg'

import { PendingInvites } from '../pending-invites'
import { Separator } from '../ui/separator'
import { ProfileButton } from './profile-button'
import { ThemeSwitcher } from './theme-switcher'

export async function Header() {
	return (
		<header className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-between border-b py-3">
			<Link
				href="/"
				className="order-1 shrink-0 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-primary"
			>
				<Image
					src={brandLogo}
					alt=""
					className="size-9 select-none dark:invert md:size-9 lg:size-10"
					priority
				/>
			</Link>

			<div className="order-2 flex items-center gap-1 md:order-3">
				<PendingInvites />
				<ThemeSwitcher />
				<Separator
					orientation="vertical"
					className="ml-1 mr-2 h-5 sm:ml-2 sm:mr-3"
				/>
				<ProfileButton />
			</div>
		</header>
	)
}
