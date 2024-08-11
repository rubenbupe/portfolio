import { defineConfig } from 'astro/config';
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

import icon from "astro-icon";

// https://astro.build/config
export default defineConfig({
  integrations: [tailwind(), react(), icon({
		svgoOptions: {
			multipass: true,
			plugins: [
				'preset-default',
				// Avoid collisions with ids in other SVGs,
				// which was causing incorrect gradient directions
				// https://github.com/svg/svgo/issues/1746#issuecomment-1803600573
				//
				// Previously, this was a problem where unique ids
				// could not be generated since svgo@3
				// https://github.com/svg/svgo/issues/674
				// https://github.com/svg/svgo/issues/1746
				'cleanupIds',
				{
					name: 'prefixIds',
					params: {
						prefix() {
							svgCount++;
							return `svgid-${svgCount}`;
						}
					}
				}
			]
		},
		include: {
			tabler: ['*']
		}
	})],
});