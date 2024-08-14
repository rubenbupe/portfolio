import { getCollection } from "astro:content";


export async function getPosts() {
	// Don't return featured posts because it breaks view transitions due
	// duplicated transition ids
  const posts = (await getCollection("blog")).filter((post) => !post.data.featured).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return posts;
}

export async function getFeaturedPosts() {
	const posts = (await getCollection("blog")).filter((post) => post.data.featured);

	return posts;
}