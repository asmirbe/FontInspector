import { FontHierarchyAnalyzer } from './modules/FontHierarchyAnalyzer';
import { activate as activateFontDetectorUI } from './modules/FontDetectorUI';

const EnhancedFontAnalyzer = (function () {
	'use strict';

	let isAnalyzing = false;

	return {
		hierarchyAnalyzer: new FontHierarchyAnalyzer(),
		analyzeInteractive: function () {
			if (isAnalyzing) {
				console.warn('Font analyzer is already active');
				return;
			}

			console.log('Activating font detector...');
			isAnalyzing = true;
			activateFontDetectorUI();
		},
		isActive: function () {
			return isAnalyzing;
		}
	};
})();

// Make it available globally
(window as any).EnhancedFontAnalyzer = EnhancedFontAnalyzer;

// Add a debug function to help troubleshoot
(window as any).debugFontAnalyzer = () => {
	console.log('EnhancedFontAnalyzer status:', {
		isDefined: typeof window.EnhancedFontAnalyzer !== 'undefined',
		isActive: window.EnhancedFontAnalyzer?.isActive(),
		hierarchyAnalyzer: window.EnhancedFontAnalyzer?.hierarchyAnalyzer
	});
};