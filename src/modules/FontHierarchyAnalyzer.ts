import type {
	FontMetrics,
	FontHierarchyData
} from '../types';

export class FontHierarchyAnalyzer {
	private hierarchy: FontHierarchyData[] = [];
	private fontUsageStats: Map<string, number> = new Map();
	private primaryFont: string | null = null;
	private metricsCache: WeakMap<HTMLElement, FontMetrics> = new WeakMap();
	private fontLoadTimes: Map<string, number> = new Map();

	private readonly excludedTags: Set<string> = new Set([
		'script', 'style', 'meta', 'link', 'noscript', 'iframe',
		'object', 'embed', 'param', 'source', 'track', 'svg', 'path',
		'circle', 'rect', 'polygon', 'canvas'
	]);

	private readonly systemFonts: Set<string> = new Set([
		'Arial', 'Helvetica', 'Times New Roman', 'Times', 'Courier New',
		'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
		'Comic Sans MS', 'Trebuchet MS', 'Impact', 'Sans-serif', 'Serif'
	]);

	private standardizeFontName(fontName: string): string {
		if (!fontName) return 'System Default';

		// Remove quotes, extra spaces, and normalize font name
		let cleanName = fontName
			.replace(/["']/g, '') // Remove quotes
			.replace(/[^\x00-\x7F]/g, '') // Remove non-ASCII characters
			.trim() // Remove leading/trailing spaces
			.replace(/\s+/g, ' '); // Normalize spaces

		// Handle special cases
		if (cleanName.toLowerCase().includes('monospace')) return 'Monospace';
		if (cleanName.toLowerCase().includes('sans-serif')) return 'Sans-serif';
		if (cleanName.toLowerCase().includes('serif')) return 'Serif';

		// Capitalize words
		cleanName = cleanName.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
			.join(' ');

		return cleanName || 'System Default';
	}

	private isElementVisible(element: HTMLElement): boolean {
		const style = window.getComputedStyle(element);
		return style.display !== 'none' &&
			style.visibility !== 'hidden' &&
			style.opacity !== '0' &&
			element.offsetWidth > 0 &&
			element.offsetHeight > 0;
	}

	private hasTextContent(element: HTMLElement): boolean {
		return (element.textContent?.trim().length ?? 0) > 0;
	}

	private shouldAnalyzeElement(element: HTMLElement): boolean {
		return !this.excludedTags.has(element.tagName.toLowerCase()) &&
			this.isElementVisible(element) &&
			this.hasTextContent(element);
	}

	public analyzeHierarchy(element: HTMLElement, parent?: FontHierarchyData): void {
		if (!this.shouldAnalyzeElement(element)) return;

		try {
			const metrics = this.getElementFontMetrics(element);
			if (!metrics) return;

			this.updateFontUsageStats(metrics.name);

			const current: FontHierarchyData = {
				tag: element.tagName.toLowerCase(),
				fontMetrics: metrics,
				frequency: 1,
				children: []
			};

			// Track font load time
			if (!this.fontLoadTimes.has(metrics.name)) {
				this.fontLoadTimes.set(metrics.name, performance.now());
			}

			if (parent) {
				parent.children.push(current);
			} else {
				this.hierarchy.push(current);
			}

			// Analyze children
			Array.from(element.children)
				.filter(child => child instanceof HTMLElement)
				.forEach(child => {
					this.analyzeHierarchy(child as HTMLElement, current);
				});

		} catch (error) {
			console.warn(`Error analyzing element ${element.tagName}:`, error);
		}
	}

	private updateFontUsageStats(fontName: string): void {
		if (!fontName) return;

		const standardizedName = this.standardizeFontName(fontName);
		const currentCount = this.fontUsageStats.get(standardizedName) || 0;
		this.fontUsageStats.set(standardizedName, currentCount + 1);

		// Update primary font if this font has the highest count
		const currentPrimaryCount = this.primaryFont ?
			(this.fontUsageStats.get(this.primaryFont) || 0) : 0;

		if (currentCount + 1 > currentPrimaryCount) {
			this.primaryFont = standardizedName;
		}
	}

	public getElementFontMetrics(element: HTMLElement): FontMetrics | null {
		// Check cache first
		const cachedMetrics = this.metricsCache.get(element);
		if (cachedMetrics) return cachedMetrics;

		try {
			const style = window.getComputedStyle(element);
			const fontFamilies = style.fontFamily.split(',').map(f => f.trim());
			const primaryFont = fontFamilies[0];

			if (!primaryFont) return null;

			const metrics: FontMetrics = {
				name: this.standardizeFontName(primaryFont),
				weight: parseInt(style.fontWeight) || 400,
				style: style.fontStyle || 'normal',
				size: style.fontSize || '16px',
				color: style.color || '#000000',
				lineHeight: style.lineHeight || 'normal',
				letterSpacing: style.letterSpacing || 'normal',
				category: this.getFontCategory(primaryFont),
				alternativeFonts: fontFamilies.slice(1).map(f => this.standardizeFontName(f)),
				loadTime: this.fontLoadTimes.get(this.standardizeFontName(primaryFont))
			};

			// Cache the metrics
			this.metricsCache.set(element, metrics);
			return metrics;

		} catch (error) {
			console.warn(`Error getting font metrics for element ${element.tagName}:`, error);
			return null;
		}
	}

	private getFontCategory(fontName: string): string {
		const standardizedName = this.standardizeFontName(fontName);

		if (standardizedName.toLowerCase().includes('serif')) return 'serif';
		if (standardizedName.toLowerCase().includes('sans')) return 'sans-serif';
		if (standardizedName.toLowerCase().includes('mono')) return 'monospace';
		if (standardizedName.toLowerCase().includes('cursive')) return 'cursive';
		if (standardizedName.toLowerCase().includes('fantasy')) return 'fantasy';

		return this.systemFonts.has(standardizedName) ? 'system' : 'custom';
	}

	public getPrimaryFont(): string {
		return this.primaryFont || 'System Default';
	}

	public getHierarchyReport(): FontHierarchyData[] {
		return this.hierarchy;
	}

	public getFontUsageStats(): Map<string, number> {
		return new Map([...this.fontUsageStats.entries()].sort((a, b) => b[1] - a[1]));
	}

	public getFontLoadTimes(): Map<string, number> {
		return new Map([...this.fontLoadTimes.entries()]);
	}

	public getSystemFonts(): Set<string> {
		return new Set(this.systemFonts);
	}

	public reset(): void {
		this.hierarchy = [];
		this.fontUsageStats.clear();
		this.primaryFont = null;
		this.metricsCache = new WeakMap();
		this.fontLoadTimes.clear();
	}
}
