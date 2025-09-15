import fastifyCors from '@fastify/cors'
import fastifyJwt from '@fastify/jwt'
import fastifySwagger from '@fastify/swagger'
import fastifySwaggerUi from '@fastify/swagger-ui'
import { env } from '@saas/env'
import { fastify } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import {
	jsonSchemaTransform,
	serializerCompiler,
	validatorCompiler,
} from 'fastify-type-provider-zod'

import { errorHandler } from './error-handler'
import { deleteEmailChangeToken } from './routes/account/cancel-email-change'
import { checkEmailChange } from './routes/account/check-email-change'
import { confirmEmailChangeToken } from './routes/account/confirm-email-change'
import { deleteAccount } from './routes/account/delete-account'
import { getProfile } from './routes/account/get-profile'
import { connectGitHub } from './routes/account/providers/connect-github'
import { connectGoogle } from './routes/account/providers/connect-google'
import { removeAccountProvider } from './routes/account/remove-provider'
import { updateAccount } from './routes/account/update-account'
import { updatePassword } from './routes/account/update-password'
import { authenticateWithGitHub } from './routes/auth/authenticate-with-github'
import { authenticateWithGoogle } from './routes/auth/authenticate-with-google'
import { authenticateWithPassword } from './routes/auth/authenticate-with-password'
import { createAccount } from './routes/auth/create-account'
import { requestPasswordRecover } from './routes/auth/request-password-recover'
import { resendEmailValidationCode } from './routes/auth/resend-email-validation-code'
import { resetPassword } from './routes/auth/reset-password'
import { verifyEmailAndAuthenticate } from './routes/auth/verify-email-and-authenticate'
import { getOrganizationBilling } from './routes/billing/get-organization-billing'
import { acceptInvite } from './routes/invites/accept-invite'
import { createInvite } from './routes/invites/create-invite'
import { getInvite } from './routes/invites/get-invite'
import { getInvites } from './routes/invites/get-invites'
import { getPendingInvites } from './routes/invites/get-pending-invites'
import { rejectInvite } from './routes/invites/reject-invite'
import { revokeInvite } from './routes/invites/revoke-invite'
import { livekitRoutes } from './routes/livekit/create-room'
import { getMembers } from './routes/members/get-members'
import { removeMember } from './routes/members/remove-member'
import { updateMember } from './routes/members/update-member'
import { authorizeDomain } from './routes/organization/authorize-domain'
import { creteOrganization } from './routes/organization/create-organization'
import { getMemebership } from './routes/organization/get-membership'
import { getOrganization } from './routes/organization/get-organization'
import { getOrganizations } from './routes/organization/get-organizations'
import { removeDomain } from './routes/organization/remove-domain'
import { shutdownOrganization } from './routes/organization/shutdown-organization'
import { transferOrganization } from './routes/organization/transfer-organization'
import { updateOrganization } from './routes/organization/update-organization'
import { createProject } from './routes/projects/create-project'
import { deleteProject } from './routes/projects/delete-project'
import { getProject } from './routes/projects/get-project'
import { getProjects } from './routes/projects/get-projects'
import { updateProject } from './routes/projects/update-project'
import { parseJobPosting } from './routes/resume/parse-posting'
import {
	generateInterviewQuestions,
	parseResume,
} from './routes/resume/parse-resume'
import { uploadAvatar } from './routes/upload-avatar'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setSerializerCompiler(serializerCompiler)
app.setValidatorCompiler(validatorCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifySwagger, {
	openapi: {
		info: {
			title: 'Next.js Fastify Saas RBAC',
			description: 'Full-stack SaaS app with multi-tenant and RBAC.',
			version: '1.0.0',
		},
		components: {
			securitySchemes: {
				bearerAuth: {
					type: 'http',
					scheme: 'bearer',
					bearerFormat: 'JWT',
				},
			},
		},
	},
	transform: jsonSchemaTransform,
})

app.register(fastifySwaggerUi, {
	routePrefix: '/docs',
})

const allowedOrigins = [
	'https://intervita-app-web.vercel.app',
	'https://intervita.io',
	'http://localhost:3000',
]

app.register(fastifyCors, {
	origin: (origin, callback) => {
		// Allow requests with no origin (like mobile apps or curl requests)
		if (!origin) {
			callback(null, true)
			return
		}

		// In development, allow all origins
		if (env.NEXT_PUBLIC_URL.includes('http://localhost')) {
			callback(null, true)
			return
		}

		if (allowedOrigins.includes(origin)) {
			// In production, only allow origins from the list
			callback(null, true)
		} else {
			// Block other origins in production
			callback(
				new Error(
					`Not allowed by CORS. Origin: ${origin} is not in the list of allowed origins.`,
				),
				false,
			)
		}
	},
	methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
	allowedHeaders: ['Content-Type', 'Authorization'],
	credentials: true,
})

app.register(fastifyJwt, {
	secret: {
		public: Buffer.from(env.JWT_PUBLIC_KEY, 'base64'),
		private: Buffer.from(env.JWT_SECRET_KEY, 'base64'),
	},
	sign: {
		algorithm: 'RS256',
	},
})

app.register(createAccount)
app.register(authenticateWithPassword)
app.register(authenticateWithGitHub)
app.register(authenticateWithGoogle)
app.register(requestPasswordRecover)
app.register(resetPassword)
app.register(verifyEmailAndAuthenticate)
app.register(resendEmailValidationCode)

app.register(getProfile)
app.register(updateAccount)
app.register(updatePassword)
app.register(removeAccountProvider)
app.register(deleteAccount)
app.register(checkEmailChange)
app.register(deleteEmailChangeToken)
app.register(confirmEmailChangeToken)

app.register(connectGitHub)
app.register(connectGoogle)

app.register(creteOrganization)
app.register(getMemebership)
app.register(getOrganizations)
app.register(getOrganization)
app.register(updateOrganization)
app.register(shutdownOrganization)
app.register(transferOrganization)
app.register(authorizeDomain)
app.register(removeDomain)

app.register(getMembers)
app.register(updateMember)
app.register(removeMember)

app.register(createInvite)
app.register(getInvites)
app.register(getInvite)
app.register(acceptInvite)
app.register(rejectInvite)
app.register(revokeInvite)
app.register(getPendingInvites)

app.register(getOrganizationBilling)

app.register(createProject)
app.register(deleteProject)
app.register(getProject)
app.register(getProjects)
app.register(updateProject)

app.register(uploadAvatar)
app.register(livekitRoutes)

// Resume parsing routes
app.register(parseResume)
app.register(generateInterviewQuestions)
app.register(parseJobPosting)
app
	.listen({
		port: env.PORT,
		host: '0.0.0.0',
	})
	.then(() => console.log('✅ HTTP server is running.'))

// Set global timeout for requests
app.server.requestTimeout = 120000 // 2 minutes
