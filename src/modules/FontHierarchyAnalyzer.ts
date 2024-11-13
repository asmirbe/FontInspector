import type {
	FontMetrics,
	FontHierarchyData
} from '../types';

export class FontHierarchyAnalyzer {
	private hierarchy: FontHierarchyData[] = [];
	private fontUsageStats: Map<string, number> = new Map();
	private primaryFont: string | null = null;

	private readonly excludedTags: Set<string> = new Set([
		'script', 'style', 'meta', 'link', 'noscript', 'iframe',
		'object', 'embed', 'param', 'source', 'track'
	]);

	private standardizeFontName(fontName: string): string {
		// Remove quotes and extra spaces
		let cleanName = fontName
			.replace(/['"]/g, '') // Remove single and double quotes
			.trim() // Remove leading/trailing spaces
			.replace(/\s+/g, ' '); // Replace multiple spaces with single space

		// Return mapped name if it exists, otherwise capitalize first letter of each word
		return cleanName.split(' ')
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(' ');
	}

	public analyzeHierarchy(element: HTMLElement, parent?: FontHierarchyData): void {
		if (this.excludedTags.has(element.tagName.toLowerCase())) {
			return;
		}

		const metrics = this.getElementFontMetrics(element);
		this.updateFontUsageStats(metrics.name);

		const current: FontHierarchyData = {
			tag: element.tagName.toLowerCase(),
			fontMetrics: metrics,
			frequency: 1,
			children: []
		};

		if (parent) {
			parent.children.push(current);
		} else {
			this.hierarchy.push(current);
		}

		Array.from(element.children)
			.filter(child => !this.excludedTags.has(child.tagName.toLowerCase()))
			.forEach(child => {
				this.analyzeHierarchy(child as HTMLElement, current);
			});
	}

	private updateFontUsageStats(fontName: string): void {
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

	public getElementFontMetrics(element: HTMLElement): FontMetrics {
		const style = window.getComputedStyle(element);
		const rawFontFamily = style.fontFamily.split(',')[0].trim();

		return {
			name: this.standardizeFontName(rawFontFamily),
			weight: parseInt(style.fontWeight),
			style: style.fontStyle,
			size: style.fontSize,
			color: style.color,
			lineHeight: style.lineHeight,
			letterSpacing: style.letterSpacing
		};
	}

	public getPrimaryFont(): string {
		return this.primaryFont || 'No font detected';
	}

	public getHierarchyReport(): FontHierarchyData[] {
		return this.hierarchy;
	}

	public getFontUsageStats(): Map<string, number> {
		return this.fontUsageStats;
	}

	public reset(): void {
		this.hierarchy = [];
		this.fontUsageStats.clear();
		this.primaryFont = null;
	}
}