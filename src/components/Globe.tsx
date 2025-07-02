import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

// https://github.com/shuding/cobe

const minMarkerSize = 0.01;
const maxMarkerSize = 0.1;
export function Globe() {
	const [size, setSize] = useState<number>();
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		if (!canvasRef.current || !size) {
			return;
		}
		let phi = 4.3;

		const globe = createGlobe(canvasRef.current, {
			context: { antialias: false },
			devicePixelRatio: 2,
			width: size * 2,
			height: size * 2,
			phi,
			theta: 0,
			dark: 1,
			diffuse: 1.2,
			mapSamples: 16000,
			mapBrightness: 6,
			baseColor: [0.3, 0.3, 0.3],
			markerColor: [1, 1, 1],
			glowColor: [1, 1, 1],
			markers: [
				{ location: [37.7595, -122.4367], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [40.7128, -74.006], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [52.520008, 13.404954], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [51.507351, -0.127758], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [35.689487, 139.691711], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [22.396427, 114.109497], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [30.047503, 31.233702], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [-33.86882, 151.20929], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize },
				{ location: [-9.746956, -44.261249], size: Math.random() * (maxMarkerSize - minMarkerSize) + minMarkerSize }
			],
			onRender: state => {
				state.phi = phi;
				// phi += 0.0001;
			}
		});

		// The animation is heavy, so we stop it after first render
		setTimeout(() => {
			globe.toggle(false);
		});
		return () => {
			globe.destroy();
		};
	}, [size]);

	useEffect(() => {
		let timeout: ReturnType<typeof setTimeout>;
		const debounceSetSize = (newSize: number) => {
			timeout = setTimeout(() => setSize(newSize), 200);
		};
		const handleResize = () => {
			clearTimeout(timeout);
			if (window.innerWidth <= 600) {
				debounceSetSize(600);
			} else if (window.innerWidth <= 900) {
				debounceSetSize(900);
			} else if (window.innerWidth <= 1200) {
				debounceSetSize(1200);
			} else if (window.innerWidth <= 1600) {
				debounceSetSize(1600);
			} else if (window.innerWidth <= 2000) {
				debounceSetSize(2000);
			}
		};

		window.addEventListener('resize', handleResize);
		handleResize();

		return () => {
			window.removeEventListener('resize', handleResize);
		};
	}, []);

	return (
		<div className="w-full max-w-full flex justify-center">
			<canvas
				ref={canvasRef}
				className="bg-transparent"
				style={{
					width: size,
					height: size,
					aspectRatio: 1
				}}
			/>
		</div>
	);
}
