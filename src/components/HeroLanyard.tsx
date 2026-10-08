import { useEffect, useState } from 'react';
import Lanyard, { type LanyardHotspot } from './Lanyard';

type Theme = 'light' | 'dark';

type ThemedImages = Record<Theme, { front: string; back: string; strap: string }>;

// Card and strap follow the site theme: the root element toggles .light / .dark
const readTheme = (): Theme => (document.documentElement.classList.contains('light') ? 'light' : 'dark');

const LOOK: Record<Theme, { cardColor: string; strapColor: string }> = {
	light: { cardColor: '#ffffff', strapColor: '#16181b' },
	dark: { cardColor: '#111214', strapColor: '#d6d9de' }
};

// The "v1 ↗" label printed on the top right corner of the front face (see src/assets/lanyard)
const V1_AREA = { u: [0.78, 0.94] as [number, number], v: [0.9, 0.98] as [number, number] };

export const HeroLanyard = ({
	images,
	v1Url,
	className
}: {
	images: ThemedImages;
	v1Url?: string;
	className?: string;
}) => {
	const [theme, setTheme] = useState<Theme>('dark');
	// Desktop: the canvas spans the whole hero and the card hangs on the right; mobile: centred above the name
	const [wide, setWide] = useState(false);

	useEffect(() => {
		setTheme(readTheme());
		const observer = new MutationObserver(() => setTheme(readTheme()));
		observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

		const desktop = window.matchMedia('(min-width: 768px)');
		const onChange = () => setWide(desktop.matches);
		onChange();
		desktop.addEventListener('change', onChange);

		return () => {
			observer.disconnect();
			desktop.removeEventListener('change', onChange);
		};
	}, []);

	const hotspot: LanyardHotspot | undefined = v1Url
		? { face: 'front', ...V1_AREA, onPress: () => window.open(v1Url, '_blank', 'noopener') }
		: undefined;

	return (
		<Lanyard
			className={className}
			frontImage={images[theme].front}
			backImage={images[theme].back}
			strapImage={images[theme].strap}
			cardColor={LOOK[theme].cardColor}
			strapColor={LOOK[theme].strapColor}
			finish="glossy"
			metal="silver"
			size={0.6}
			strapLength={0.45}
			anchor={wide ? 'right' : 'center'}
			passThrough
			hotspot={hotspot}
		/>
	);
};
