import type { SVGProps } from 'react';

export const GridPatternSvg = ({
	size = 48,
	...props
}: SVGProps<SVGSVGElement> & {
	size?: number;
}) => {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg">
			<defs>
				<pattern
					id="all-access-grid-pattern-2"
					width={size}
					height={size}
					patternUnits="userSpaceOnUse"
					x="50%"
					y="100%"
					patternTransform="translate(0 -1)"
				>
					<path d={`M0 ${size}V.5H${size}`} fill="none" stroke="currentColor"></path>
				</pattern>
			</defs>
			<rect width="100%" height="100%" fill="url(#all-access-grid-pattern-2)"></rect>
		</svg>
	);
};
