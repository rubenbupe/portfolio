import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
	type: 'content',
	// Type-check frontmatter using a schema
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		updatedDate: z.coerce.date().optional(),
		heroImage: z.string(),
		heroImageAlt: z.string(),
		featured: z.boolean().optional(),
		hidden: z.boolean().optional(),
	}),
});

export const collections = { blog };
