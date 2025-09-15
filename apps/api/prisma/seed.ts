import { faker } from '@faker-js/faker'
import {
	BillingPeriod,
	InterviewStatus,
	InterviewType,
	PrismaClient,
} from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function seed() {
	// Clear existing data
	await prisma.interview.deleteMany()
	await prisma.resume.deleteMany()
	await prisma.jobContext.deleteMany()
	await prisma.token.deleteMany()
	await prisma.account.deleteMany()
	await prisma.user.deleteMany()
	await prisma.subscriptionPlan.deleteMany()

	// Create subscription plans
	const freePlan = await prisma.subscriptionPlan.create({
		data: {
			name: 'Free',
			price: null,
			annualPrice: null,
			billingPeriod: BillingPeriod.MONTHLY,
			interviewMinutes: 15,
			maxInterviews: 3,
			maxInterviewDuration: 5,
			isActive: true,
			description: 'Free tier with limited interviews',
			features: [
				'3 interviews per month',
				'5 minutes per interview',
				'Basic analytics',
			],
		},
	})

	await prisma.subscriptionPlan.create({
		data: {
			name: 'Basic',
			price: 9.99,
			annualPrice: 99.99,
			billingPeriod: BillingPeriod.MONTHLY,
			interviewMinutes: 60,
			maxInterviews: 10,
			maxInterviewDuration: 15,
			isActive: true,
			description: 'Basic tier with more interviews',
			features: [
				'10 interviews per month',
				'15 minutes per interview',
				'Advanced analytics',
				'Feedback reports',
			],
			stripePriceId: 'price_basic_monthly',
			stripeAnnualPriceId: 'price_basic_annual',
		},
	})

	await prisma.subscriptionPlan.create({
		data: {
			name: 'Pro',
			price: 29.99,
			annualPrice: 299.99,
			billingPeriod: BillingPeriod.MONTHLY,
			interviewMinutes: 180,
			maxInterviews: 30,
			maxInterviewDuration: 30,
			isActive: true,
			description: 'Pro tier with unlimited interviews',
			features: [
				'30 interviews per month',
				'30 minutes per interview',
				'Premium analytics',
				'Detailed feedback',
				'Priority support',
			],
			stripePriceId: 'price_pro_monthly',
			stripeAnnualPriceId: 'price_pro_annual',
		},
	})

	// Create test user with free plan
	const passwordHash = await hash('123456', 10)

	const user = await prisma.user.create({
		data: {
			name: 'Zhoomart Akimov',
			email: 'joma@gmail.com',
			emailValidatedAt: new Date(),
			avatarUrl: faker.image.avatar(),
			passwordHash,
			subscriptionPlanId: freePlan.id,
			subscriptionStart: new Date(),
			subscriptionEnd: null, // Free plan doesn't expire
			currentPeriodStart: new Date(),
			currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
		},
	})

	// Create sample resume
	const resume = await prisma.resume.create({
		data: {
			fileUrl: 'https://storage.example.com/resumes/sample.pdf',
			content: faker.lorem.paragraphs(5),
			userId: user.id,
		},
	})

	// Create sample job context
	const jobContext = await prisma.jobContext.create({
		data: {
			title: 'Senior Software Engineer',
			description: faker.lorem.paragraph(),
			userId: user.id,
		},
	})

	// Create sample interview
	const interview = await prisma.interview.create({
		data: {
			status: InterviewStatus.COMPLETED,
			startTime: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
			endTime: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
			roomName: `room-${faker.string.uuid()}`,
			userId: user.id,
			resumeId: resume.id,
			jobContextId: jobContext.id,
		},
	})

	// Create sample questions
	await Promise.all(
		Array.from({ length: 3 }).map(async (_, i) => {
			return prisma.question.create({
				data: {
					text: faker.lorem.sentence() + '?',
					order: i,
					interviewId: interview.id,
					response: {
						create: {
							text: faker.lorem.paragraph(),
							timestamp: new Date(),
							rating: faker.number.float({ min: 3, max: 5 }),
							feedback: faker.lorem.sentence(),
						},
					},
				},
			})
		}),
	)

	// Create sample transcript messages
	await Promise.all(
		Array.from({ length: 10 }).map((_, i) => {
			return prisma.transcriptionMessage.create({
				data: {
					message: faker.lorem.sentence(),
					name: i % 2 === 0 ? 'AI Interviewer' : 'John Doe',
					isSelf: i % 2 !== 0,
					timestamp: new Date(Date.now() - (60 - i * 5) * 60 * 1000),
					interviewId: interview.id,
				},
			})
		}),
	)

	// Create sample report
	await prisma.report.create({
		data: {
			interviewType: InterviewType.TECHNICAL,
			date: new Date(),
			domain: 'Software Engineering',
			duration: 5,
			relevance: 4.5,
			accuracy: 4.2,
			clarity: 4.3,
			coherence: 4.1,
			conciseness: 3.9,
			technicalProficiency: 4.4,
			professionalism: 4.6,
			relevanceToJobContext: 4.0,
			feedback: faker.lorem.paragraphs(2),
			strengths: faker.lorem.sentences(3),
			weaknesses: faker.lorem.sentences(2),
			interviewId: interview.id,
		},
	})

	console.log('Seed completed successfully')
}

seed()
	.then(async () => {
		await prisma.$disconnect()
	})
	.catch(async (e) => {
		console.error(e)
		await prisma.$disconnect()
		process.exit(1)
	})
