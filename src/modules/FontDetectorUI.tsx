import type { UIState, UIHandlers, DebugConfig, TrackedElement, ModalInfo, FontMetrics } from "../types";
import { ShadowContainer } from "../components";
import { FontHierarchyAnalyzer } from "./FontHierarchyAnalyzer";
import { DebugPanel } from "./DebugPanel";

export class FontDetectorUI {
	private state: UIState;
	private shadowContainer: ShadowContainer;
	private baseZIndex: number = 10001;
	private tooltipOffset = { x: 10, y: 10 };
	private observer: MutationObserver;
	private debugConfig: DebugConfig = {
		enabled: false,
		logLevel: "info",
		showDebugPanel: false,
	};
	private debugPanel: DebugPanel | null = null;
	private hierarchyAnalyzer: FontHierarchyAnalyzer;

	constructor(analyzer: FontHierarchyAnalyzer) {
		this.hierarchyAnalyzer = analyzer;

		// Initialize state
		this.state = {
			isActive: false,
			tooltip: {
				visible: false,
				content: "",
				position: { x: 0, y: 0 },
			},
			modals: new Map(),
			trackedElements: new Map(),
			topZIndex: this.baseZIndex,
		};

		// Initialize shadow container
		this.shadowContainer = new ShadowContainer();

		// Setup observer
		this.observer = new MutationObserver(this.handleMutations.bind(this));

		// Bind methods
		this.handleMouseMove = this.handleMouseMove.bind(this);
		this.handleClick = this.handleClick.bind(this);
		this.handleHighlightElement = this.handleHighlightElement.bind(this);
		this.handleCloseModal = this.handleCloseModal.bind(this);
		this.handleBringModalToFront = this.handleBringModalToFront.bind(this);
		this.cleanup = this.cleanup.bind(this);
	}

	public activate(): void {
		this.setState({ isActive: true });
		this.shadowContainer.mount();
		this.setupEventListeners();
		this.setupMutationObserver();
		this.renderUI();
	}

	public deactivate(): void {
		this.cleanup();
		this.setState({ isActive: false });
		this.shadowContainer.unmount();
	}

	private getDebugData() {
		return {
			activeModals: Array.from(this.state.modals.entries()).map(([id, info]) => ({
				id,
				position: info.position,
				targetElement: {
					tagName: info.targetElement.tagName,
					text: info.targetElement.innerText.substring(0, 50) + "...",
					trackId: info.targetElement.getAttribute("data-font-track-id"),
				},
				isHighlighted: info.isHighlighted,
			})),
			trackedElements: Array.from(this.state.trackedElements.keys()),
			topZIndex: this.state.topZIndex,
			isActive: this.state.isActive,
		};
	}

	public setDebugConfig(config: Partial<DebugConfig>): void {
		this.debugConfig = { ...this.debugConfig, ...config };

		if (this.debugConfig.showDebugPanel) {
			if (!this.debugPanel) {
				this.debugPanel = new DebugPanel();
			}
			this.debugPanel.show();
			this.debugPanel.startAutoUpdate(() => this.getDebugData());
		} else if (this.debugPanel) {
			this.debugPanel.hide();
		}
	}

	private setupEventListeners(): void {
		document.addEventListener("mousemove", this.handleMouseMove);
		document.addEventListener("click", this.handleClick);
	}

	private removeEventListeners(): void {
		document.removeEventListener("mousemove", this.handleMouseMove);
		document.removeEventListener("click", this.handleClick);
	}

	private standardizeFontName(fontName: string): string {
		// Remove quotes and extra spaces
		let cleanName = fontName
			.replace(/['"]/g, "") // Remove single and double quotes
			.trim() // Remove leading/trailing spaces
			.replace(/\s+/g, " "); // Replace multiple spaces with single space

		// Return mapped name if it exists, otherwise capitalize first letter of each word
		return cleanName
			.split(" ")
			.map((word) => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ");
	}

	public getElementFontMetrics(element: HTMLElement, pseudoElement?: string): FontMetrics {
		// Get computed style for either the main element or its pseudo-element
		const style = window.getComputedStyle(element, pseudoElement);
		const rawFontFamily = style.fontFamily.split(",")[0].trim();

		return {
			name: this.standardizeFontName(rawFontFamily),
			weight: parseInt(style.fontWeight),
			style: style.fontStyle,
			size: style.fontSize,
			color: style.color,
			lineHeight: style.lineHeight,
			letterSpacing: style.letterSpacing,
			isPseudoElement: !!pseudoElement,
			pseudoType: pseudoElement === "::before" || pseudoElement === "::after" ? pseudoElement : undefined,
		};
	}

	private handleMouseMove(e: MouseEvent): void {
		if (!this.state.isActive) return;

		const target = e.target as HTMLElement;

		// Ignore if over UI elements
		if (this.isInsideShadowDOM(target)) {
			this.setState({
				tooltip: { ...this.state.tooltip, visible: false },
			});
			return;
		}

		// Check for pseudo-elements
		const beforeStyle = window.getComputedStyle(target, "::before");
		const afterStyle = window.getComputedStyle(target, "::after");
		const hasPseudoContent = beforeStyle.content !== "none" || afterStyle.content !== "none";

		if (target && (target.innerText || hasPseudoContent)) {
			let metrics;
			let content;

			// Check if cursor is over a pseudo-element
			const rect = target.getBoundingClientRect();
			const x = e.clientX - rect.left;
			const y = e.clientY - rect.top;

			if (beforeStyle.content !== "none" && this.isOverPseudoElement(target, "::before", x, y)) {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target, "::before");
				content = `${metrics.name} (::before)`;
			} else if (afterStyle.content !== "none" && this.isOverPseudoElement(target, "::after", x, y)) {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target, "::after");
				content = `${metrics.name} (::after)`;
			} else {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target);
				content = metrics.name;
			}

			const position = this.calculateTooltipPosition(e, content);

			this.setState({
				tooltip: {
					visible: true,
					content,
					position,
				},
			});
		} else {
			this.setState({
				tooltip: { ...this.state.tooltip, visible: false },
			});
		}
	}

	private isOverPseudoElement(element: HTMLElement, pseudo: "::before" | "::after", x: number, y: number): boolean {
		const style = window.getComputedStyle(element, pseudo);

		// Only check if the pseudo-element has content
		if (style.content === "none") return false;

		// Get position and size of the pseudo-element
		const position = style.position;
		const display = style.display;

		// For absolutely positioned pseudo-elements
		if (position === "absolute" || position === "fixed") {
			const left = parseFloat(style.left) || 0;
			const top = parseFloat(style.top) || 0;
			const width = parseFloat(style.width) || 0;
			const height = parseFloat(style.height) || 0;

			return x >= left && x <= left + width && y >= top && y <= top + height;
		}

		// For block-level pseudo-elements
		if (display === "block") {
			const width = parseFloat(style.width) || element.offsetWidth;
			const height = parseFloat(style.height) || parseFloat(style.lineHeight) || 20;

			// Assuming block elements start at the top for ::before and bottom for ::after
			if (pseudo === "::before") {
				return y <= height;
			} else {
				const elementHeight = element.getBoundingClientRect().height;
				return y >= elementHeight - height;
			}
		}

		// For inline pseudo-elements
		return true;
	}

	private isInsideShadowDOM(element: HTMLElement): boolean {
		return element.closest("#font-detector-container") !== null || element.getRootNode() === this.shadowContainer.getShadowRoot();
	}

	private setupMutationObserver(): void {
		this.observer.disconnect();
		const config = {
			childList: true,
			subtree: true,
			characterData: true,
			attributes: true,
			attributeFilter: ["style", "class"],
		};
		this.observer.observe(document.body, config);
	}

	private handleMutations(mutations: MutationRecord[]): void {
		mutations.forEach((mutation) => {
			if (mutation.type === "childList") {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE && node instanceof HTMLElement && node.innerText) {
						this.hierarchyAnalyzer.analyzeHierarchy(node);
					}
				});
			}
		});
	}

	// Replace the existing calculateTooltipPosition method with this one
	private calculateTooltipPosition(e: MouseEvent, content: string): { x: number; y: number } {
		const viewportWidth = document.documentElement.clientWidth;
		const viewportHeight = document.documentElement.clientHeight;

		// Create temporary element to measure content width
		const temp = document.createElement("div");
		temp.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;";
		temp.textContent = content;
		document.body.appendChild(temp);
		const contentWidth = temp.offsetWidth + 16; // Add padding
		const contentHeight = temp.offsetHeight + 16;
		document.body.removeChild(temp);

		let x = e.clientX + this.tooltipOffset.x;
		let y = e.clientY + this.tooltipOffset.y;

		// Adjust for viewport boundaries
		if (x + contentWidth > viewportWidth) {
			x = e.clientX - contentWidth - this.tooltipOffset.x;
		}
		if (y + contentHeight > viewportHeight) {
			y = e.clientY - contentHeight - this.tooltipOffset.y;
		}

		return { x, y };
	}

	private handleHighlightElement(element: HTMLElement, modalId: string, isHighlighting: boolean): void {
		const trackId = element.getAttribute("data-font-track-id") || this.generateTrackId();

		if (isHighlighting) {
			if (!this.state.trackedElements.has(trackId)) {
				const computedStyle = window.getComputedStyle(element);
				const trackedElement: TrackedElement = {
					element,
					originalStyles: {
						outline: computedStyle.outline,
						backgroundColor: computedStyle.backgroundColor,
					},
				};

				element.setAttribute("data-font-track-id", trackId);
				element.style.outline = "2px solid #2196F3";
				element.style.backgroundColor = "rgba(33, 150, 243, 0.1)";

				const updatedTrackedElements = new Map(this.state.trackedElements);
				updatedTrackedElements.set(trackId, trackedElement);

				// Update modal highlighted state
				const updatedModals = new Map(this.state.modals);
				const modalInfo = updatedModals.get(modalId);
				if (modalInfo) {
					modalInfo.isHighlighted = true;
					updatedModals.set(modalId, modalInfo);
				}

				this.setState({
					trackedElements: updatedTrackedElements,
					modals: updatedModals,
				});
			}
		} else {
			const tracked = this.state.trackedElements.get(trackId);
			if (tracked) {
				element.style.outline = tracked.originalStyles.outline;
				element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				element.removeAttribute("data-font-track-id");

				const updatedTrackedElements = new Map(this.state.trackedElements);
				updatedTrackedElements.delete(trackId);

				// Update modal highlighted state
				const updatedModals = new Map(this.state.modals);
				const modalInfo = updatedModals.get(modalId);
				if (modalInfo) {
					modalInfo.isHighlighted = false;
					updatedModals.set(modalId, modalInfo);
				}

				this.setState({
					trackedElements: updatedTrackedElements,
					modals: updatedModals,
				});
			}
		}
	}

	private calculateInitialModalPosition(e: MouseEvent): { x: number; y: number; clickPosition: { x: number; y: number; } } {
		const viewportWidth = document.documentElement.clientWidth;
		const viewportHeight = document.documentElement.clientHeight;
		const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
		const scrollY = window.pageYOffset || document.documentElement.scrollTop;
		const modalWidth = 300; // Default modal width
		const modalHeight = 400; // Approximate modal height
		const padding = 20;

		// Store original click position
		const clickPosition = {
			x: e.pageX,
			y: e.pageY
		};

		// Initial position with offset
		let x = e.pageX + this.tooltipOffset.x;
		let y = e.pageY + this.tooltipOffset.y;

		// Convert to viewport coordinates
		const viewportX = x - scrollX;
		const viewportY = y - scrollY;

		// Check available space on each side of the click
		const spaceRight = viewportWidth - (e.pageX - scrollX);
		const spaceLeft = e.pageX - scrollX;
		const spaceBottom = viewportHeight - (e.pageY - scrollY);
		const spaceTop = e.pageY - scrollY;

		// Determine best position based on available space
		if (viewportX + modalWidth > viewportWidth - padding && spaceLeft > spaceRight) {
			// Flip to left if more space available
			x = e.pageX - modalWidth - this.tooltipOffset.x;
		}

		if (viewportY + modalHeight > viewportHeight - padding && spaceTop > spaceBottom) {
			// Flip to top if more space available
			y = e.pageY - modalHeight - this.tooltipOffset.y;
		}

		// Final boundary checks
		const finalViewportX = x - scrollX;
		const finalViewportY = y - scrollY;

		if (finalViewportX + modalWidth > viewportWidth - padding) {
			x = scrollX + viewportWidth - modalWidth - padding;
		}
		if (finalViewportX < padding) {
			x = scrollX + padding;
		}
		if (finalViewportY + modalHeight > viewportHeight - padding) {
			y = scrollY + viewportHeight - modalHeight - padding;
		}
		if (finalViewportY < padding) {
			y = scrollY + padding;
		}

		return { x, y, clickPosition };
	}

	private handleClick(e: MouseEvent): void {
		if (!this.state.isActive) return;

		const target = e.target as HTMLElement;

		if (target && target.innerText) {
			e.preventDefault();
			e.stopPropagation();
		}

		// Check if clicking UI elements
		if (target.closest('#font-detector-root')) {
			if (target.closest('.font-detector-modal')) {
				e.stopPropagation();
				return;
			}
			return;
		}

		const beforeStyle = window.getComputedStyle(target, '::before');
		const afterStyle = window.getComputedStyle(target, '::after');
		const hasPseudoContent = beforeStyle.content !== 'none' || afterStyle.content !== 'none';

		if (target && (target.innerText || hasPseudoContent) && !target.closest('.modal-close-btn')) {
			const rect = target.getBoundingClientRect();
			const x = e.pageX - (rect.left + window.pageXOffset);
			const y = e.pageY - (rect.top + window.pageYOffset);

			let metrics;

			if (beforeStyle.content !== 'none' && this.isOverPseudoElement(target, '::before', x, y)) {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target, '::before');
			} else if (afterStyle.content !== 'none' && this.isOverPseudoElement(target, '::after', x, y)) {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target, '::after');
			} else {
				metrics = this.hierarchyAnalyzer.getElementFontMetrics(target);
			}

			const modalId = this.generateModalId(target);
			const { x: posX, y: posY, clickPosition } = this.calculateInitialModalPosition(e);

			const newModal: ModalInfo = {
				targetElement: target,
				isHighlighted: false,
				metrics,
				position: { x: posX, y: posY },
				clickPosition,
				zIndex: this.state.topZIndex + 1
			};

			const updatedModals = new Map(this.state.modals);
			updatedModals.set(modalId, newModal);

			this.setState({
				modals: updatedModals,
				topZIndex: this.state.topZIndex + 1
			});
		}
	}

	private handleCloseModal(modalId: string): void {
		// e.stopPropagation(); // Stop event propagation
		const modalInfo = this.state.modals.get(modalId);
		if (modalInfo && modalInfo.isHighlighted) {
			const trackId = modalInfo.targetElement.getAttribute("data-font-track-id");
			if (trackId) {
				this.handleHighlightElement(modalInfo.targetElement, modalId, false);
			}
		}

		const updatedModals = new Map(this.state.modals);
		updatedModals.delete(modalId);
		this.setState({ modals: updatedModals });
	}

	private handleBringModalToFront(modalId: string): void {
		const updatedModals = new Map(this.state.modals);
		const modalInfo = updatedModals.get(modalId);
		if (modalInfo) {
			modalInfo.zIndex = this.state.topZIndex + 1;
			updatedModals.set(modalId, modalInfo);
			this.setState({
				modals: updatedModals,
				topZIndex: this.state.topZIndex + 1,
			});
		}
	}

	private cleanup(): void {
		// Clean up tracking and modals
		this.state.trackedElements.forEach((tracked) => {
			if (tracked.element.isConnected) {
				tracked.element.style.outline = tracked.originalStyles.outline;
				tracked.element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				tracked.element.removeAttribute("data-font-track-id");
			}
		});

		this.removeEventListeners();
		this.observer.disconnect();

		this.setState({
			trackedElements: new Map(),
			modals: new Map(),
			topZIndex: this.baseZIndex,
			tooltip: {
				visible: false,
				content: "",
				position: { x: 0, y: 0 },
			},
		});
	}

	private generateModalId(element: HTMLElement): string {
		const rect = element.getBoundingClientRect();
		return `modal-${element.tagName}-${rect.left}-${rect.top}-${Date.now()}`;
	}

	private generateTrackId(): string {
		return `font-track-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
	}

	private setState(newState: Partial<UIState>): void {
		this.state = {
			...this.state,
			...newState,
		};
		this.renderUI();

		if (this.debugConfig.enabled && this.debugPanel) {
			this.debugPanel.update(this.getDebugData());
		}
	}

	private renderUI(): void {
		const handlers: UIHandlers = {
			onExit: () => this.deactivate(),
			onCloseModal: this.handleCloseModal,
			onBringModalToFront: this.handleBringModalToFront,
			onHighlightElement: this.handleHighlightElement,
		};

		this.shadowContainer.render(this.state, handlers);
	}
}
