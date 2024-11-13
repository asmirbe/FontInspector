import type {
	DebugConfig
} from './types';

import { FontHierarchyAnalyzer } from './modules/FontHierarchyAnalyzer';
import { FontDetectorUI } from './modules/FontDetectorUI';

const EnhancedFontAnalyzer = (function () {
	'use strict';

	const hierarchyAnalyzer = new FontHierarchyAnalyzer();
	const ui = new FontDetectorUI(hierarchyAnalyzer); // Pass analyzer instance to UI

	return {
		/**
		 * Sets debug configuration for the font analyzer
		 * @param config Debug configuration options
		 */
		setDebug(config: Partial<DebugConfig>): void {
			ui.setDebugConfig(config);
		},

		/**
		 * Activates interactive mode for font analysis
		 * This mode allows users to inspect fonts on the page
		 */
		analyzeInteractive(): void {
			hierarchyAnalyzer.reset();
			ui.activate();
		},

		/**
		 * Runs a headless analysis of the page's fonts
		 * @returns Analysis report containing font hierarchy and usage statistics
		 */
		analyzeHeadless() {
			hierarchyAnalyzer.reset();
			const rootElement = document.body;
			hierarchyAnalyzer.analyzeHierarchy(rootElement);

			const report = {
				hierarchy: hierarchyAnalyzer.getHierarchyReport(),
				fontUsageStats: hierarchyAnalyzer.getFontUsageStats()
			};

			// Log analysis results
			const fontUsageStats = report.fontUsageStats;
			if (fontUsageStats) {
				const sortedFonts = Array.from(fontUsageStats.entries())
					.sort((a, b) => b[1] - a[1]);

				console.group('Font Usage Analysis');
				console.log('Primary Font:', sortedFonts[0]?.[0] || 'No fonts found');
				console.log('Font Usage Distribution:');
				sortedFonts.forEach(([font, count]) => {
					const percentage = (count / document.getElementsByTagName('*').length * 100).toFixed(2);
					console.log(`${font}: ${count} occurrences (${percentage}%)`);
				});
				console.groupEnd();
			}

			return report;
		},

		/**
		 * Gets the currently detected primary font
		 * @returns Name of the most frequently used font
		 */
		getPrimaryFont(): string {
			return hierarchyAnalyzer.getPrimaryFont();
		},

		/**
		 * Gets the current font usage statistics
		 * @returns Map of font names to their usage count
		 */
		getFontUsageStats(): Map<string, number> {
			return hierarchyAnalyzer.getFontUsageStats();
		}
	};
})();

// Expose to window object
(window as any).EnhancedFontAnalyzer = EnhancedFontAnalyzer;

export default EnhancedFontAnalyzer;