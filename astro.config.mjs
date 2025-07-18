import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import icon from "astro-icon";
import mdx from '@astrojs/mdx';
import rehypeExternalLinks from 'rehype-external-links';
import sitemap from "@astrojs/sitemap";
import { site } from './src/constants/site';

// https://astro.build/config
export default defineConfig({
	site,
  integrations: [mdx(), tailwind(), react(), icon({
    svgoOptions: {
      multipass: true,
      plugins: ['preset-default',
      // Avoid collisions with ids in other SVGs,
      // which was causing incorrect gradient directions
      // https://github.com/svg/svgo/issues/1746#issuecomment-1803600573
      //
      // Previously, this was a problem where unique ids
      // could not be generated since svgo@3
      // https://github.com/svg/svgo/issues/674
      // https://github.com/svg/svgo/issues/1746
      'cleanupIds', {
        name: 'prefixIds',
        params: {
          prefix() {
            svgCount++;
            return `svgid-${svgCount}`;
          }
        }
      }]
    },
    include: {
      tabler: ['*']
    }
  }), sitemap()],
	markdown: {
		rehypePlugins: [
      [
        rehypeExternalLinks,
        {
          target: '_blank',
        }
      ],
    ],
	}
});