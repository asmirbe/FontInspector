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
	isHighlighted?: boolean;
}

interface DebugConfig {
	enabled: boolean;
	logLevel: 'info' | 'debug' | 'verbose';
	showDebugPanel: boolean;
}

const EnhancedFontAnalyzer = (function () {
	'use strict';

	class DebugPanel {
		private readonly panel: HTMLDivElement;
		private readonly content: HTMLDivElement;
		private updateInterval: number | null = null;
		private readonly counter: HTMLDivElement;

		constructor() {
			this.panel = document.createElement('div');
			this.panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            padding: 10px;
            border-radius: 4px;
            z-index: 10005;
            overflow-y: auto;
            backdrop-filter: blur(16px);
        `;

			// Add header with controls
			const header = document.createElement('div');
			header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #00ff00;
            margin-bottom: 10px;
            padding-bottom: 5px;
        `;

			const title = document.createElement('div');
			title.textContent = 'Debug Panel';

			this.counter = document.createElement('div');
			this.counter.style.fontSize = '12px';

			header.appendChild(title);
			header.appendChild(this.counter);
			this.panel.appendChild(header);

			this.content = document.createElement('div');
			this.panel.appendChild(this.content);
		}

		public startAutoUpdate(callback: () => any): void {
			// Update every 100ms for real-time monitoring
			this.updateInterval = window.setInterval(() => {
				this.update(callback());
			}, 100);
		}

		public stopAutoUpdate(): void {
			if (this.updateInterval) {
				clearInterval(this.updateInterval);
				this.updateInterval = null;
			}
		}

		public show(): void {
			document.body.appendChild(this.panel);
		}

		public hide(): void {
			this.stopAutoUpdate();
			if (this.panel.parentNode) {
				this.panel.parentNode.removeChild(this.panel);
			}
		}

		public update(data: any): void {
			// Update counter
			this.counter.textContent = `Tracked: ${data.trackedElements.length}`;

			// Update content with formatted data
			this.content.innerHTML = `
            <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${this.formatDebugData(data)}</pre>
        `;
		}

		private formatDebugData(data: any): string {
			// Custom formatting for better readability
			return JSON.stringify({
				activeModals: data.activeModals.map((modal: any) => ({
					id: modal.id,
					element: `${modal.targetElement.tagName}`,
					text: modal.targetElement.text.substring(0, 20) + '...',
					highlighted: modal.isHighlighted
				})),
				trackedElements: data.trackedElements,
				timestamp: new Date().toISOString()
			}, null, 2);
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
		private debugConfig: DebugConfig = {
			enabled: false,
			logLevel: 'info',
			showDebugPanel: false
		};
		private debugPanel: DebugPanel | null = null;

		private getDebugData() {
			return {
				activeModals: Array.from(this.activeModals.entries()).map(([id, info]) => ({
					id,
					position: {
						left: info.modal.style.left,
						top: info.modal.style.top,
						zIndex: info.modal.style.zIndex
					},
					targetElement: {
						tagName: info.targetElement.tagName,
						text: info.targetElement.innerText.substring(0, 50) + '...',
						trackId: info.targetElement.getAttribute('data-font-track-id')
					},
					isHighlighted: info.isHighlighted
				})),
				trackedElements: Array.from(this.trackedElements.keys()),
				topZIndex: this.topZIndex,
				isActive: this.isActive
			};
		}

		public setDebugConfig(config: Partial<DebugConfig>): void {
			this.debugConfig = { ...this.debugConfig, ...config };

			if (this.debugConfig.showDebugPanel) {
				if (!this.debugPanel) {
					this.debugPanel = new DebugPanel();
				}
				this.debugPanel.show();
				// Use the new getDebugData method
				this.debugPanel.startAutoUpdate(() => this.getDebugData());
			} else if (this.debugPanel) {
				this.debugPanel.hide();
			}
		}

		public deactivate(): void {
			// Clean up all modals and their associated elements
			this.activeModals.forEach((_modalInfo, modalId) => {
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
            border: 0;
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

		private highlightElement(element: HTMLElement, isHighlighting: boolean): void {
			const trackId = element.getAttribute('data-font-track-id');
			if (!trackId) return;

			if (isHighlighting) {
				// Only add if not already tracked
				if (!this.trackedElements.has(trackId)) {
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

					this.trackedElements.set(trackId, trackedElement);
				}
			} else {
				// Only remove if currently tracked
				const tracked = this.trackedElements.get(trackId);
				if (tracked) {
					element.style.outline = tracked.originalStyles.outline;
					element.style.backgroundColor = tracked.originalStyles.backgroundColor;
					this.trackedElements.delete(trackId);
				}
			}
		}

		private log(message: string, data?: any): void {
			if (!this.debugConfig.enabled) return;

			const timestamp = new Date().toISOString();
			console.log(`[${timestamp}] ${message}`, data || '');
		}

		private updateDebugPanel(): void {
			if (!this.debugPanel || !this.debugConfig.showDebugPanel) return;
			// Use the new getDebugData method
			this.debugPanel.update(this.getDebugData());
		}

		private cleanupTrackedElement(trackId: string): void {
			const tracked = this.trackedElements.get(trackId);
			if (tracked) {
				const element = tracked.element;

				// Only restore styles if the element still exists in the DOM
				if (element && element.isConnected) {
					element.style.outline = tracked.originalStyles.outline;
					element.style.backgroundColor = tracked.originalStyles.backgroundColor;
					element.removeAttribute('data-font-track-id');
					element.removeAttribute('data-modal-id');
				}

				this.trackedElements.delete(trackId);

				if (this.debugConfig.enabled) {
					this.updateDebugPanel();
				}
			}
		}

		constructor() {
			this.createTooltip();
			this.createExitButton();
		}

		private createHighlightButton(element: HTMLElement, modalId: string): HTMLButtonElement {
			const button = document.createElement('button');
			const trackId = `font-track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
			element.setAttribute('data-font-track-id', trackId);
			element.setAttribute('data-modal-id', modalId);

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

			let isProcessing = false; // Add debounce flag
			let isHighlighted = false;

			button.addEventListener('click', async (e) => {
				e.stopPropagation();

				// Prevent rapid clicking
				if (isProcessing) return;
				isProcessing = true;

				try {
					isHighlighted = !isHighlighted;

					// Update button state
					button.textContent = isHighlighted ? 'Remove Highlight' : 'Highlight Element';
					button.style.background = isHighlighted ? '#2196F3' : '#f0f0f0';
					button.style.color = isHighlighted ? 'white' : 'black';

					// Update element highlight
					this.highlightElement(element, isHighlighted);

					// Update modal state
					const modalInfo = this.activeModals.get(modalId);
					if (modalInfo) {
						modalInfo.isHighlighted = isHighlighted;
					}

					// Force debug panel update
					if (this.debugConfig.enabled) {
						this.updateDebugPanel();
					}
				} finally {
					// Small delay to prevent rapid clicking
					await new Promise(resolve => setTimeout(resolve, 100));
					isProcessing = false;
				}
			});

			return button;
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

		private createTooltip(): void {
			this.tooltip = document.createElement('div');
			this.tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
			backdrop-filter: blur(16px);
            padding: 8px;
            border: 0;
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

		private cleanupModal = (modalId: string): void => {
			const modalInfo = this.activeModals.get(modalId);
			if (modalInfo) {
				const {modal, targetElement, isHighlighted} = modalInfo;

				// Check if element is highlighted
				if (isHighlighted) {
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
		};

		private createExitButton(): void {
			this.exitButton = document.createElement('button');
			this.exitButton.textContent = 'Cancel';
			this.exitButton.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 8px;
            border: none;
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

			if (this.debugConfig.logLevel === 'verbose') {
				this.log('Mouse move event', {
					target: (e.target as HTMLElement).tagName,
					position: {x: e.pageX, y: e.pageY}
				});
			}

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

				const scrollLeft = window.scrollX || document.documentElement.scrollLeft;
				const scrollTop = window.scrollY || document.documentElement.scrollTop;

				// Position tooltip with consistent offset
				this.tooltip.style.left = `${e.pageX - scrollLeft + this.tooltipOffset.x}px`;
				this.tooltip.style.top = `${e.pageY - scrollTop + this.tooltipOffset.y}px`;
			} else {
				this.tooltip.style.display = 'none';
			}

			this.updateDebugPanel();
		};

		private handleClick = (e: MouseEvent): void => {
			if (!this.isActive) return;

			const target = e.target as HTMLElement;

			this.log('Click event detected', {
				target: (e.target as HTMLElement).tagName,
				position: {x: e.pageX, y: e.pageY}
			});

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
					highlightButton,
					isHighlighted: false
				});

				// Rest of modal creation code remains the same...
				modal.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <div style="display: flex; align-items: center;">
                        <p style="margin: 0; font-weight: bold;">Font Details</p>
                    </div>
                    <div style="display:flex; gap: 4px; align-items: center">
                    <div id="highlight-btn" style="background: none; border: none; cursor: pointer; font-size: 18px;"></div>
                    <button class="modal-close-btn" style="background: none; border: none; cursor: pointer; font-size: 18px;">×</button>
					</div>
				</div>
                <div>
                    <div style="font-weight: 600; margin-top: 8px;">Font Family:</div>
                    <div style="margin-left: 0; margin-bottom: 8px; display: flex; align-items: center;">
                        ${metrics.name}
                    </div>
                    <div style="font-weight: 600; margin-top: 8px;">Weight:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">${metrics.weight}</div>
                    <div style="font-weight: 600; margin-top: 8px;">Color:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">
						 <span style="background-color: ${metrics.color}; width: 10px; height:10px; display: block;"></span>${metrics.color}</div>
                    <div style="font-weight: 600; margin-top: 8px;">Style:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">${metrics.style}</div>
                    <div style="font-weight: 600; margin-top: 8px;">Size:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">${metrics.size}</div>
                    <div style="font-weight: 600; margin-top: 8px;">Line Height:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">${metrics.lineHeight}</div>
                    <div style="font-weight: 600; margin-top: 8px;">Letter Spacing:</div>
                    <div style="margin-left: 0; margin-bottom: 8px;">${metrics.letterSpacing}</div>
                </div>
            `;

				// Add highlight button after font family
				const fontFamilyDd = document.getElementById('highlight-btn');
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
					highlightButton,
					isHighlighted: false
				});
			}

			this.updateDebugPanel();
		};
	}

	const analyzer = {
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