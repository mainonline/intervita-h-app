import fastifyMultipart from '@fastify/multipart'
import { env } from '@saas/env'
import type { Resume } from '@saas/env/types'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { OpenAI } from 'openai'
import pdfParse from 'pdf-parse'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import {
	interviewQuestionsSystemMessage,
	parseResumeSystemMessage,
} from '@/http/prompts/resume'
import { prisma } from '@/lib/prisma'

import { BadRequestError } from '../_errors/bad-request-error'

const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY,
})

/**
 * Extract text content from a PDF file
 */
async function extractTextFromPdf(fileBuffer: Buffer): Promise<string> {
	try {
		const data = await pdfParse(fileBuffer)
		return data.text
	} catch (error) {
		throw new BadRequestError('Unable to parse resume')
	}
}

/**
 * Analyze resume text using OpenAI GPT-4o mini to extract structured information
 */
async function analyzeResume(text: string): Promise<Resume> {
	try {
		// Call the OpenAI API
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: parseResumeSystemMessage },
				{ role: 'user', content: `Parse this resume:\n\n${text}` },
			],
		})

		// Return the parsed response
		return JSON.parse(response.choices[0].message.content || '{}') as Resume
	} catch (error) {
		console.error(`Resume analysis error: ${error}`)
		throw new BadRequestError('Unable to parse resume')
	}
}

/**
 * Generate interview questions based on resume and optional job description
 */
async function generateQuestions(
	resumeData: Resume,
	jobDescription?: string,
): Promise<string[]> {
	try {
		// Dynamic prompt content based on whether jobDescription is provided
		const promptContent = jobDescription
			? `
        Generate relevant interview questions based on the provided resume data and job description. Use the resume to identify the candidate's strengths, experiences, and skills, and align the questions with the job's requirements and responsibilities.

        Resume data (JSON): ${JSON.stringify(resumeData)}
        Job description: ${jobDescription}
      `
			: `
        Generate relevant interview questions based solely on the provided resume data. Focus on the candidate's skills, experiences, and achievements to assess their potential fit for a role.

        Resume data (JSON): ${JSON.stringify(resumeData)}
      `

		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini',
			response_format: { type: 'json_object' },
			messages: [
				{
					role: 'system',
					content: interviewQuestionsSystemMessage,
				},
				{ role: 'user', content: promptContent },
			],
		})

		// Parse and return the questions
		const parsedResponse = JSON.parse(
			response.choices[0].message.content || '{"questions":[]}',
		)
		return parsedResponse.questions || []
	} catch (error) {
		console.error(`Question generation error: ${error}`)
		throw new BadRequestError('Unable to generate interview questions')
	}
}

export async function parseResume(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.register(fastifyMultipart)
		.post(
			'/resume/parse',
			{
				schema: {
					tags: ['Resume'],
					summary: 'Parse a resume PDF and extract structured information',
					security: [{ bearerAuth: [] }],
					response: {
						201: z.record(z.any()),
					},
					querystring: z.object({
						stream: z.string().transform((value) => value === '1'),
					}),
				},
			},
			async (request, reply) => {
				const { stream = false } = request.query

				const file = await request.file({
					limits: {
						fileSize: 5 * 1024 * 1024, // 5MB
					},
				})

				if (!file) {
					throw new BadRequestError('No file uploaded')
				}

				if (!file.mimetype.includes('pdf')) {
					throw new BadRequestError('File must be a PDF')
				}

				const jobDescription =
					request.body &&
					typeof request.body === 'object' &&
					'jobDescription' in request.body
						? String(request.body.jobDescription)
						: undefined

				if (stream) {
					// Get the origin from the request headers
					const origin = request.headers.origin
					const allowedOrigins = [
						'https://intervita-app-web.vercel.app',
						'https://intervita.io',
						'http://localhost:3000',
					]

					// Determine the allowed origin for CORS
					const allowedOrigin =
						origin && allowedOrigins.includes(origin)
							? origin
							: 'https://intervita.io' // fallback to production domain

					reply.raw.writeHead(200, {
						'Content-Type': 'text/event-stream',
						'Cache-Control': 'no-cache',
						Connection: 'keep-alive',
						'Access-Control-Allow-Origin': allowedOrigin,
						'Access-Control-Allow-Credentials': 'true',
						'Access-Control-Allow-Methods': 'POST',
						'Access-Control-Allow-Headers': 'Content-Type',
					})

					const sendEvent = (event: string, data: unknown) => {
						reply.raw.write(
							`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
						)
					}

					try {
						const fileBuffer = await file.toBuffer()
						sendEvent('progress', {
							step: 1,
							message: 'File received successfully',
						})

						sendEvent('progress', {
							step: 2,
							message: 'Extracting text from resume',
						})
						const text = await extractTextFromPdf(fileBuffer)
						sendEvent('progress', {
							step: 3,
							message: 'Text extraction complete',
						})

						sendEvent('progress', {
							step: 4,
							message: 'Analyzing resume with fine-tuned models',
						})
						const resumeData = await analyzeResume(text)
						sendEvent('data', { type: 'resume', data: resumeData })

						sendEvent('progress', {
							step: 5,
							message: 'Generating interview questions',
						})
						const questions = await generateQuestions(
							resumeData,
							jobDescription,
						)
						sendEvent('data', { type: 'questions', data: questions })

						sendEvent('complete', { message: 'Processing complete' })
						reply.raw.end()
						return
					} catch (error) {
						sendEvent('error', { message: 'Error processing resume' })
						reply.raw.end()
						return
					}
				}

				try {
					const fileBuffer = await file.toBuffer()
					const text = await extractTextFromPdf(fileBuffer)
					console.log(
						`Successfully extracted text from resume: ${file.filename}`,
					)

					const resumeData = await analyzeResume(text)
					const questions = await generateQuestions(resumeData, jobDescription)

					return reply.status(201).send({
						resume: resumeData,
						questions,
					})
				} catch (error) {
					console.error(`Error processing resume: ${error}`)
					throw new BadRequestError('Unable to parse resume')
				}
			},
		)
}

/**
 * Separate endpoint just for generating questions from an existing resume and job description
 */
export async function generateInterviewQuestions(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		'/resume/questions',
		{
			schema: {
				tags: ['Resume'],
				summary:
					'Generate interview questions based on resume data and optional job description',
				security: [{ bearerAuth: [] }],
				body: z.object({
					resumeData: z
						.record(z.any())
						.transform((data) => data as unknown as Resume),
					jobDescription: z.string().optional(),
				}),
				response: {
					201: z.object({
						questions: z.array(z.string()),
					}),
				},
			},
		},
		async (request, reply) => {
			const { resumeData, jobDescription } = request.body

			try {
				const questions = await generateQuestions(resumeData, jobDescription)
				return reply.status(201).send({ questions })
			} catch (error) {
				console.error(`Error generating questions: ${error}`)
				throw new BadRequestError('Unable to generate interview questions')
			}
		},
	)
}

export async function getResumes(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth)
		.get(
			'/resume/:uid/list',
			{
				schema: {
					tags: ['Resumes'],
					summary: 'Get all resumes',
					security: [{ bearerAuth: [] }],
					params: z.object({
						id: z.string(),
					}),
					response: {
						201: z.object({
							resumes: z.array(
								z.object({
									id: z.string(),
									fileUrl: z.string().nullable(),
									content: z.any(),
									createdAt: z.date(),
									updatedAt: z.date(),
									userId: z.string(),
								}),
							),
						}),
					},
				},
			},
			async (request, reply) => {
				const { id } = request.params
				const resumes = await prisma.resume.findMany({
					where: {
						id,
					},
				})
				return reply.status(201).send({ resumes })
			},
		)
}
