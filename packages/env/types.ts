// resume.ts

// Basic Info
export interface BasicInfo {
	name: string
	email: string
	phone: string
	location: string
}

// Skills (split into technical and soft skills)
export interface Skills {
	technical: string[]
	soft: string[]
}

// Work Experience Entry
export interface WorkExperience {
	company: string
	title: string
	dates: string // e.g., "Jan 2020 - Present"
	responsibilities: string[]
}

// Education Entry
export interface Education {
	institution: string
	degree: string | null // Degree might not always be present
	dates: string // e.g., "2015-2019"
	gpa: string | null // GPA is optional
}

// Certification Entry
export interface Certification {
	name: string
	date: string | null // Issuing date might not be specified
}

// Language Entry
export interface Language {
	language: string
	proficiency: string | null // Proficiency might not be specified
}

// Project Entry
export interface Project {
	name: string
	description: string
	dates: string | null // Dates might not be specified
}

export interface Resume {
	basic_info: BasicInfo | null
	summary: string | null
	skills: Skills | null
	work_experience: WorkExperience[] | null
	education: Education[] | null
	certifications: Certification[] | null
	languages: Language[] | null
	projects: Project[] | null
}

export interface RoomTokenMetadata {
	resume_data: Resume | null
	questions: string[]
	job_context: string
	max_interview_minutes: number
}

export interface InterviewContextData {
	resume: Resume | null
	questions: string[]
	job_context: string
}

export enum InterviewStatus {
	SCHEDULED = 'SCHEDULED',
	IN_PROGRESS = 'IN_PROGRESS',
	COMPLETED = 'COMPLETED',
	CANCELLED = 'CANCELLED',
	LIMIT_EXCEEDED = 'LIMIT_EXCEEDED',
}
export interface IRawInterview {
	id: number
	status: InterviewStatus
	startTime: string | null
	endTime: string | null
	roomName: string
	token: string | null
	createdAt: string
	updatedAt: string
	userId: number
	resumeId: number
	jobContextId: number
	questions: string[]
	messages: string[]
	report: string | null
}

export interface IRawResume {
	id: number
	fileUrl: string | null
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	content: any
	createdAt: string
	updatedAt: string
	userId: number
}
