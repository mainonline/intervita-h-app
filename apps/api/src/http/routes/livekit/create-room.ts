import { env } from '@saas/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk'
import { v4 as uuidv4 } from 'uuid'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'

import { BadRequestError } from '../_errors/bad-request-error'

export async function livekitRoutes(app: FastifyInstance) {
	// Create a LiveKit room service client
	const roomService = new RoomServiceClient(
		env.LIVEKIT_HOST,
		env.LIVEKIT_API_KEY,
		env.LIVEKIT_API_SECRET,
	)

	// Function to create a LiveKit access token
	const _createAccessToken = (
		identity: string,
		roomName: string,
		ttl: string,
		metadata: string,
	) => {
		const accessToken = new AccessToken(
			env.LIVEKIT_API_KEY,
			env.LIVEKIT_API_SECRET,
			{
				identity,
				ttl,
				metadata,
			},
		)

		// Add permissions to join the room
		accessToken.addGrant({
			roomJoin: true,
			room: roomName,
			canPublish: true,
			canSubscribe: true,
		})

		return accessToken.toJwt()
	}

	// export async function createRoom(
	// 	metadata: RoomTokenMetadata,
	// ): Promise<RoomResponse> {
	// 	const result = await API.post(`room`, {
	// 		json: {
	// 			metadata,
	// 		},
	// 	}).json<RoomResponse>()

	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.post(
			'/room',
			{
				schema: {
					tags: ['LiveKit'],
					summary: 'Create a new LiveKit room',
					security: [{ bearerAuth: [] }],
					body: z.object({
						metadata: z.string(),
					}),
					response: {
						201: z.object({
							room: z.string(),
							token: z.string(),
						}),
					},
				},
			},
			async (request, reply) => {
				try {
					const emptyTimeout = 10 * 60 // 10 minutes
					const maxParticipants = 2

					const roomName = uuidv4()

					// Create a room with specified options
					const room = await roomService.createRoom({
						name: roomName,
						emptyTimeout,
						maxParticipants,
					})

					const userId = await request.getCurrentUserId()
					const token = await _createAccessToken(
						userId,
						roomName,
						'10m',
						request.body.metadata,
					) // Token valid for 10 minutes

					return reply.status(201).send({ room: room.name, token })
				} catch (error) {
					console.error('Error creating room:', error)
					throw new BadRequestError('Failed to create room')
				}
			},
		)
}
