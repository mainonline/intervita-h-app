import { env } from '@saas/env'
import type { FastifyInstance } from 'fastify'
import type { ZodTypeProvider } from 'fastify-type-provider-zod'
import { OpenAI } from 'openai'
import puppeteer from 'puppeteer'
import * as cheerio from 'cheerio'
import z from 'zod'

import { auth } from '@/http/middlewares/auth'
import { BadRequestError } from '../_errors/bad-request-error'

// --- Define Job Posting Structure ---
interface JobPosting {
	title: string | null
	company: string | null
	location: string | null
	description: string | null
	requirements: string[] | null
	responsibilities: string[] | null
	salary_range: string | null
	employment_type: string | null
}

// --- Initialize OpenAI ---
const openai = new OpenAI({
	apiKey: env.OPENAI_API_KEY,
})

// --- Define OpenAI System Prompt ---
const parseJobPostingSystemMessage = `
You are an expert assistant specialized in parsing job posting text content and extracting structured information.
Analyze the provided job posting text and return a JSON object strictly following this structure:
{
  "title": "string | null", // The job title
  "company": "string | null", // The hiring company's name
  "location": "string | null", // Job location (city, state, remote)
  "description": "string | null", // A brief summary or overall description of the job
  "requirements": ["string"] | null, // A list of required skills, qualifications, or experience
  "responsibilities": ["string"] | null, // A list of key responsibilities or duties
  "salary_range": "string | null", // Salary range if mentioned (e.g., "$100k - $120k")
  "employment_type": "string | null" // e.g., "Full-time", "Contract", "Part-time"
}
If a field is not mentioned in the text, use null for that field. Ensure the output is a valid JSON object.
Focus on extracting information only present in the provided text. Do not infer or add information not explicitly stated.
Extract requirements and responsibilities as lists of strings. Remove any formatting like markdown.
`

/**
 * Uses Cheerio to load HTML, extract text from relevant tags, clean it,
 * remove duplicates, and return a single string with blocks separated by newlines.
 */
function extractAndCleanTextFromHtml(htmlContent: string): string {
	const $ = cheerio.load(htmlContent)

	// Remove tags that typically don't contain main job content
	$('script, style, noscript, iframe, header, footer, nav, aside, form, button, input, select, textarea').remove()

	const textBlocks = new Set<string>() // Use a Set to automatically handle duplicates

	// Select common text-containing elements within the body
	const selectors = [
		'body p',
		'body li',
		'body span',
		'body div', // Be cautious, divs can contain noise
		'body td',
		'body th',
		'body h1',
		'body h2',
		'body h3',
		'body h4',
		'body h5',
		'body h6',
		'body article',
	].join(', ') // Create a combined selector

	$(selectors).each((_, element) => {
		// Get text, cleaning extra whitespace within the text
		const elementText = $(element)
			.text()
			.replace(/\s\s+/g, ' ') // Replace multiple whitespace chars with a single space
			.trim()

		// Add to set only if it contains meaningful content (avoids empty strings)
		if (elementText) {
			textBlocks.add(elementText)
		}
	})

	// Join the unique blocks from the Set with double newlines
	const combinedText = Array.from(textBlocks).join('\n\n')

	if (!combinedText) {
		// If still no text, fallback to the whole body text as a last resort
		console.warn(`No text found via selectors, falling back to body text.`)
		const bodyText = $('body').text().replace(/\s\s+/g, ' ').trim()
		return bodyText // Return fallback or empty string if body is also empty
	}

	return combinedText
}

/**
 * Scrape the job posting URL using Puppeteer and extract cleaned, de-duplicated text content.
 */
async function scrapeAndExtractText(url: string): Promise<string> {
	let browser = null
	try {
		browser = await puppeteer.launch({
			headless: true,
			args: ['--no-sandbox', '--disable-setuid-sandbox'],
		})
		const page = await browser.newPage()

		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
		)

		await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

		const htmlContent = await page.content()

		// Use the helper function to process the HTML
		const cleanedText = extractAndCleanTextFromHtml(htmlContent)

		if (!cleanedText) {
			throw new Error(
				'Could not extract any meaningful text content from the page body after cleaning.',
			)
		}

		console.log(`Successfully scraped and cleaned text from: ${url}`)
		return cleanedText
	} catch (error: any) {
		console.error(`Error scraping URL ${url}: ${error.message}`)
		// Propagate specific error types or create a generic one
		if (error instanceof BadRequestError) {
			throw error
		}
		throw new BadRequestError(
			`Failed to scrape job posting from URL: ${error.message || error}`,
		)
	} finally {
		if (browser) {
			await browser.close()
		}
	}
}

/**
 * Analyze job posting text using OpenAI to extract structured information.
 */
async function analyzeJobPostingText(text: string): Promise<JobPosting> {
	try {
		const response = await openai.chat.completions.create({
			model: 'gpt-4o-mini', // Or your preferred model
			response_format: { type: 'json_object' },
			messages: [
				{ role: 'system', content: parseJobPostingSystemMessage },
				{
					role: 'user',
					content: `Parse this job posting text:\n\n${text}`,
				},
			],
			temperature: 0.2, // Lower temperature for more deterministic output
		})

		const content = response.choices[0].message.content
		if (!content) {
			throw new Error('OpenAI returned empty content.')
		}

		console.log('Successfully analyzed job posting text.')
		return JSON.parse(content) as JobPosting
	} catch (error: any) {
		console.error(`Job posting analysis error: ${error}`)
		throw new BadRequestError(
			`Unable to analyze job posting text: ${error.message || error}`,
		)
	}
}

// --- Fastify Route Definition ---
export async function parseJobPosting(app: FastifyInstance) {
	app
		.withTypeProvider<ZodTypeProvider>()
		.register(auth) // Apply authentication middleware
		.post(
			'/posting/parse',
			{
				schema: {
					tags: ['Posting'],
					summary: 'Parse a job posting URL and extract structured information',
					security: [{ bearerAuth: [] }],
					body: z.object({
						url: z.string().url({ message: 'Invalid URL provided' }),
					}),
					response: {
						// Define a more specific response schema based on JobPosting interface
						200: z.object({
							title: z.string().nullable(),
							company: z.string().nullable(),
							location: z.string().nullable(),
							description: z.string().nullable(),
							requirements: z.array(z.string()).nullable(),
							responsibilities: z.array(z.string()).nullable(),
							salary_range: z.string().nullable(),
							employment_type: z.string().nullable(),
						}),
						400: z.object({
							message: z.string(),
						}),
					},
				},
			},
			async (request, reply) => {
				const { url } = request.body

				console.log(`Received request to parse job posting: ${url}`)

				try {
					// Step 1: Scrape and extract text from the URL
					const jobPostingText = await scrapeAndExtractText(url)

					if (!jobPostingText || jobPostingText.length < 50) {
						// Basic sanity check
						throw new BadRequestError(
							'Extracted text seems too short or empty. Could not parse.',
						)
					}

					// Step 2: Analyze the extracted text using OpenAI
					const structuredData = await analyzeJobPostingText(jobPostingText)

					console.log(`Successfully parsed job posting for: ${url}`)
					return reply.status(200).send(structuredData)
				} catch (error) {
					console.error(
						`Error processing job posting URL ${url}: ${error instanceof Error ? error.message : error}`,
					)
					// Handle known errors specifically
					if (error instanceof BadRequestError) {
						return reply.status(400).send({ message: error.message })
					}
					// Generic internal server error for unexpected issues
					return reply
						.status(500)
						.send({ message: 'An internal server error occurred.' })
				}
			},
		)
}
