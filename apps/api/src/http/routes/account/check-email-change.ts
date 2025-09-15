import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { z } from 'zod'

import { auth } from '@/http/middlewares/auth'
import { prisma } from '@/lib/prisma'
import { tokensSchema } from '@/schemas/tokens-schema'

export async function checkEmailChange(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/users/email',
			{
				schema: {
					tags: ['Account'],
					summary:
						'Check if there is an open validation change to user e-mail.',
					security: [{ bearerAuth: [] }],
					response: {
						200: z.object({
							token: z
								.object({
									userId: z.string(),
									type: tokensSchema,
									payload: z.string().email().nullable(),
									createdAt: z.date(),
								})
								.nullable(),
						}),
					},
				},
			},
			async (request, reply) => {
				const userId = await request.getCurrentUserId()

				const token = await prisma.token.findFirst({
					where: {
						user: {
							id: userId,
						},
						type: 'EMAIL_CHANGE_VALIDATION',
					},
					select: {
						type: true,
						createdAt: true,
						payload: true,
						userId: true,
					},
				})

				return reply.status(200).send({
					token,
				})
			},
		)
}
