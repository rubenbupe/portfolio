export const THEME_STORAGE_KEY = 'theme';

export type ThemePreference = 'system' | 'light' | 'dark';
export type ResolvedTheme = 'light' | 'dark';

export const isThemePreference = (value: string | null): value is ThemePreference => {
	return value === 'light' || value === 'dark' || value === 'system';
};

export const getStoredThemePreference = (
	storage: Pick<Storage, 'getItem'>,
	storageKey: string = THEME_STORAGE_KEY
): ThemePreference => {
	const value = storage.getItem(storageKey);
	return isThemePreference(value) ? value : 'system';
};

export const getSystemTheme = (systemQuery: Pick<MediaQueryList, 'matches'>): ResolvedTheme => {
	return systemQuery.matches ? 'dark' : 'light';
};

export const resolveThemePreference = (
	themePreference: ThemePreference,
	systemTheme: ResolvedTheme
): ResolvedTheme => {
	return themePreference === 'system' ? systemTheme : themePreference;
};

export const toCanonicalThemePreference = (
	resolvedTheme: ResolvedTheme,
	systemTheme: ResolvedTheme
): ThemePreference => {
	return resolvedTheme === systemTheme ? 'system' : resolvedTheme;
};

export const applyResolvedTheme = (
	root: Pick<Element, 'classList'>,
	resolvedTheme: ResolvedTheme
) => {
	root.classList.toggle('light', resolvedTheme === 'light');
	root.classList.toggle('dark', resolvedTheme === 'dark');
};

export const createThemeInitScript = (storageKey: string = THEME_STORAGE_KEY) => {
	const key = JSON.stringify(storageKey);

	return `(() => {
		const themeStorageKey = ${key};
		const root = document.documentElement;
		const systemQuery = window.matchMedia('(prefers-color-scheme: dark)');
		const systemTheme = systemQuery.matches ? 'dark' : 'light';
		let storedPreference = 'system';

		try {
			const value = localStorage.getItem(themeStorageKey);
			storedPreference = value === 'light' || value === 'dark' || value === 'system' ? value : 'system';
		} catch {
			storedPreference = 'system';
		}

		const resolvedTheme = storedPreference === 'system' ? systemTheme : storedPreference;
		root.classList.toggle('light', resolvedTheme === 'light');
		root.classList.toggle('dark', resolvedTheme === 'dark');
	})();`;
};