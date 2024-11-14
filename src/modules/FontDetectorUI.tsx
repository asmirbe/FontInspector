import React from 'react';
import { createRoot } from 'react-dom/client';
import type { UIState, UIHandlers, DebugConfig, TrackedElement, ModalInfo } from '../types';
import { ShadowContainer, FontDetectorApp } from '../components';
import { FontHierarchyAnalyzer } from './FontHierarchyAnalyzer';
import { DebugPanel } from './DebugPanel';

export class FontDetectorUI {
	private state: UIState;
	private shadowContainer: ShadowContainer;
	private baseZIndex: number = 10001;
	private tooltipOffset = { x: 10, y: 10 };
	private observer: MutationObserver;
	private debugConfig: DebugConfig = {
		enabled: false,
		logLevel: 'info',
		showDebugPanel: false
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
				content: '',
				position: { x: 0, y: 0 }
			},
			modals: new Map(),
			trackedElements: new Map(),
			topZIndex: this.baseZIndex
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
					text: info.targetElement.innerText.substring(0, 50) + '...',
					trackId: info.targetElement.getAttribute('data-font-track-id')
				},
				isHighlighted: info.isHighlighted
			})),
			trackedElements: Array.from(this.state.trackedElements.keys()),
			topZIndex: this.state.topZIndex,
			isActive: this.state.isActive
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
		document.addEventListener('mousemove', this.handleMouseMove);
		document.addEventListener('click', this.handleClick);
	}

	private removeEventListeners(): void {
		document.removeEventListener('mousemove', this.handleMouseMove);
		document.removeEventListener('click', this.handleClick);
	}

	private handleMouseMove(e: MouseEvent): void {
		if (!this.state.isActive) return;

		const target = e.target as HTMLElement;

		// Ignore if over UI elements
		if (this.isInsideShadowDOM(target)) {
			this.setState({
				tooltip: { ...this.state.tooltip, visible: false }
			});
			return;
		}

		if (target && target.innerText) {
			const metrics = this.hierarchyAnalyzer.getElementFontMetrics(target);
			const position = this.calculateTooltipPosition(e, metrics.name);

			this.setState({
				tooltip: {
					visible: true,
					content: metrics.name,
					position
				}
			});
		} else {
			this.setState({
				tooltip: { ...this.state.tooltip, visible: false }
			});
		}
	}

	private isInsideShadowDOM(element: HTMLElement): boolean {
		return element.closest('#font-detector-container') !== null ||
			element.getRootNode() === this.shadowContainer.getShadowRoot();
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

	private handleMutations(mutations: MutationRecord[]): void {
		mutations.forEach((mutation) => {
			if (mutation.type === 'childList') {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE &&
						node instanceof HTMLElement &&
						node.innerText) {
						this.hierarchyAnalyzer.analyzeHierarchy(node);
					}
				});
			}
		});
	}

	private calculateTooltipPosition(e: MouseEvent, content: string): { x: number; y: number } {
		const viewportWidth = document.documentElement.clientWidth;
		const viewportHeight = document.documentElement.clientHeight;

		// Create temporary element to measure content width
		const temp = document.createElement('div');
		temp.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;';
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
		const trackId = element.getAttribute('data-font-track-id') || this.generateTrackId();

		if (isHighlighting) {
			if (!this.state.trackedElements.has(trackId)) {
				const computedStyle = window.getComputedStyle(element);
				const trackedElement: TrackedElement = {
					element,
					originalStyles: {
						outline: computedStyle.outline,
						backgroundColor: computedStyle.backgroundColor,
					}
				};

				element.setAttribute('data-font-track-id', trackId);
				element.style.outline = '2px solid #2196F3';
				element.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';

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
					modals: updatedModals
				});
			}
		} else {
			const tracked = this.state.trackedElements.get(trackId);
			if (tracked) {
				element.style.outline = tracked.originalStyles.outline;
				element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				element.removeAttribute('data-font-track-id');

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
					modals: updatedModals
				});
			}
		}
	}

	private handleClick(e: MouseEvent): void {
		if (!this.state.isActive) return;

		const target = e.target as HTMLElement;

		// Check if clicking UI elements
		if (target.closest('#font-detector-root')) {
			// If clicking inside any existing modal, prevent creating a new one
			if (target.closest('.font-detector-modal')) {
				e.stopPropagation();
				return;
			}
			return;
		}

		// Check if the target is valid for creating a modal
		if (target && target.innerText && !target.closest('.modal-close-btn')) {
			const metrics = this.hierarchyAnalyzer.getElementFontMetrics(target);
			const modalId = this.generateModalId(target);

			// Create new modal info
			const newModal: ModalInfo = {
				targetElement: target,
				isHighlighted: false,
				metrics,
				position: {
					x: e.clientX + this.tooltipOffset.x,
					y: e.clientY + this.tooltipOffset.y
				},
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
			const trackId = modalInfo.targetElement.getAttribute('data-font-track-id');
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
				topZIndex: this.state.topZIndex + 1
			});
		}
	}

	private cleanup(): void {
		// Clean up tracking and modals
		this.state.trackedElements.forEach((tracked) => {
			if (tracked.element.isConnected) {
				tracked.element.style.outline = tracked.originalStyles.outline;
				tracked.element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				tracked.element.removeAttribute('data-font-track-id');
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
				content: '',
				position: { x: 0, y: 0 }
			}
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
			...newState
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
			onHighlightElement: this.handleHighlightElement
		};

		this.shadowContainer.render(this.state, handlers);
	}
}