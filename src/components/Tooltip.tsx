import type { FontMetrics } from '../types';
import React, { useEffect, useRef, useState } from 'react';

interface TooltipProps {
	metrics: FontMetrics | null;
	position: { x: number; y: number };
}

export const Tooltip: React.FC<TooltipProps> = ({ metrics, position }) => {
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [adjustedPosition, setAdjustedPosition] = useState(position);

	useEffect(() => {
		if (!tooltipRef.current || !metrics) return;

		const tooltip = tooltipRef.current;
		const rect = tooltip.getBoundingClientRect();
		const padding = 24;

		let x = position.x + 4;
		let y = position.y + 4;

		// Check right edge
		if (x + rect.width + padding > window.innerWidth) {
			x = position.x - rect.width - padding;
		}

		// Check left edge
		if (x < padding) {
			x = padding;
		}

		// Check bottom edge
		if (y + rect.height + padding > window.innerHeight) {
			y = position.y - rect.height - padding;
		}

		// Check top edge
		if (y < padding) {
			y = padding;
		}

		setAdjustedPosition({ x, y });
	}, [position, metrics]);

	if (!metrics) return null;

	return (
		<div
			ref={tooltipRef}
			style={{
				position: 'fixed',
				left: adjustedPosition.x,
				top: adjustedPosition.y,
				background: 'rgba(0, 0, 0, 0.8)',
				backdropFilter: 'blur(16px)',
				color: 'white',
				padding: '8px 12px',
				borderRadius: '4px',
				fontSize: '14px',
				lineHeight: '1.4',
				pointerEvents: 'none',
				zIndex: 10000,
				maxWidth: '300px',
				whiteSpace: 'nowrap'
			}}
		>
			{`${metrics.name} (${metrics.weight})`}
		</div>
	);
};