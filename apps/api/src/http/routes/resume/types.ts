// resume.ts

// Basic Info
interface BasicInfo {
	name: string
	email: string
	phone: string
	location: string
}

// Skills (split into technical and soft skills)
interface Skills {
	technical: string[]
	soft: string[]
}

// Work Experience Entry
interface WorkExperience {
	company: string
	title: string
	dates: string // e.g., "Jan 2020 - Present"
	responsibilities: string[]
}

// Education Entry
interface Education {
	institution: string
	degree: string | null // Degree might not always be present
	dates: string // e.g., "2015-2019"
	gpa: string | null // GPA is optional
}

// Certification Entry
interface Certification {
	name: string
	date: string | null // Issuing date might not be specified
}

// Language Entry
interface Language {
	language: string
	proficiency: string | null // Proficiency might not be specified
}

// Project Entry
interface Project {
	name: string
	description: string
	dates: string | null // Dates might not be specified
}

// Full Resume Interface
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
