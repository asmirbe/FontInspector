import type { FontMetrics } from '../types';

interface TooltipProps {
	metrics: FontMetrics | null;
	position: { x: number; y: number };
}

export const Tooltip: React.FC<TooltipProps> = ({ metrics, position }) => {
	if (!metrics) return null;
	return (
		<div style={{
			position: 'fixed',
			left: `${position.x}px`,
			top: `${position.y}px`,
			background: 'rgba(0, 0, 0, 0.8)',
			backdropFilter: 'blur(16px)',
			padding: '8px',
			border: '0',
			color: 'white',
			fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
			fontSize: '14px',
			lineHeight: '1',
			whiteSpace: 'nowrap',
			borderRadius: '4px',
			pointerEvents: 'none',
			zIndex: 10000,
		}}>
			{`${metrics.name} (${metrics.weight})`}
		</div>
	);
};
