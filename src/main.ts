interface FontMetrics {
	name: string;
	weight: number;
	style: string;
	size: string;
	color: string;
	lineHeight: string;
	letterSpacing: string;
	category?: string;
	loadTime?: number;
	alternativeFonts?: string[];
}

interface FontHierarchyData {
	tag: string;
	fontMetrics: FontMetrics;
	frequency: number;
	children: FontHierarchyData[];
}

interface FontAnalysisReport {
	hierarchy: FontHierarchyData[];
	fontUsageStats?: Map<string, number>;
}

interface TrackedElement {
	element: HTMLElement;
	originalStyles: {
		outline: string;
		backgroundColor: string;
	};
}

interface ModalInfo {
	modal: HTMLDivElement;
	targetElement: HTMLElement;
	highlightButton: HTMLButtonElement;
}

const EnhancedFontAnalyzer = (function () {
	'use strict';

	class FontCategoryDetector {
		private static readonly categories: Record<string, string[]> = {
			serif: ['Times New Roman', 'Georgia', 'Garamond'],
			sansSerif: ['Arial', 'Helvetica', 'Roboto'],
			display: ['Impact', 'Comic Sans MS'],
			monospace: ['Courier New', 'Monaco', 'Consolas'],
			handwriting: ['Brush Script MT', 'Comic Sans MS']
		};

		public detectCategory(fontFamily: string): string {
			for (const [category, fonts] of Object.entries(FontCategoryDetector.categories)) {
				if (fonts.includes(fontFamily)) {
					return category;
				}
			}
			return this.analyzeCharacteristics(fontFamily);
		}

		private analyzeCharacteristics(fontFamily: string): string {
			return 'unknown';
		}

		public suggestAlternatives(fontFamily: string, category: string): string[] {
			return FontCategoryDetector.categories[category] || [];
		}
	}

	class FontHierarchyAnalyzer {
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

			// Handle special cases
			const fontNameMap: { [key: string]: string } = {
				'arial': 'Arial',
				'helvetica': 'Helvetica',
				'times new roman': 'Times New Roman',
				'timesnewroman': 'Times New Roman',
				'times': 'Times New Roman',
				'georgia': 'Georgia',
				'courier new': 'Courier New',
				'couriernew': 'Courier New',
				'verdana': 'Verdana',
				'trebuchet ms': 'Trebuchet MS',
				'trebuchetms': 'Trebuchet MS',
				'impact': 'Impact',
				'comic sans ms': 'Comic Sans MS',
				'comicsansms': 'Comic Sans MS',
				'tahoma': 'Tahoma',
				'calibri': 'Calibri',
				'segoe ui': 'Segoe UI',
				'segoeui': 'Segoe UI',
				'roboto': 'Roboto',
				'open sans': 'Open Sans',
				'opensans': 'Open Sans'
			};

			// Convert to lowercase for comparison
			const lowerName = cleanName.toLowerCase();

			// Return mapped name if it exists, otherwise capitalize first letter of each word
			return fontNameMap[lowerName] ||
				cleanName.split(' ')
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

	class FontDetectorUI {
		private activeModals: Map<string, ModalInfo> = new Map();
		private baseZIndex: number = 10001;  // Base z-index for modals
		private topZIndex: number = this.baseZIndex;  // Track highest z-index
		private tooltip: HTMLDivElement = document.createElement('div');
		private tooltipOffset = { x: 10, y: 10 }; // Define consistent offset
		private exitButton: HTMLButtonElement = document.createElement('button');
		private instructionTooltip: HTMLDivElement | null = null;
		private isActive: boolean = false;
		private observer: MutationObserver = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				if (mutation.type === 'childList') {
					mutation.addedNodes.forEach((node) => {
						if (node.nodeType === Node.ELEMENT_NODE &&
							node instanceof HTMLElement &&
							node.innerText) {
							analyzer.hierarchyAnalyzer.analyzeHierarchy(node);
						}
					});
				}
			});
		});
		private trackedElements: Map<string, TrackedElement> = new Map();

		private highlightElement(element: HTMLElement, isHighlighting: boolean): void {
			if (isHighlighting) {
				// Store original styles before modifying
				const computedStyle = window.getComputedStyle(element);
				const trackedElement: TrackedElement = {
					element,
					originalStyles: {
						outline: computedStyle.outline,
						backgroundColor: computedStyle.backgroundColor,
					}
				};

				// Apply highlight effect
				element.style.outline = '2px solid #2196F3';
				element.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';

				this.trackedElements.set(element.getAttribute('data-font-track-id')!, trackedElement);
			} else {
				// Restore original styles
				const tracked = this.trackedElements.get(element.getAttribute('data-font-track-id')!);
				if (tracked) {
					element.style.outline = tracked.originalStyles.outline;
					element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				}
			}
		}

		private createHighlightButton(element: HTMLElement, modalId: string): HTMLButtonElement {
			const button = document.createElement('button');
			const trackId = `font-track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			element.setAttribute('data-font-track-id', trackId);
			element.setAttribute('data-modal-id', modalId); // Link element back to modal

			button.style.cssText = `
            padding: 4px 8px;
            margin-left: 8px;
            border: none;
            border-radius: 4px;
            background: #f0f0f0;
            cursor: pointer;
            font-size: 12px;
        `;
			button.textContent = 'Highlight Element';

			let isHighlighted = false;

			button.addEventListener('click', (e) => {
				e.stopPropagation();
				isHighlighted = !isHighlighted;
				this.highlightElement(element, isHighlighted);
				button.textContent = isHighlighted ? 'Remove Highlight' : 'Highlight Element';
				button.style.background = isHighlighted ? '#2196F3' : '#f0f0f0';
				button.style.color = isHighlighted ? 'white' : 'black';
			});

			return button;
		}

		private cleanupTrackedElement(trackId: string): void {
			const tracked = this.trackedElements.get(trackId);
			if (tracked) {
				const element = tracked.element;
				// Restore original styles
				element.style.outline = tracked.originalStyles.outline;
				element.style.backgroundColor = tracked.originalStyles.backgroundColor;

				// Remove our custom attribute
				element.removeAttribute('data-font-track-id');

				// Remove from tracking
				this.trackedElements.delete(trackId);
			}
		}

		private cleanupModal(modalId: string): void {
			const modalInfo = this.activeModals.get(modalId);
			if (modalInfo) {
				const { modal, targetElement, highlightButton } = modalInfo;

				// Check if element is highlighted
				if (highlightButton.textContent === 'Remove Highlight') {
					const trackId = targetElement.getAttribute('data-font-track-id');
					if (trackId) {
						this.cleanupTrackedElement(trackId);
					}
				}

				// Remove modal-element association
				targetElement.removeAttribute('data-modal-id');

				// Remove the modal
				if (modal.parentNode) {
					modal.parentNode.removeChild(modal);
				}

				// Remove from active modals
				this.activeModals.delete(modalId);
			}
		}


		constructor() {
			this.createTooltip();
			this.createExitButton();
		}

		private createTooltip(): void {
			this.tooltip = document.createElement('div');
			this.tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
				backdrop-filter: blur(16px);
            padding: 8px;
            color: white;
            font-family: Segoe UI, Helvetica, Arial, sans-serif;
            font-size: 14px;
            line-height: 1;
            border-radius: 4px;
            pointer-events: none;
            z-index: 10000;
            display: none;
        `;
			document.body.appendChild(this.tooltip);
		}

		private createModal(id: string): HTMLDivElement {
			const modal = document.createElement('div');
			modal.setAttribute('data-modal-id', id);

			// Set initial z-index
			this.topZIndex = Math.max(
				this.baseZIndex,
				...Array.from(this.activeModals.values())
					.map(modalInfo => parseInt(modalInfo.modal.style.zIndex) || this.baseZIndex)
			) + 1;

			modal.style.cssText = `
            position: absolute;
            background: white;
            padding: 16px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            font-family: Segoe UI, Helvetica, Arial, sans-serif;
            z-index: ${this.topZIndex};
            max-width: 300px;
            min-width: 250px;
            border: 1px solid rgba(0, 0, 0, 0.1);
        `;

			modal.addEventListener('mousedown', (e: MouseEvent) => {
				if (!(e.target as HTMLElement).classList.contains('modal-close-btn')) {
					this.bringToFront(modal);
				}
			});

			document.body.appendChild(modal);
			return modal;
		}

		private bringToFront(modal: HTMLDivElement): void {
			// Get current highest z-index from all modals
			const highestZIndex = Math.max(
				this.baseZIndex,
				...Array.from(this.activeModals.values())
					.map(modalInfo => parseInt(modalInfo.modal.style.zIndex) || this.baseZIndex)
			);

			// Only increment if this modal isn't already at the top
			if (parseInt(modal.style.zIndex) < highestZIndex) {
				this.topZIndex = highestZIndex + 1;
				modal.style.zIndex = this.topZIndex.toString();
			}
		}

		private createExitButton(): void {
			this.exitButton = document.createElement('button');
			this.exitButton.textContent = 'Cancel';
			this.exitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px;
            background: rgba(0, 0, 0, 0.8);
				backdrop-filter: blur(16px);
            padding: 8px;
				border-radius: 4px;
				    font-size: 14px;
    line-height: 1;
            color: white;
            cursor: pointer;
            z-index: 10002;
            display: none;
        `;
			this.exitButton.onclick = () => this.deactivate();
			document.body.appendChild(this.exitButton);
		}

		private generateModalId(element: HTMLElement): string {
			// Create a unique ID based on element properties and position
			const rect = element.getBoundingClientRect();
			return `modal-${element.tagName}-${rect.left}-${rect.top}-${Date.now()}`;
		}

		private setupMutationObserver(): void {
			this.observer.disconnect();
			const config = {
				childList: true,
				subtree: true,
				characterData: true,
				attributes: true,
				attributeFilter: ['style', 'class']
			};

			this.observer.observe(document.body, config);
		}

		public activate(): void {
			this.isActive = true;
			this.exitButton.style.display = 'block';
			this.setupEventListeners();
			this.setupMutationObserver();

			this.instructionTooltip = document.createElement('div');
			this.instructionTooltip.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            font-size: 14px;
            font-family: Segoe UI, Helvetica, Arial, sans-serif;
            transform: translate(-50%, -50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 16px;
            border-radius: 4px;
            z-index: 10003;
        `;
			this.instructionTooltip.textContent = 'Hover over text elements to see font information. Click to see details. Click multiple elements to compare fonts.';
			document.body.appendChild(this.instructionTooltip);

			const dismissInstructions = () => {
				if (this.instructionTooltip && this.instructionTooltip.parentNode) {
					this.instructionTooltip.remove();
					this.instructionTooltip = null;
				}
				document.removeEventListener('click', dismissInstructions);
			};

			document.addEventListener('click', dismissInstructions);
			setTimeout(dismissInstructions, 3000);
		}

		public deactivate(): void {
			// Clean up all modals and their associated elements
			this.activeModals.forEach((modalInfo, modalId) => {
				this.cleanupModal(modalId);
			});
			this.activeModals.clear();
			// Clean up all tracked elements
			this.trackedElements.forEach((_, trackId) => {
				this.cleanupTrackedElement(trackId);
			});
			this.trackedElements.clear();

			// Clean up all modals
			this.activeModals.forEach((_, modalId) => {
				this.cleanupModal(modalId);
			});
			this.activeModals.clear();

			// Reset z-index counter
			this.topZIndex = this.baseZIndex;

			// Remove UI elements
			this.exitButton.style.display = 'none';
			this.tooltip.style.display = 'none';

			if (this.instructionTooltip && this.instructionTooltip.parentNode) {
				this.instructionTooltip.remove();
				this.instructionTooltip = null;
			}

			// Remove event listeners
			this.removeEventListeners();
			this.observer.disconnect();

			this.isActive = false;
		}

		private setupEventListeners(): void {
			document.addEventListener('mousemove', this.handleMouseMove);
			document.addEventListener('click', this.handleClick);
		}

		private removeEventListeners(): void {
			document.removeEventListener('mousemove', this.handleMouseMove);
			document.removeEventListener('click', this.handleClick);
		}

		private handleMouseMove = (e: MouseEvent): void => {
			if (!this.isActive) return;

			const target = e.target as HTMLElement;

			// Check if cursor is over any modal or exit button
			if (this.exitButton.contains(target) ||
				Array.from(this.activeModals.values()).some(modalInfo => modalInfo.modal.contains(target))) {
				this.tooltip.style.display = 'none';
				return;
			}

			if (target && target.innerText) {
				const metrics = analyzer.hierarchyAnalyzer.getElementFontMetrics(target);
				this.tooltip.textContent = `${metrics.name}`;
				this.tooltip.style.display = 'block';

				const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
				const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

				// Position tooltip with consistent offset
				this.tooltip.style.left = `${e.pageX - scrollLeft + this.tooltipOffset.x}px`;
				this.tooltip.style.top = `${e.pageY - scrollTop + this.tooltipOffset.y}px`;
			} else {
				this.tooltip.style.display = 'none';
			}
		};

		private handleClick = (e: MouseEvent): void => {
			if (!this.isActive) return;

			const target = e.target as HTMLElement;

			// Handle modal close button clicks
			if (target.classList.contains('modal-close-btn')) {
				e.stopPropagation();
				const modalElement = target.closest('[data-modal-id]') as HTMLElement;
				if (modalElement) {
					const modalId = modalElement.getAttribute('data-modal-id');
					if (modalId) {
						this.cleanupModal(modalId);
					}
				}
				return;
			}

			// Check if click is inside any existing modal
			const clickedModal = target.closest('[data-modal-id]') as HTMLElement;
			if (clickedModal) {
				// If clicked inside a modal but not on close button, bring it to front
				if (!target.classList.contains('modal-close-btn')) {
					this.bringToFront(clickedModal as HTMLDivElement);
				}
				return;
			}

			// Check if click is on exit button
			if (this.exitButton.contains(target)) {
				return;
			}

			if (target && target.innerText) {
				const metrics = analyzer.hierarchyAnalyzer.getElementFontMetrics(target);
				const modalId = this.generateModalId(target);
				const modal = this.createModal(modalId);
				const highlightButton = this.createHighlightButton(target, modalId);

				// Store all relevant information
				this.activeModals.set(modalId, {
					modal,
					targetElement: target,
					highlightButton
				});

				// Rest of modal creation code remains the same...
				modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center;">
                        <p style="margin: 0; font-weight: bold;">Font Details</p>
                    </div>
                    <button class="modal-close-btn"
                        style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
                </div>
                <dl style="margin: 0;">
                    <dt style="font-weight: 600; margin-top: 8px;">Font Family:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px; display: flex; align-items: center;">
                        ${metrics.name}
                    </dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Weight:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">${metrics.weight}</dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Color:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">
						 <span style="background-color: ${metrics.color}; width: 10px; height:10px; display: block;"></span>${metrics.color}</dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Style:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">${metrics.style}</dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Size:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">${metrics.size}</dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Line Height:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">${metrics.lineHeight}</dd>
                    <dt style="font-weight: 600; margin-top: 8px;">Letter Spacing:</dt>
                    <dd style="margin-left: 0; margin-bottom: 8px;">${metrics.letterSpacing}</dd>
                </dl>
            `;

				// Add highlight button after font family
				const fontFamilyDd = modal.querySelector('dd');
				if (fontFamilyDd) {
					fontFamilyDd.appendChild(highlightButton);
				}

				// Position the modal with the same offset as tooltip
				const windowWidth = document.documentElement.clientWidth;
				const windowHeight = document.documentElement.clientHeight;
				let x = e.pageX + this.tooltipOffset.x;
				let y = e.pageY + this.tooltipOffset.y;

				// Check boundaries after getting modal dimensions
				modal.style.visibility = 'hidden';
				modal.style.display = 'block';
				const modalRect = modal.getBoundingClientRect();

				// Adjust position if modal would overflow viewport
				if (x + modalRect.width > windowWidth + window.scrollX) {
					x = x - modalRect.width - (this.tooltipOffset.x * 2);
				}
				if (y + modalRect.height > windowHeight + window.scrollY) {
					y = y - modalRect.height - (this.tooltipOffset.y * 2);
				}

				// Set final position and show modal
				modal.style.left = `${x}px`;
				modal.style.top = `${y}px`;
				modal.style.visibility = 'visible';

				this.activeModals.set(modalId, {
					modal,
					targetElement: target,
					highlightButton
				});
			}
		};
	}

	const analyzer = {
		categoryDetector: new FontCategoryDetector(),
		hierarchyAnalyzer: new FontHierarchyAnalyzer(),
		ui: new FontDetectorUI(),

		analyzeInteractive(): void {
			this.hierarchyAnalyzer.reset();
			this.ui.activate();
		},

		analyzeHeadless(): FontAnalysisReport {
			this.hierarchyAnalyzer.reset();
			const rootElement = document.body;
			this.hierarchyAnalyzer.analyzeHierarchy(rootElement);

			const report: FontAnalysisReport = {
				hierarchy: this.hierarchyAnalyzer.getHierarchyReport(),
				fontUsageStats: this.hierarchyAnalyzer.getFontUsageStats()
			};

			// Handle possible undefined fontUsageStats
			const fontUsageStats = report.fontUsageStats;
			if (fontUsageStats) {
				const sortedFonts = Array.from(fontUsageStats.entries())
					.sort((a, b) => b[1] - a[1]);

				console.log('Font Usage Analysis:');
				console.log('Primary Font:', sortedFonts[0]?.[0] || 'No fonts found');
				console.log('Font Usage Distribution:');
				sortedFonts.forEach(([font, count]) => {
					const percentage = (count / document.getElementsByTagName('*').length * 100).toFixed(2);
					console.log(`${font}: ${count} occurrences (${percentage}%)`);
				});
			}

			return report;
		}
	};

	return analyzer;
})();