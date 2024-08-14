import { getCollection } from "astro:content";


export async function getPosts() {
  const posts = (await getCollection("blog")).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return posts;
}

export async function getFeaturedPosts() {
	const posts = (await getCollection("blog")).filter((post) => post.data.featured);

	return posts;
}