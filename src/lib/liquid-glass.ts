/**
 * Liquid glass, as described in https://kube.io/blog/liquid-glass-css-svg/
 *
 * - Chromium: the article's technique verbatim — an SVG filter (displacement + specular)
 *   used as `backdrop-filter`. Native, scroll-synced and cheap.
 * - Every other browser: blur. The element keeps its own CSS backdrop blur, or gets a frosted
 *   one with `blurFallback`.
 * - Opt-in `fallback: 'clone'`: Firefox and Safari ignore SVG filters in `backdrop-filter` but
 *   accept them in `filter`, so the glass can hold a live clone of the content behind it and run
 *   the same filter chain on it. Faithful but heavy.
 *
 * Displacement and specular maps are generated with the article's algorithm.
 */

type Profile = number[];

export type LiquidGlassMode = 'native' | 'clone' | 'blur';

export type LiquidGlassOptions = {
	/** Inward displacement in CSS px at refraction 1, sampled every 0.5 px from the edge. */
	profile?: Profile;
	/** "Refraction level" (the article's scaleRatio). */
	refraction?: number;
	/** feGaussianBlur stdDeviation applied before the displacement. */
	blur?: number;
	specularOpacity?: number;
	specularSaturation?: number;
	/** Degrees; the article's maps use 60. */
	lightAngle?: number;
	/** Clone mode: elements rendered behind the glass. */
	sources?: () => HTMLElement[];
	/**
	 * Mode for browsers without SVG backdrop filters (everything but Chromium). `auto` is `blur`:
	 * the clone mode works there but is too heavy for general use. `clone` opts into it.
	 */
	fallback?: 'auto' | 'clone' | 'blur';
	/** Clone mode: how long the source must stay unchanged before it is cloned again (ms). */
	mutationDelay?: number;
	/** Skip detection (debugging, e.g. to try the Firefox/Safari path in Chrome). */
	force?: LiquidGlassMode;
	/**
	 * Corner curve of the refraction: `auto` follows the element's CSS `corner-shape`
	 * (circular where unsupported), `round` forces circles, a number is a superellipse(k) parameter.
	 */
	cornerShape?: 'auto' | 'round' | number;
	/** Adds the article's magnifying stage (zoom before refraction), driven with `setDynamic({ magnify })`. */
	magnifiable?: boolean;
	/**
	 * Blur (stdDeviation) after the displacement. feDisplacementMap samples the nearest pixel, so
	 * zooming or strong refraction looks jagged; a fraction of a pixel smooths it out.
	 */
	smooth?: number;
	/**
	 * Blur mode (Firefox, phones, low-end): when set, `setActive(true)` gives the element a frosted
	 * `backdrop-filter: blur(n px)` instead of the refraction. 0 leaves the element's own CSS alone.
	 */
	blurFallback?: number;
};

export type LiquidGlassDynamic = {
	/** Refraction level, e.g. to fade the lens in and out. */
	refraction?: number;
	/** Zoom factor (1 = none). Needs `magnifiable: true`. */
	magnify?: number;
};

export type LiquidGlassHandle = {
	mode: LiquidGlassMode;
	setActive(active: boolean): void;
	/** Cheap per-frame changes (only touches filter attributes). */
	setDynamic(values: LiquidGlassDynamic): void;
	/**
	 * Builds the maps for sizes the glass is about to take (e.g. the end of an animation), so they
	 * swap in instantly instead of lagging a few frames behind. Sizes are the element's CSS box.
	 */
	prepare(sizes: { width: number; height: number; radius?: number }[]): void;
	destroy(): void;
};

/** Profile read from the article's search box displacement map (convex squircle bezel, ~14 px). */
export const SEARCH_PROFILE: Profile = [
	34.317, 27.161, 20.655, 17.403, 14.15, 12.198, 9.921, 8.62, 7.319, 6.343, 5.367, 4.717, 4.066, 3.415, 3.09, 2.765,
	2.44, 1.789, 1.789, 1.464, 1.138, 1.138, 0.813, 0.813, 0.488, 0.488, 0.488, 0.488
];

type Resolved = Required<Omit<LiquidGlassOptions, 'sources' | 'force'>>;

const DEFAULTS: Resolved = {
	profile: SEARCH_PROFILE,
	refraction: 1,
	blur: 1,
	specularOpacity: 0.4,
	specularSaturation: 6,
	lightAngle: 60,
	fallback: 'auto',
	mutationDelay: 250,
	cornerShape: 'auto',
	magnifiable: false,
	smooth: 0,
	blurFallback: 0
};

const SVG_NS = 'http://www.w3.org/2000/svg';
const XLINK_NS = 'http://www.w3.org/1999/xlink';

/* ------------------------------------------------------------------ support */

export function supportsSvgBackdropFilter(): boolean {
	const nav = navigator as Navigator & { userAgentData?: { brands?: { brand: string }[] } };
	if (nav.userAgentData?.brands?.some(b => b.brand === 'Chromium')) return true;
	// iOS browsers are all WebKit, whatever their name says
	return /\bChrome\/\d+/.test(navigator.userAgent) && !/CriOS|FxiOS|EdgiOS/.test(navigator.userAgent);
}

function isLowEndOrMobile(): boolean {
	const nav = navigator as Navigator & { deviceMemory?: number };
	return (
		window.matchMedia('(pointer: coarse)').matches ||
		(navigator.hardwareConcurrency ?? 8) <= 4 ||
		(nav.deviceMemory ?? 8) <= 4
	);
}

/* ----------------------------------------------------------------- maps */

const radiusPx = (value: string, w: number, h: number) =>
	value.endsWith('%') ? (parseFloat(value) / 100) * Math.min(w, h) : parseFloat(value) || 0;

/**
 * Exponent of the corner curve |x|ⁿ + |y|ⁿ = 1. CSS `corner-shape: superellipse(k)` uses n = 2ᵏ:
 * round = superellipse(1) → n = 2 (circle), squircle = superellipse(2) → n = 4.
 */
function cornerExponent(el: HTMLElement, option: LiquidGlassOptions['cornerShape']): number {
	if (typeof option === 'number') return 2 ** option;
	if (option === 'round') return 2;
	const shape =
		getComputedStyle(el)
			.getPropertyValue('corner-shape')
			.trim()
			.split(/\s+(?![^(]*\))/)[0] ?? '';
	if (shape === 'squircle') return 4;
	const k = /^superellipse\(\s*([\d.]+)\s*\)$/.exec(shape);
	// Keywords with straight or concave corners (bevel, scoop, notch…) fall back to round
	return k && parseFloat(k[1]) > 0 ? 2 ** parseFloat(k[1]) : 2;
}

/**
 * Walks the pixels of a rounded box (corner radius p, corner exponent n, device px) and calls `visit`
 * for those within `band` px of the edge, with the distance to the edge `t` and the outward normal.
 * Straight sides use an axis normal; corners use the gradient of |x|ⁿ + |y|ⁿ (a circle when n = 2).
 */
function eachEdgePixel(
	w: number,
	h: number,
	p: number,
	n: number,
	band: number,
	visit: (i: number, t: number, nx: number, ny: number, aa: number) => void
) {
	const bx = w - 2 * p;
	const by = h - 2 * p;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const l = x < p ? x - p : x >= w - p ? x - p - bx : 0;
			const m = y < p ? y - p : y >= h - p ? y - p - by : 0;
			if (l === 0 && m === 0) continue;
			const u = Math.abs(l) / p;
			const v = Math.abs(m) / p;
			// "radius" of this pixel measured along the corner curve; 1 on the border
			const e = p * (n === 2 ? Math.hypot(u, v) : (u ** n + v ** n) ** (1 / n));
			if (e > p + 1 || e < p - band) continue;
			const gx = Math.sign(l) * u ** (n - 1);
			const gy = Math.sign(m) * v ** (n - 1);
			const g = Math.hypot(gx, gy) || 1;
			visit((y * w + x) * 4, p - e, gx / g, gy / g, e < p ? 1 : 1 - (e - p));
		}
	}
}

/** Displacement map with the article's encoding (R/G = 128 ± 127·u, neutral elsewhere). */
function displacementMap(W: number, H: number, rc: number, n: number, profile: Profile, maxV: number, dpr: number) {
	const w = Math.max(1, Math.round(W * dpr));
	const h = Math.max(1, Math.round(H * dpr));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	const img = ctx.createImageData(w, h);
	const d = img.data;
	for (let i = 0; i < d.length; i += 4) {
		d[i] = 128;
		d[i + 1] = 128;
		d[i + 3] = 255;
	}
	eachEdgePixel(w, h, rc * dpr, n, profile.length * 0.5 * dpr, (i, t, nx, ny, aa) => {
		const v = (profile[Math.max(0, Math.floor(t / dpr / 0.5))] ?? 0) / maxV;
		d[i] = 128 - nx * v * 127 * aa;
		d[i + 1] = 128 - ny * v * 127 * aa;
	});
	ctx.putImageData(img, 0, 0);
	return canvas.toDataURL();
}

/** Specular rim: s = |n·L|·√(1−(1−t)²), colour s, alpha s² — as in the article. */
function specularMap(W: number, H: number, rc: number, n: number, angleDeg: number, dpr: number) {
	const w = Math.max(1, Math.round(W * dpr));
	const h = Math.max(1, Math.round(H * dpr));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	const img = ctx.createImageData(w, h);
	const d = img.data;
	const lx = Math.cos((angleDeg * Math.PI) / 180);
	const ly = Math.sin((angleDeg * Math.PI) / 180);
	eachEdgePixel(w, h, rc * dpr, n, 2 * dpr, (i, t, nx, ny, aa) => {
		const k = 1 - (1 - t / dpr) ** 2;
		if (k <= 0) return;
		const s = Math.abs(nx * lx - ny * ly) * Math.sqrt(k);
		const c = 255 * s;
		d[i] = c;
		d[i + 1] = c;
		d[i + 2] = c;
		d[i + 3] = c * s * aa;
	});
	ctx.putImageData(img, 0, 0);
	return canvas.toDataURL();
}

/**
 * The article's magnifying map: offsets grow linearly from the centre, so displacing by `scale`
 * zooms around it by 1 / (1 − scale / W). Both axes use W so the zoom keeps the aspect ratio.
 */
function magnifyingMap(W: number, H: number, dpr: number) {
	const w = Math.max(1, Math.round(W * dpr));
	const h = Math.max(1, Math.round(H * dpr));
	const canvas = document.createElement('canvas');
	canvas.width = w;
	canvas.height = h;
	const ctx = canvas.getContext('2d')!;
	const img = ctx.createImageData(w, h);
	const d = img.data;
	for (let y = 0; y < h; y++) {
		for (let x = 0; x < w; x++) {
			const i = (y * w + x) * 4;
			d[i] = 128 - (127 * (x + 0.5 - w / 2)) / (w / 2);
			d[i + 1] = 128 - (127 * (y + 0.5 - h / 2)) / (w / 2);
			d[i + 3] = 255;
		}
	}
	ctx.putImageData(img, 0, 0);
	return canvas.toDataURL();
}

/* --------------------------------------------------------------- filter */

let defs: SVGDefsElement | null = null;
let uid = 0;

function sharedDefs(): SVGDefsElement {
	// Recreated after Astro view transitions swap the body
	if (defs?.isConnected) return defs;
	const root = document.createElementNS(SVG_NS, 'svg');
	root.setAttribute('aria-hidden', 'true');
	root.setAttribute('color-interpolation-filters', 'sRGB');
	// Not display:none — Firefox ignores filters defined inside a display:none <svg>
	root.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;pointer-events:none';
	defs = document.createElementNS(SVG_NS, 'defs');
	root.appendChild(defs);
	document.body.appendChild(root);
	return defs;
}

function svg<K extends keyof SVGElementTagNameMap>(
	tag: K,
	attrs: Record<string, string>,
	parent?: Element
): SVGElementTagNameMap[K] {
	const node = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
	parent?.appendChild(node);
	return node;
}

/** The article's filter chain: blur → displacement → saturate → specular. */
class GlassFilter {
	readonly id = `liquid-glass-${++uid}`;
	readonly el: SVGFilterElement;
	private maps: SVGFEImageElement[];
	private disp: SVGFEDisplacementMapElement;
	private magMap: SVGFEImageElement | null = null;
	private magDisp: SVGFEDisplacementMapElement | null = null;
	private maxV: number;
	private geometry = '';
	private hasMaps = false;
	private generation = 0;
	private width = 0;
	private height = 0;
	private zoom = 1;
	private refraction: number;

	constructor(private o: Resolved) {
		this.maxV = Math.max(1e-3, ...o.profile.map(Math.abs));
		this.refraction = o.refraction;
		const f = (this.el = svg('filter', { id: this.id, 'color-interpolation-filters': 'sRGB' }, sharedDefs()));
		let source = 'SourceGraphic';
		if (o.magnifiable) {
			this.magMap = svg('feImage', { x: '0', y: '0', preserveAspectRatio: 'none', result: 'magnifying_map' }, f);
			this.magDisp = svg(
				'feDisplacementMap',
				{
					in: source,
					in2: 'magnifying_map',
					scale: '0',
					xChannelSelector: 'R',
					yChannelSelector: 'G',
					result: 'magnified_source'
				},
				f
			);
			source = 'magnified_source';
		}
		const chainIn = o.blur > 0 ? 'blurred_source' : source;
		if (o.blur > 0) svg('feGaussianBlur', { in: source, stdDeviation: String(o.blur), result: 'blurred_source' }, f);
		const map = svg('feImage', { x: '0', y: '0', preserveAspectRatio: 'none', result: 'displacement_map' }, f);
		// feDisplacementMap offset = scale·(R/255 − 0.5) ≈ scale·0.498·u  →  offset = profile · refraction
		this.disp = svg(
			'feDisplacementMap',
			{
				in: chainIn,
				in2: 'displacement_map',
				scale: String((o.refraction * this.maxV) / 0.498),
				xChannelSelector: 'R',
				yChannelSelector: 'G',
				result: o.smooth > 0 ? 'displaced_raw' : 'displaced'
			},
			f
		);
		if (o.smooth > 0)
			svg('feGaussianBlur', { in: 'displaced_raw', stdDeviation: String(o.smooth), result: 'displaced' }, f);
		svg(
			'feColorMatrix',
			{ in: 'displaced', type: 'saturate', values: String(o.specularSaturation), result: 'displaced_saturated' },
			f
		);
		const spec = svg('feImage', { x: '0', y: '0', preserveAspectRatio: 'none', result: 'specular_layer' }, f);
		svg(
			'feComposite',
			{ in: 'displaced_saturated', in2: 'specular_layer', operator: 'in', result: 'specular_saturated' },
			f
		);
		const transfer = svg('feComponentTransfer', { in: 'specular_layer', result: 'specular_faded' }, f);
		svg('feFuncA', { type: 'linear', slope: String(o.specularOpacity) }, transfer);
		svg('feBlend', { in: 'specular_saturated', in2: 'displaced', mode: 'normal', result: 'withSaturation' }, f);
		svg('feBlend', { in: 'specular_faded', in2: 'withSaturation', mode: 'normal' }, f);
		this.maps = [map, spec];
	}

	/** Where the maps sit inside the filtered box (px) — cheap, safe to call every frame. */
	place(x: number, y: number, W: number, H: number) {
		this.width = W;
		this.height = H;
		for (const m of this.magMap ? [...this.maps, this.magMap] : this.maps) {
			m.setAttribute('x', String(x));
			m.setAttribute('y', String(y));
			m.setAttribute('width', String(W));
			m.setAttribute('height', String(H));
		}
	}

	/** Regenerates the maps for a given size — costs a few ms, so callers debounce it. */
	private build(W: number, H: number, rc: number, n: number, dpr: number) {
		const urls = [
			displacementMap(W, H, rc, n, this.o.profile, this.maxV, dpr),
			specularMap(W, H, rc, n, this.o.lightAngle, dpr)
		];
		if (this.magMap) urls.push(magnifyingMap(W, H, dpr));
		return urls;
	}

	private swap(urls: string[]) {
		const targets = this.magMap ? [...this.maps, this.magMap] : this.maps;
		targets.forEach((m, i) => {
			m.setAttribute('href', urls[i]);
			m.setAttributeNS(XLINK_NS, 'xlink:href', urls[i]);
		});
	}

	/** Decoded map sets, so a size seen (or announced) before swaps in without waiting. */
	private decoded: { W: number; H: number; rc: number; n: number; dpr: number; urls: string[] }[] = [];
	private loading = new Set<string>();

	private find(W: number, H: number, rc: number, n: number, dpr: number) {
		// A pixel of difference is invisible; offsetWidth rounding must not miss the cache
		return this.decoded.find(
			e =>
				Math.abs(e.W - W) <= 1.5 && Math.abs(e.H - H) <= 1.5 && Math.abs(e.rc - rc) < 0.6 && e.n === n && e.dpr === dpr
		);
	}

	private load(W: number, H: number, rc: number, n: number, dpr: number): Promise<string[]> {
		const urls = this.build(W, H, rc, n, dpr);
		const id = [W, H, rc, n, dpr].join('|');
		this.loading.add(id);
		// A new href leaves feImage empty until the image decodes, and a filter without its map
		// shifts the whole backdrop for a frame or two: always decode before swapping
		return Promise.all(
			urls.map(url => {
				const img = new Image();
				img.src = url;
				return img.decode().catch(() => undefined);
			})
		).then(() => {
			this.loading.delete(id);
			this.decoded.push({ W, H, rc, n, dpr, urls });
			if (this.decoded.length > 24) this.decoded.shift();
			return urls;
		});
	}

	private get dpr() {
		// Real pixel density (browser zoom raises it) so the maps never get stretched into blocks
		return Math.min(window.devicePixelRatio || 1, 4);
	}

	/** Builds and decodes the maps for a size ahead of time (e.g. where an animation will land). */
	prepare(W: number, H: number, rc: number, n: number) {
		const dpr = this.dpr;
		W = Math.round(W);
		H = Math.round(H);
		if (this.find(W, H, rc, n, dpr) || this.loading.has([W, H, rc, n, dpr].join('|'))) return;
		this.load(W, H, rc, n, dpr);
	}

	/** True when maps for this size are decoded and would swap in instantly. */
	has(W: number, H: number, rc: number, n: number) {
		return !!this.find(W, H, rc, n, this.dpr);
	}

	generate(W: number, H: number, rc: number, n: number) {
		const dpr = this.dpr;
		const key = [W, H, rc, n, dpr].join('|');
		if (key === this.geometry) return;
		this.geometry = key;
		const cached = this.find(W, H, rc, n, dpr);
		if (cached) {
			this.swap(cached.urls);
			return;
		}
		if (!this.hasMaps) {
			// Nothing to keep on screen yet: use them right away
			this.hasMaps = true;
			const urls = this.build(W, H, rc, n, dpr);
			this.decoded.push({ W, H, rc, n, dpr, urls });
			this.swap(urls);
			return;
		}
		const generation = ++this.generation;
		this.load(W, H, rc, n, dpr).then(urls => {
			if (generation === this.generation) this.swap(urls);
		});
	}

	setRefraction(r: number) {
		this.refraction = r;
		this.disp.setAttribute('scale', ((r * this.maxV) / 0.498).toFixed(3));
	}

	setMagnify(m: number) {
		this.zoom = m;
		// zoom = 1 / (1 − scale / W)  →  scale = W · (1 − 1 / zoom)
		this.magDisp?.setAttribute('scale', ((this.width * (1 - 1 / Math.max(m, 0.01))) / 0.996).toFixed(3));
	}

	setDynamic(d: LiquidGlassDynamic) {
		if (d.refraction !== undefined) this.setRefraction(d.refraction);
		if (d.magnify !== undefined) this.setMagnify(d.magnify);
	}

	/** Forces the next generate() to rebuild the maps (e.g. once web fonts have loaded). */
	invalidate() {
		this.geometry = '';
	}

	/** False until maps exist: a filter without them would shift the whole backdrop. */
	get ready() {
		return this.geometry !== '';
	}

	get outwardReach() {
		// Outward displacement from the bezel, plus the edge samples of a zoom-out (magnify < 1)
		const zoomOut = this.zoom < 1 ? ((1 / this.zoom - 1) * Math.max(this.width, this.height)) / 2 : 0;
		return Math.max(0, ...this.o.profile.map(v => -v)) * this.refraction + zoomOut;
	}

	remove() {
		this.el.remove();
	}
}

/* ---------------------------------------------------------- native mode */

/** Corner radii of the padding box (the glass layer sits inside the border). */
function innerRadii(style: CSSStyleDeclaration) {
	const inner = (r: string, b: string) =>
		r.endsWith('%') ? r : `${Math.max(0, (parseFloat(r) || 0) - (parseFloat(b) || 0))}px`;
	return [
		inner(style.borderTopLeftRadius, style.borderLeftWidth),
		inner(style.borderTopRightRadius, style.borderRightWidth),
		inner(style.borderBottomRightRadius, style.borderRightWidth),
		inner(style.borderBottomLeftRadius, style.borderLeftWidth)
	].join(' ');
}

/**
 * While the glass is on, the element's own background and backdrop blur step aside: the glass
 * layer paints the tint (`--lg-tint`) on top of the refraction instead.
 */
function takeOverBackground(el: HTMLElement, on: boolean) {
	el.style.backgroundColor = on ? 'transparent' : '';
	el.style.backdropFilter = on ? 'none' : '';
	el.style.setProperty('-webkit-backdrop-filter', on ? 'none' : '');
}

/** The glass lives on a layer under the element's content (the element becomes its stacking context). */
function glassLayer(el: HTMLElement) {
	if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
	el.style.isolation = 'isolate';
	el.setAttribute('data-lg', '');
	const layer = document.createElement('div');
	layer.className = 'lg-layer';
	layer.setAttribute('aria-hidden', 'true');
	layer.inert = true;
	layer.style.cssText = 'position:absolute;inset:0;z-index:-1;pointer-events:none;corner-shape:inherit';
	el.prepend(layer);
	return layer;
}

/** Shared `prepare()`: sizes use the same radius and corner rules as the live measurement. */
function prepareSizes(
	el: HTMLElement,
	o: Resolved,
	filter: GlassFilter,
	sizes: { width: number; height: number; radius?: number }[]
) {
	const style = getComputedStyle(el);
	const n = cornerExponent(el, o.cornerShape);
	for (const { width, height, radius } of sizes) {
		const r = radius ?? radiusPx(style.borderTopLeftRadius, width, height);
		filter.prepare(width, height, Math.min(r, width / 2, height / 2), n);
	}
}

function attachNative(el: HTMLElement, o: Resolved): LiquidGlassHandle {
	const filter = new GlassFilter(o);
	// The backdrop filter goes on an inner layer, not on the element itself: an element with a
	// backdrop-filter is a "backdrop root", so glass nested inside it (e.g. a pill in a glass navbar)
	// would only see a translucent slice of its parent instead of the page
	const layer = glassLayer(el);
	// The layer covers the border box, like a backdrop-filter on the element would
	layer.style.borderRadius = 'inherit';
	let active = false;
	let timer = 0;
	let border = 0;

	const measure = () => {
		const style = getComputedStyle(el);
		border = parseFloat(style.borderTopWidth) || 0;
		layer.style.inset = `${-border}px`;
		const W = el.offsetWidth;
		const H = el.offsetHeight;
		const rc = Math.min(radiusPx(style.borderTopLeftRadius, W, H), W / 2, H / 2);
		return { W, H, rc, n: cornerExponent(el, o.cornerShape) };
	};
	const resize = () => {
		const { W, H, rc, n } = measure();
		if (!W || !H) return;
		filter.place(0, 0, W, H); // stretch the current maps while the size animates
		// While the size animates the current maps are stretched and rebuilt once it settles,
		// unless maps for this size were prepared already
		if (!filter.ready || filter.has(W, H, rc, n)) filter.generate(W, H, rc, n);
		clearTimeout(timer);
		timer = window.setTimeout(() => {
			const m = measure();
			filter.generate(m.W, m.H, m.rc, m.n);
			filter.place(0, 0, m.W, m.H);
		}, 80);
	};
	const ro = new ResizeObserver(resize);
	ro.observe(el);
	// Browser zoom changes the pixel density without resizing the element
	window.addEventListener('resize', resize);

	return {
		mode: 'native',
		setDynamic: d => filter.setDynamic(d),
		prepare: sizes => prepareSizes(el, o, filter, sizes),
		setActive(on) {
			if (on === active) return;
			active = on;
			layer.style.backdropFilter = on ? `url(#${filter.id})` : '';
			layer.style.background = on ? 'var(--lg-tint, transparent)' : '';
			takeOverBackground(el, on);
			// The border is painted under the glass layer; redraw it on top as an inset outline
			// (colour from --lg-border when the element defines it, since its border may be mid-transition)
			if (border) {
				const color =
					getComputedStyle(el).getPropertyValue('--lg-border').trim() || getComputedStyle(el).borderTopColor;
				el.style.outline = on ? `${border}px solid ${color}` : '';
				el.style.outlineOffset = on ? `${-border}px` : '';
			}
		},
		destroy() {
			ro.disconnect();
			window.removeEventListener('resize', resize);
			clearTimeout(timer);
			takeOverBackground(el, false);
			el.style.outline = '';
			el.style.outlineOffset = '';
			layer.remove();
			el.style.isolation = '';
			el.removeAttribute('data-lg');
			filter.remove();
		}
	};
}

/* ----------------------------------------------------------- clone mode */

const INHERITED = [
	'font-family',
	'font-size',
	'font-weight',
	'font-style',
	'line-height',
	'color',
	'letter-spacing',
	'word-spacing',
	'text-align',
	'text-transform',
	'white-space',
	'direction'
];
// Style attributes are left out on purpose: pointer effects rewrite them on every mouse move
const WATCHED_ATTRIBUTES = [
	'class',
	'src',
	'srcset',
	'hidden',
	'open',
	'value',
	'checked',
	'data-state',
	'aria-expanded'
];

const transparent = (c: string) => !c || c === 'transparent' || /rgba\(.*,\s*0\)$/.test(c);

function cloneSource(src: HTMLElement): HTMLElement {
	const c = src.cloneNode(true) as HTMLElement;
	const from = src.querySelectorAll<HTMLElement>('input,textarea,select,canvas');
	const to = c.querySelectorAll<HTMLElement>('input,textarea,select,canvas');
	from.forEach((x, i) => {
		const y = to[i];
		if (!y) return;
		if (x instanceof HTMLCanvasElement && y instanceof HTMLCanvasElement) {
			try {
				y.getContext('2d')?.drawImage(x, 0, 0);
			} catch {
				/* WebGL or tainted canvas: leave it blank */
			}
			return;
		}
		if (x instanceof HTMLInputElement && y instanceof HTMLInputElement) {
			if (x.type === 'checkbox' || x.type === 'radio') y.checked = x.checked;
			else if (x.type !== 'file') y.value = x.value;
		}
		y.removeAttribute('name');
		y.removeAttribute('autofocus');
		y.tabIndex = -1;
	});
	// Embedded media would load again: keep an empty box of the same size so layout does not move
	const media = src.querySelectorAll<HTMLElement>('iframe,video,audio');
	c.querySelectorAll<HTMLElement>('iframe,video,audio').forEach((y, i) => {
		const x = media[i];
		const box = document.createElement('div');
		box.className = y.className;
		box.style.cssText = y.style.cssText;
		if (x) {
			const display = getComputedStyle(x).display;
			Object.assign(box.style, {
				width: `${x.offsetWidth}px`,
				height: `${x.offsetHeight}px`,
				display: display === 'inline' ? 'inline-block' : display
			});
		}
		y.replaceWith(box);
	});
	// Scripts never render; removing (not replacing) them keeps grid and flex layouts intact
	c.querySelectorAll('script').forEach(n => n.remove());
	// Astro islands hydrate when connected: turn them into inert wrappers so React doesn't run twice
	c.querySelectorAll('astro-island').forEach(n => {
		const wrapper = document.createElement('div');
		wrapper.style.display = 'contents';
		wrapper.append(...n.childNodes);
		n.replaceWith(wrapper);
	});
	c.querySelectorAll('.lg-layer').forEach(n => n.remove());
	// A glass inside its own source must not show up in the copy it refracts
	c.querySelectorAll<HTMLElement>('[data-lg]').forEach(n => (n.style.visibility = 'hidden'));
	c.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
	c.removeAttribute('id');
	Object.assign(c.style, {
		margin: '0',
		width: `${src.offsetWidth}px`,
		height: `${src.offsetHeight}px`,
		boxSizing: 'border-box',
		position: 'relative',
		inset: 'auto',
		transform: 'none'
	});
	return c;
}

function attachClone(el: HTMLElement, o: Resolved, getSources: () => HTMLElement[]): LiquidGlassHandle {
	const filter = new GlassFilter(o);
	const sources = getSources();
	const style = getComputedStyle(el);
	el.classList.add('lg-clone');
	const layer = glassLayer(el);
	// Clipped by overflow + radius + corner-shape (not clip-path) so it follows superellipse corners too
	layer.style.overflow = 'hidden';
	layer.style.opacity = '0';
	const box = document.createElement('div');
	box.style.cssText = `position:absolute;overflow:hidden;filter:url(#${filter.id})`;
	const inners = sources.map(() => {
		const d = document.createElement('div');
		d.style.cssText = 'position:absolute;left:0;top:0;transform-origin:0 0';
		box.appendChild(d);
		return d;
	});
	// The element's own background would sit under the clone: it is repainted on top as a tint
	const tint = document.createElement('div');
	tint.style.cssText =
		'position:absolute;inset:0;border-radius:inherit;corner-shape:inherit;background:var(--lg-tint,transparent)';
	layer.append(box, tint);

	let active = false;
	let raf = 0;
	let key = '';
	let mapTimer = 0;
	let margin = 0;

	const reclone = (only?: Set<number>) => {
		sources.forEach((src, k) => {
			if (only && !only.has(k)) return;
			const parent = getComputedStyle(src.parentElement ?? src);
			let bg = getComputedStyle(src).backgroundColor;
			let n: HTMLElement | null = src;
			while (transparent(bg) && n?.parentElement) {
				n = n.parentElement;
				bg = getComputedStyle(n).backgroundColor;
			}
			const inner = inners[k];
			// Only override what the glass would inherit differently: copying computed values blindly turns
			// relative ones (a unitless line-height) into fixed px and changes the clone's layout
			const own = getComputedStyle(el);
			for (const p of INHERITED) {
				const value = parent.getPropertyValue(p);
				if (own.getPropertyValue(p) !== value) inner.style.setProperty(p, value);
				else inner.style.removeProperty(p);
			}
			inner.style.background = transparent(bg) ? 'transparent' : bg;
			inner.replaceChildren(cloneSource(src));
		});
		key = '';
	};

	let dirty = new Set<number>();
	let dirtyTimer = 0;
	const markDirty = (k: number) => {
		if (k < 0) return;
		dirty.add(k);
		clearTimeout(dirtyTimer);
		dirtyTimer = window.setTimeout(() => {
			const d = dirty;
			dirty = new Set();
			reclone(d);
		}, o.mutationDelay);
	};
	const mo = new MutationObserver(records => {
		for (const r of records) {
			const n = r.target instanceof Element ? r.target : r.target.parentElement;
			if (!n || n.closest('.lg-layer')) continue;
			markDirty(sources.findIndex(s => s.contains(n)));
		}
	});
	const ro = new ResizeObserver(entries => entries.forEach(e => markDirty(sources.indexOf(e.target as HTMLElement))));
	for (const s of sources) {
		mo.observe(s, {
			subtree: true,
			childList: true,
			characterData: true,
			attributes: true,
			attributeFilter: WATCHED_ATTRIBUTES
		});
		ro.observe(s);
	}
	reclone();

	const update = () => {
		raf = requestAnimationFrame(update);
		const W = el.clientWidth;
		const H = el.clientHeight;
		if (!W || !H) return;
		const gr = el.getBoundingClientRect();
		// Scale on each axis (transforms may stretch the glass unevenly)
		const kx = gr.width / el.offsetWidth || 1;
		const ky = gr.height / el.offsetHeight || 1;
		const ox = gr.left + el.clientLeft * kx;
		const oy = gr.top + el.clientTop * ky;
		const rc = Math.min(radiusPx(style.borderTopLeftRadius, W, H), W / 2, H / 2);
		const rects = sources.map(s => s.getBoundingClientRect());
		const next = [W, H, rc, window.devicePixelRatio || 1, kx, ky, ox, oy, ...rects.flatMap(r => [r.left, r.top])]
			.map(v => v.toFixed(3))
			.join('|');
		if (next === key) return;
		// Size, radius or pixel density (browser zoom) changed: maps must follow
		const sizeChanged = key.split('|').slice(0, 4).join('|') !== next.split('|').slice(0, 4).join('|');
		key = next;

		// Samples move inward, so the box only needs room for outward displacement and blur
		const nextMargin = Math.ceil(filter.outwardReach + o.blur * 3 + 1);
		const marginChanged = nextMargin !== margin;
		margin = nextMargin;
		if (sizeChanged || marginChanged) {
			Object.assign(box.style, {
				left: `${-margin}px`,
				top: `${-margin}px`,
				width: `${W + 2 * margin}px`,
				height: `${H + 2 * margin}px`
			});
			filter.place(margin, margin, W, H); // stretch the current maps while the size animates
			const n = cornerExponent(el, o.cornerShape);
			if (!filter.ready || filter.has(W, H, rc, n)) filter.generate(W, H, rc, n);
			clearTimeout(mapTimer);
			mapTimer = window.setTimeout(() => filter.generate(W, H, rc, n), 120);
			// The layer sits inside the border, so its corners use the inner (padding edge) radius
			layer.style.borderRadius = innerRadii(style);
		}
		rects.forEach((r, i) => {
			const ax = r.width / (sources[i].offsetWidth || r.width || 1) / kx;
			const ay = r.height / (sources[i].offsetHeight || r.height || 1) / ky;
			const x = (r.left - ox) / kx + margin;
			const y = (r.top - oy) / ky + margin;
			inners[i].style.transform = `matrix(${ax},0,0,${ay},${x.toFixed(2)},${y.toFixed(2)})`;
		});
	};

	return {
		mode: 'clone',
		prepare: sizes => prepareSizes(el, o, filter, sizes),
		setDynamic: d => {
			filter.setDynamic(d);
			key = '';
		},
		setActive(on) {
			if (on === active) return;
			active = on;
			layer.style.opacity = on ? '1' : '0';
			takeOverBackground(el, on);
			if (on && !raf) {
				key = '';
				raf = requestAnimationFrame(update);
			}
			if (!on && raf) {
				cancelAnimationFrame(raf);
				raf = 0;
			}
		},
		destroy() {
			cancelAnimationFrame(raf);
			raf = 0;
			clearTimeout(dirtyTimer);
			clearTimeout(mapTimer);
			mo.disconnect();
			ro.disconnect();
			layer.remove();
			filter.remove();
			el.classList.remove('lg-clone');
			el.removeAttribute('data-lg');
			takeOverBackground(el, false);
			el.style.isolation = '';
		}
	};
}

/* ----------------------------------------------------------------- entry */

export function attachLiquidGlass(el: HTMLElement, options: LiquidGlassOptions = {}): LiquidGlassHandle {
	const { sources, force, ...rest } = options;
	const o = { ...DEFAULTS, ...rest };
	if (force === 'native' || (!force && supportsSvgBackdropFilter())) return attachNative(el, o);

	const fallback = force ?? (o.fallback === 'clone' && !isLowEndOrMobile() ? 'clone' : 'blur');
	if (fallback === 'clone' && sources) return attachClone(el, o, sources);

	// No refraction: keep the element's own CSS, or frost it while active if asked to
	let active = false;
	const frost = (on: boolean) => {
		const value = on ? `blur(${o.blurFallback}px) saturate(1.6)` : '';
		el.style.backdropFilter = value;
		el.style.setProperty('-webkit-backdrop-filter', value);
	};
	return {
		mode: 'blur',
		setActive(on) {
			if (!o.blurFallback || on === active) return;
			active = on;
			frost(on);
		},
		setDynamic() {},
		prepare() {},
		destroy() {
			if (active) frost(false);
		}
	};
}
