// import { createHash } from 'node:crypto'
import { env } from '@saas/env'

/**
 * Get a avatar with a fallback from Gravatar:
 * @param avatarUrl provide a custom avatar url.
 * @param gravatarEmail provide an email to search for an avatar on Gravatar.
 * @returns an avatar url or a Gravatar fallback.
 */
export function getAvatarUrl(avatarUrl?: string | null) {
	if (avatarUrl) return `${env.NEXT_PUBLIC_CLOUDFLARE_URL}/${avatarUrl}`

	return avatarUrl ?? undefined
}
