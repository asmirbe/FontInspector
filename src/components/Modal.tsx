import React from 'react';
import type { FontMetrics } from '../types';

interface ModalProps {
	metrics: FontMetrics;
	position: { x: number; y: number };
	onClose: () => void;
	onHighlight: () => void;
	isHighlighted: boolean;
	targetElement: HTMLElement;
	modalId: string;  // Add modalId prop
	onBringToFront: (modalId: string) => void;  // Add onBringToFront prop
	zIndex: number;  // Add zIndex prop
}


const Modal: React.FC<ModalProps> = ({
	metrics,
	position,
	onClose,
	onHighlight,
	isHighlighted,
	targetElement,
	modalId,
	onBringToFront,
	zIndex
}) => {
	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
		if (isHighlighted) {
			const computedStyle = window.getComputedStyle(targetElement);
			targetElement.style.outline = computedStyle.outline;
			targetElement.style.backgroundColor = computedStyle.backgroundColor;
		}
		onClose();
	};

	const handleModalClick = (e: React.MouseEvent) => {
		e.stopPropagation();
		onBringToFront(modalId);
	};

	return (
		<div
			onClick={handleModalClick}
			className="modal-container"
			style={{
				position: 'absolute',
				left: `${position.x}px`,
				top: `${position.y}px`,
				background: 'white',
				padding: '16px',
				borderRadius: '4px',
				boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
				fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
				zIndex: zIndex,
				maxWidth: '300px',
				minWidth: '250px',
				border: '1px solid rgba(0, 0, 0, 0.1)',
			}}>
			<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
				<p style={{ margin: 0, fontWeight: 'bold' }}>Font Details</p>
				<div>
					<button onClick={onHighlight} style={{
						padding: '6px 12px',
						margin: '0 8px 0 0',
						border: '1px solid rgba(0, 0, 0, 0.1)',
						borderRadius: '4px',
						background: isHighlighted ? '#2196F3' : '#f0f0f0',
						color: isHighlighted ? 'white' : 'black',
						cursor: 'pointer',
						fontSize: '12px',
					}}>
						{isHighlighted ? 'Remove Highlight' : 'Highlight Element'}
					</button>
					<button
						onClick={handleClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '18px'
						}}>
						×
					</button>
				</div>
			</div>
			{Object.entries(metrics).map(([key, value]) => (
				<div key={key}>
					<div style={{ fontWeight: 600, marginTop: '8px' }}>{key.charAt(0).toUpperCase() + key.slice(1)}:</div>
					<div style={{ marginLeft: 0, marginBottom: '8px' }}>
						{key === 'color' ? (
							<>
								<span style={{ backgroundColor: value, width: '10px', height: '10px', display: 'inline-block', marginRight: '5px' }}></span>
								{value}
							</>
						) : value}
					</div>
				</div>
			))}
		</div>
	);
};


export { Modal }