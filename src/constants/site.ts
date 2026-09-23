export const site = 'https://rubenbupe.com';

export const siteName = 'Rubén Buzón';
export const siteDescription = 'Rubén Buzón - Full Stack Engineer';

export const mail = 'hello@rubenbupe.com';
export const mailUrl = `mailto:${mail}`;
export const githubUrl = 'https://github.com/rubenbupe';
export const linkedinUrl = 'https://www.linkedin.com/in/rubenbupe/';

// Link to the previous version of the site, shown on the card behind the portrait badge.
// Leave PUBLIC_V1_URL empty to hide it.
export const v1Url = import.meta.env.PUBLIC_V1_URL as string | undefined;

export const links = [
	{ href: '/#about', text: 'About' },
	{ href: '/#jobs', text: 'Experience' },
	{ href: '/#projects', text: 'Work' },
	{ href: '/blog', text: 'Blog' },
	{ href: '/resume.pdf', text: 'Resume', external: true }
];
