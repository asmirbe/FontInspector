import type { TrackedElement, ModalInfo, FontMetrics } from '../types';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

import FontInspector from './CoreForeInspector';
import { Tooltip } from '../components/Tooltip';
import { Modal } from '../components/Modal';

const FontDetectorUI: React.FC = () => {
	const [isActive, setIsActive] = useState(true);
	const [tooltipData, setTooltipData] = useState<{ metrics: FontMetrics | null, position: { x: number, y: number } }>({ metrics: null, position: { x: 0, y: 0 } });
	const [modals, setModals] = useState<Map<string, ModalInfo & { zIndex: number }>>(new Map());
	const [trackedElements, setTrackedElements] = useState<Map<string, TrackedElement>>(new Map());
	const fontInspector = useRef(new FontInspector());
	const baseZIndex = 10001;
	const [topZIndex, setTopZIndex] = useState(baseZIndex);

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
			const metrics = fontInspector.current.getElementFontMetrics(target);
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
			const metrics = fontInspector.current.getElementFontMetrics(target);
			if (metrics) {
				const modalId = `modal-${Date.now()}`;
				setModals(prevModals => {
					const newModals = new Map(prevModals);
					setTopZIndex(prev => prev + 1);
					newModals.set(modalId, {
						metrics,
						position: { x: e.clientX + 10, y: e.clientY + 10 },
						targetElement: target,
						isHighlighted: false,
						zIndex: topZIndex + 1
					});
					return newModals;
				});
			}
		}
	}, [isActive, topZIndex]);

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

		fontInspector.current.reset();
		return () => {
			document.removeEventListener('mousemove', handleMouseMove);
			document.removeEventListener('mouseleave', handleMouseLeave);
			document.removeEventListener('click', handleClick);
		};
	}, [isActive, handleMouseMove, handleMouseLeave, handleClick]);

	const deactivate = () => {
		cleanupHighlights();
		setIsActive(false);
		setTooltipData({ metrics: null, position: { x: 0, y: 0 } });
		setModals(new Map());
		setTrackedElements(new Map());
	};

	const generateTrackId = useCallback((element: HTMLElement): string => {
		// Generate a unique ID if one doesn't exist
		let trackId = element.getAttribute('data-font-track-id');
		if (!trackId) {
			trackId = `font-track-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
			element.setAttribute('data-font-track-id', trackId);
		}
		return trackId;
	}, []);

	const highlightElement = useCallback(
		(element: HTMLElement, isHighlighting: boolean) => {
			const trackId = generateTrackId(element);

			setTrackedElements((prev) => {
				const newTrackedElements = new Map(prev);

				if (isHighlighting) {
					// Add only if not already tracked
					if (!newTrackedElements.has(trackId)) {
						const computedStyle = window.getComputedStyle(element);
						const trackedElement: TrackedElement = {
							element,
							originalStyles: {
								outline: computedStyle.outline,
								backgroundColor: computedStyle.backgroundColor,
							},
						};

						// Apply highlight effect
						element.style.outline = '2px solid #2196F3';
						element.style.backgroundColor = 'rgba(33, 150, 243, 0.1)';

						newTrackedElements.set(trackId, trackedElement);
						console.log(`Added element with trackId: ${trackId}`);
					}
				} else {
					// Remove if currently tracked
					if (newTrackedElements.has(trackId)) {
						const tracked = newTrackedElements.get(trackId);
						if (tracked) {
							element.style.outline = tracked.originalStyles.outline;
							element.style.backgroundColor = tracked.originalStyles.backgroundColor;
						}
						newTrackedElements.delete(trackId);
						console.log(`Removed element with trackId: ${trackId}`);
					}
				}

				return newTrackedElements;
			});
		},
		[generateTrackId]
	);

	const toggleHighlight = useCallback(
		(modalId: string) => {
			setModals((prev) => {
				const newModals = new Map(prev);
				const modalInfo = newModals.get(modalId);

				if (modalInfo) {
					const newIsHighlighted = !modalInfo.isHighlighted;
					highlightElement(modalInfo.targetElement, newIsHighlighted);

					newModals.set(modalId, {
						...modalInfo,
						isHighlighted: newIsHighlighted,
					});
					console.log(`Toggled highlight for modalId: ${modalId}, isHighlighted: ${newIsHighlighted}`);
				}

				return newModals;
			});
		},
		[highlightElement]
	);

	const cleanupHighlights = useCallback(() => {
		console.log('Cleaning up highlights');
		trackedElements.forEach((tracked) => {
			tracked.element.style.outline = tracked.originalStyles.outline;
			tracked.element.style.backgroundColor = tracked.originalStyles.backgroundColor;
			tracked.element.removeAttribute('data-font-track-id');
		});
		setTrackedElements(new Map());
	}, [trackedElements]);

	const bringToFront = useCallback((modalId: string) => {
		setModals(prevModals => {
			const newModals = new Map(prevModals);
			const modal = newModals.get(modalId);
			if (modal) {
				const highestZIndex = Math.max(...Array.from(prevModals.values()).map(m => m.zIndex));
				if (modal.zIndex < highestZIndex) {
					setTopZIndex(highestZIndex + 1);
					modal.zIndex = highestZIndex + 1;
				}
			}
			return newModals;
		});
	}, []);

	return (
		<>
			{isActive && (
				<>
					<Tooltip metrics={tooltipData.metrics} position={tooltipData.position} />
					{Array.from(modals.entries()).map(([id, modalInfo]) => (
						<Modal
							key={id}
							modalId={id}
							metrics={modalInfo.metrics}
							position={modalInfo.position}
							targetElement={modalInfo.targetElement}
							onClose={() => {
								setModals(prev => {
									const newModals = new Map(prev);
									newModals.delete(id);
									console.log('Closing modal', id);
									highlightElement(modalInfo.targetElement, false);
									return newModals;
								});
							}}
							onHighlight={() => toggleHighlight(id)}
							isHighlighted={modalInfo.isHighlighted ?? false}
							onBringToFront={bringToFront}
							zIndex={modalInfo.zIndex}
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
							zIndex: topZIndex + 1,
						}}
					>Cancel</button>
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
