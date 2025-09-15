import { API } from '@/lib/api-client'

interface CreateInviteRequest {
	userId: string
	formData: FormData
}

type CreateInviteResponse = void

export async function updateAvatar({
	userId,
	formData,
}: CreateInviteRequest): Promise<CreateInviteResponse> {
	await API.post(`upload/avatar/${userId}`, {
		body: formData,
	})
}
