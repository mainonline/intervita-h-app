/* eslint-disable prettier/prettier */
import { env } from "@saas/env";
import type { FastifyInstance } from "fastify";
import type { ZodTypeProvider } from "fastify-type-provider-zod";
import { z } from "zod";

import { errors } from "@/errors/messages";
import { prisma } from "@/lib/prisma";

import { BadRequestError } from "../_errors/bad-request-error";

export async function authenticateWithGitHub(app: FastifyInstance) {
	app.withTypeProvider<ZodTypeProvider>().post(
		"/sessions/github",
		{
			schema: {
				tags: ["Auth"],
				summary: "Authenticate with GitHub.",
				body: z.object({
					code: z.string(),
				}),
				response: {
					201: z.object({
						token: z.string(),
					}),
				},
			},
		},
		async (request, reply) => {
			const { code } = request.body;

			/**
			 * Authorize
			 */
			const githubOAuthURL = new URL(
				"https://github.com/login/oauth/access_token",
			);

			githubOAuthURL.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
			githubOAuthURL.searchParams.set(
				"client_secret",
				env.GITHUB_OAUTH_CLIENT_SECRET,
			);
			githubOAuthURL.searchParams.set(
				"redirect_uri",
				env.GITHUB_OAUTH_CLIENT_REDIRECT_URI,
			);
			githubOAuthURL.searchParams.set("code", code);

			const githubAccessTokenResponse = await fetch(githubOAuthURL, {
				method: "POST",
				headers: {
					Accept: "application/json",
				},
			});

			const githubAccessTokenData = await githubAccessTokenResponse.json();

			const { access_token: GitHubAccessToken } = z
				.object({
					access_token: z.string(),
					token_type: z.literal("bearer"),
					scope: z.string(),
				})
				.parse(githubAccessTokenData);

			/**
			 * Fetch
			 */
			const githubUserResponse = await fetch("https://api.github.com/user", {
				method: "GET",
				headers: {
					Authorization: `Bearer ${GitHubAccessToken}`,
				},
			});

			const githubUserData = await githubUserResponse.json();
			console.log("githubUserData >>>>>>", githubUserData);

			const {
				id: githubId,
				name,
				email,
				avatar_url: avatarUrl,
			} = z
				.object({
					id: z.coerce.number().int().transform(String),
					avatar_url: z.string().url(),
					name: z.string().nullable(),
					email: z.string().email().nullable(),
				})
				.parse(githubUserData);

			let userEmail = email

			if (userEmail === null) {
				const githubUserEmailsResponse = await fetch(
					'https://api.github.com/user/emails',
					{
						headers: {
							Authorization: `Bearer ${GitHubAccessToken}`,
						},
					},
				)

				const githubUserEmailsData = await githubUserEmailsResponse.json()

				const primaryEmail = z
					.array(
						z.object({
							email: z.string().email(),
							primary: z.boolean(),
							verified: z.boolean(),
						}),
					)
					.min(1)
					.transform((emails) => {
						const primary = emails.find((email) => email.primary)

						if (primary) {
							return primary
						}

						const verified = emails.find((email) => email.verified)

						return verified ?? emails[0]
					})
					.pipe(z.object({ email: z.string().email() }))
					.parse(githubUserEmailsData)

				userEmail = primaryEmail.email
			}


			/**
			 * Actions
			 */
			if (userEmail === null) {
				throw new BadRequestError(errors.auth.GITHUB_EMAIL_NOT_FOUND);
			}

			let token: string;

			let account = await prisma.account.findUnique({
				where: {
					provider_providerAccountId: {
						provider: "GITHUB",
						providerAccountId: githubId,
					},
				},
			});

			/**
			 * If account already connected, sign-in
			 */
			if (account) {
				token = await reply.jwtSign(
					{
						sub: account.userId,
					},
					{
						expiresIn: "7d",
					},
				);

				return reply.status(201).send({ token });
			}

			/**
			 * If account not connected, sign-in
			 */
			let user = await prisma.user.findUnique({
				where: { email: userEmail },
			});

			if (!user) {
				user = await prisma.user.create({
					data: {
						name,
						email: userEmail,
						emailValidatedAt: new Date(),
						avatarUrl,
					},
				});
			}

			account = await prisma.account.findUnique({
				where: {
					provider_userId: {
						provider: "GITHUB",
						userId: user.id,
					},
				},
			});

			if (!account) {
				account = await prisma.account.create({
					data: {
						provider: "GITHUB",
						providerAccountId: githubId,
						userId: user.id,
					},
				});
			}

			token = await reply.jwtSign(
				{
					sub: user.id,
				},
				{
					expiresIn: "7d",
				},
			);

			return reply.status(201).send({ token });
		},
	);
}
