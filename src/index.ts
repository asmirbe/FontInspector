import type {
	DebugConfig
} from './types';

import { FontHierarchyAnalyzer } from './modules/FontHierarchyAnalyzer';
import { FontDetectorUI } from './modules/FontDetectorUI';

const EnhancedFontAnalyzer = (function () {
	'use strict';

	return {
		hierarchyAnalyzer: new FontHierarchyAnalyzer(),
		ui: new FontDetectorUI(),

		setDebug(config: Partial<DebugConfig>): void {
			this.ui.setDebugConfig(config);
		},

		analyzeInteractive(): void {
			this.hierarchyAnalyzer.reset();
			this.ui.activate();
		},
	};
})();

// Expose to window object
(window as any).EnhancedFontAnalyzer = EnhancedFontAnalyzer;