import type { RoomTokenMetadata } from '@saas/env/types'

import { API } from '@/lib/api-client'
interface RoomResponse {
	room: string
	token: string
}

export async function createRoom(
	metadata: RoomTokenMetadata,
): Promise<RoomResponse> {
	const result = await API.post(`room`, {
		json: {
			metadata: JSON.stringify(metadata),
		},
	}).json<RoomResponse>()

	return result
}
