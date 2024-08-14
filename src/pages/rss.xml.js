import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import { siteDescription, siteName } from '../constants/site';

export async function GET(context) {
	const posts = await getCollection('blog');
	return rss({
		title: siteName,
		description: siteDescription,
		site: context.site,
		items: posts.map((post) => ({
			...post.data,
			link: `/blog/${post.slug}/`,
		})),
	});
}
