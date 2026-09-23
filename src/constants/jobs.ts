import measesoranSvg from '../assets/svg/measesoran.svg?raw';
import gabinsoftSvg from '../assets/svg/gabinsoft.svg?raw';
import calmavitySvg from '../assets/svg/calmavity.svg?raw';
import nodelixSvg from '../assets/svg/nodelix.svg?raw';

// Years are fractional so the timeline can place months (Sep 2020 -> 2020.67).
// `end: null` means the job is still ongoing.
export const timelineRange = { from: 2019, to: 2026.75 };

export const jobs = [
	{
		id: 1,
		title: 'Gabinsoft',
		timePeriod: '2022 - present',
		start: 2022,
		end: null,
		svg: gabinsoftSvg,
		badges: [
			'TypeScript',
			'Go',
			'React',
			'React Native',
			'HTML/CSS',
			'Docker',
			'Kubernetes',
			'SQL',
			'RabbitMQ',
			'Redis',
			'NodeJS',
			'Google Cloud',
			'Git'
		],
		role: 'Co-Founder & Fullstack Developer',
		paragraphs: [
			'Led the creation of the platform, building the backend, frontend, and mobile apps from the ground up.',
			'Designed and implemented the psychologist platform based on business requirements, developing new features and improving existing ones.',
			'Developed the marketing website with a focus on design, SEO, and performance.',
			'Migrated critical and resource-intensive processes to independent Go services, enabling platform scalability and reducing bottlenecks.'
		]
	},
	{
		id: 2,
		title: 'Me Asesoran',
		timePeriod: 'Sep. 2020 - present',
		start: 2020.67,
		end: null,
		svg: measesoranSvg,
		badges: [
			'PHP',
			'Laravel',
			'React',
			'TypeScript',
			'HTML/CSS',
			'Docker',
			'Kubernetes',
			'PostgreSQL',
			'RabbitMQ',
			'NodeJS',
			'AWS',
			'Git'
		],
		role: 'Fullstack Developer',
		paragraphs: [
			'Developed key features for the main platform, working on both backend and frontend for thousands of users.',
			'Collaborated with the product team to understand user needs and deliver features that matched expectations.',
			'Led the migration from a monolithic to a microservices architecture, implementing event-driven design, CQRS, and DDD to improve scalability and development speed.',
			"Led the development of Me Asesoran Rentas, integrating with Spain's government APIs and authentication for seamless tax return submissions."
		]
	},
	{
		id: 3,
		title: 'Calmavity',
		timePeriod: '2019 - 2022',
		start: 2019,
		end: 2022,
		svg: calmavitySvg,
		badges: [
			'TypeScript',
			'React',
			'React Native',
			'HTML/CSS',
			'Docker',
			'Kubernetes',
			'MongoDB',
			'NodeJS',
			'AWS',
			'Git'
		],
		role: 'Co-Founder & Fullstack Developer',
		paragraphs: [
			'Led full-stack development, including architecture, design, and implementation of backend and frontend technologies.',
			'Built a cross-platform mobile app with features like authentication, push notifications, real-time chat, and video calls.',
			'Developed a web application mirroring mobile features using React.',
			'Created a NodeJS and MongoDB backend serving web, mobile, and internal analytics tools, enabling rapid iteration.',
			'Deployed on GCP with Docker and Kubernetes for scalable, reliable infrastructure, using the project as a learning opportunity for new technologies.'
		]
	},
	{
		id: 4,
		title: 'Nodelix',
		timePeriod: '2019 - 2024',
		start: 2019,
		end: 2024,
		svg: nodelixSvg,
		badges: ['Python', 'Django', 'ML', 'TensorFlow', 'OCR', 'AWS', 'Git'],
		role: 'Co-Founder & Fullstack Developer',
		paragraphs: [
			'Delivered scalable ML solutions for fiscal sector clients, focusing on OCR and data extraction tools.',
			'Developed a custom OCR pipeline for real-time data processing and extraction from various documents, including invoices and contracts.',
			'Worked closely with clients to understand requirements and deliver tailored solutions.',
			'Designed a dynamically scalable system to optimize costs and handle peak demand periods efficiently.'
		]
	}
];

export type Job = (typeof jobs)[number];
