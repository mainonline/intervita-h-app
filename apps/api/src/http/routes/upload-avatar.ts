/* eslint-disable prettier/prettier */

import fastifyMultipart from '@fastify/multipart'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import z from 'zod'

import { errors } from '@/errors/messages'
import { auth } from '@/http/middlewares/auth'
import { deleteObjectR2, putObjectR2 } from '@/lib/cloudflare-r2'
import { prisma } from '@/lib/prisma'
import { generateAvatar } from '@/utils/generate-avatar'

import { BadRequestError } from './_errors/bad-request-error'

export async function uploadAvatar(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.register(fastifyMultipart)
		.post(
			'/upload/avatar/:userUID',
			{
				schema: {
					tags: ['Upload'],
					summary: 'Upload user avatar image',
					security: [{ bearerAuth: [] }],
					params: z.object({
						userId: z.string().uuid(),
					}),
				},
			},
			async (request, reply) => {
				// Get the user ID from authenticated request
				const userId = request.params.userId

				const file = await request.file({
					limits: {
						fileSize: 1000 * 100 * 10 * 2, // ~2mb
					},
				})

				const { fileName, mimeType, fileBuffer } = await generateAvatar(
					app,
					file,
				)

				try {
					await putObjectR2(fileName, mimeType, fileBuffer)
				} catch (error) {
					console.error(error)
					throw new BadRequestError(errors.files.UPLOAD)
				}

				const user = await prisma.user.findUnique({
					where: {
						id: userId,
					},
				})

				// Delete old avatar if exists
				if (user && user.avatarUrl) {
					try {
						const oldFileName = user.avatarUrl.split('/').pop()
						if (oldFileName) {
							await deleteObjectR2(oldFileName)
						}
					} catch (error) {
						console.error('Failed to delete old avatar:', error)
						// Continue with avatar update even if old file deletion fails
					}
				}

				// Update user with new avatar URL
				await prisma.user.update({
					where: {
						id: userId,
					},
					data: {
						avatarUrl: fileName,
					},
				})

				return reply.status(201).send({
					avatarUrl: fileName,
				})
			},
		)
}
