import type { TrackedElement, ModalInfo, FontMetrics } from '../types';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

import { FontHierarchyAnalyzer } from './FontHierarchyAnalyzer';
import { Tooltip } from '../components/Tooltips';
import { Modal } from '../components/Modal';

const FontDetectorUI: React.FC = () => {
	// Start with isActive true since we want it to activate immediately when mounted
	const [isActive, setIsActive] = useState(true);
	const [tooltipData, setTooltipData] = useState<{ metrics: FontMetrics | null, position: { x: number, y: number } }>({ metrics: null, position: { x: 0, y: 0 } });
	const [modals, setModals] = useState<Map<string, ModalInfo>>(new Map());
	const [trackedElements, setTrackedElements] = useState<Map<string, TrackedElement>>(new Map());
	const hierarchyAnalyzer = useRef(new FontHierarchyAnalyzer());

	const handleMouseMove = useCallback((e: MouseEvent) => {
		if (!isActive) return;

		const target = e.target as HTMLElement;

		// Check if mouse is over the Cancel button
		const isOverCancelButton = target.tagName === 'BUTTON' && target.innerText === 'Cancel';

		// Check if mouse is over any part of a modal using class name
		const isOverModal = target.closest('.modal-container') !== null;

		// Hide tooltip if over Cancel button or Modal
		if (isOverCancelButton || isOverModal) {
			setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
			return;
		}

		// Hide tooltip if cursor leaves the page
		if (e.clientX <= 0 || e.clientX >= window.innerWidth ||
			e.clientY <= 0 || e.clientY >= window.innerHeight) {
			setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
			return;
		}

		if (target && target.innerText) {
			const metrics = hierarchyAnalyzer.current.getElementFontMetrics(target);
			if (metrics) {
				setTooltipData({
					metrics,
					position: { x: e.clientX + 10, y: e.clientY + 10 }
				});
			} else {
				setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
			}
		} else {
			setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
		}
	}, [isActive]);

	const handleClick = useCallback((e: MouseEvent) => {
		if (!isActive) return;

		const target = e.target as HTMLElement;
		if (target && target.innerText) {
			const metrics = hierarchyAnalyzer.current.getElementFontMetrics(target);
			if (metrics) {
				const modalId = `modal-${Date.now()}`;
				setModals(prevModals => {
					const newModals = new Map(prevModals);
					newModals.set(modalId, {
						metrics,
						position: { x: e.clientX + 10, y: e.clientY + 10 },
						targetElement: target,
						isHighlighted: false
					});
					return newModals;
				});
			}
		}
	}, [isActive]);

	const handleMouseLeave = useCallback(() => {
		setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
	}, []);

	useEffect(() => {
		if (isActive) {
			document.addEventListener('mousemove', handleMouseMove);
			document.addEventListener('mouseleave', handleMouseLeave);
			document.addEventListener('click', handleClick);
		} else {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
			document.removeEventListener('click', handleClick);
		}

		hierarchyAnalyzer.current.reset();
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
			document.removeEventListener('click', handleClick);
		};
	}, [isActive, handleMouseMove, handleMouseLeave, handleClick]);

	const deactivate = () => {
		setIsActive(false);
		setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
		setModals(new Map());
		setTrackedElements(new Map());
	};

	const highlightElement = (element: HTMLElement, isHighlighted: boolean) => {
		const trackId = element.getAttribute('data-font-track-id');
		if (!trackId) return;

		if (isHighlighted) {
			if(!trackedElements.has(trackId)) {
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

				trackedElements.set(trackId, trackedElement);
			}
		} else {
			const tracked = trackedElements.get(trackId);
			if (tracked) {
				element.style.outline = tracked.originalStyles.outline;
				element.style.backgroundColor = tracked.originalStyles.backgroundColor;
				trackedElements.delete(trackId);
			}
		}
	};

	return (
		<>
			{isActive && (
				<>
					<pre>{JSON.stringify(trackedElements)}</pre>
					<Tooltip metrics={tooltipData.metrics} position={tooltipData.position} />
					{Array.from(modals.entries()).map(([id, modalInfo]) => (
						<Modal
							key={id}
							metrics={modalInfo.metrics}
							position={modalInfo.position}
							targetElement={modalInfo.targetElement}
							onClose={() => {
								setModals(prev => {
									const newModals = new Map(prev);
									newModals.delete(id);
									return newModals;
								});
							}}
							onHighlight={() => {
								setModals(prev => {
									const newModals = new Map(prev);
									const modal = newModals.get(id);
									if (modal) {
										modal.isHighlighted = !modal.isHighlighted;
										highlightElement(modal.targetElement, modal.isHighlighted);
									}
									return newModals;
								});
							}}
							isHighlighted={modalInfo.isHighlighted ?? false}
						/>
					))}
					<button
						onClick={deactivate}
						style={{
							position: 'fixed',
							top: '20px',
							right: '20px',
							padding: '8px',
							border: 'none',
							background: 'rgba(0, 0, 0, 0.8)',
							backdropFilter: 'blur(16px)',
							borderRadius: '4px',
							fontSize: '14px',
							lineHeight: '1',
							color: 'white',
							cursor: 'pointer',
							zIndex: 10002,
						}}
					>
						Cancel
					</button>
				</>
			)}
		</>
	);
};

// Create a class to manage the font detector instance
class FontDetectorManager {
	private static instance: any = null;
	private static container: HTMLElement | null = null;

	static activate(): void {
		// Clean up any existing instance
		if (this.container) {
			document.body.removeChild(this.container);
		}

		// Create new container and instance
		this.container = document.createElement('div');
		this.container.id = 'font-detector-root';
		document.body.appendChild(this.container);

		// Create new React root and render
		this.instance = createRoot(this.container);
		this.instance.render(<FontDetectorUI />);
	}

	static deactivate(): void {
		if (this.instance) {
			this.instance.unmount();
		}
		if (this.container && document.body.contains(this.container)) {
			document.body.removeChild(this.container);
		}
		this.instance = null;
		this.container = null;
	}
}

// Export the activate function that will be used by EnhancedFontAnalyzer
export const activate = (): void => {
	FontDetectorManager.activate();
};

export { FontDetectorUI };
