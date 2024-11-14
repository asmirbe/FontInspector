import { useEffect, useRef, useState } from 'react';

interface Position {
  x: number;
  y: number;
}

interface Placement {
  horizontal: 'left' | 'right';
  vertical: 'top' | 'bottom';
}

interface UseTooltipPosition {
  position: Position;
  placement: Placement;
  tooltipRef: React.RefObject<HTMLDivElement>;
}

export const useTooltipPosition = (
	content: string,
	cursorPosition: Position,
	offset: number = 10
): UseTooltipPosition => {
	const tooltipRef = useRef<HTMLDivElement>(null);
	const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
	const [placement, setPlacement] = useState<Placement>({
		horizontal: 'right',
		vertical: 'bottom'
	});

	useEffect(() => {
		if (!tooltipRef.current) return;

		const tooltip = tooltipRef.current;
		const tooltipRect = tooltip.getBoundingClientRect();
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		const effectiveViewportWidth = viewportWidth - scrollbarWidth;

		// Start with cursor-following position
		let x = cursorPosition.x + offset;
		let y = cursorPosition.y + offset;

		// Check if tooltip would overflow right edge
		if (x + tooltipRect.width > effectiveViewportWidth) {
			// Switch to left side of cursor
			x = cursorPosition.x - tooltipRect.width;
			setPlacement(prev => ({ ...prev, horizontal: 'left' }));
		} else {
			setPlacement(prev => ({ ...prev, horizontal: 'right' }));
		}

		// Handle vertical positioning
		if (y + tooltipRect.height > viewportHeight - offset) {
			y = cursorPosition.y - tooltipRect.height - offset;
			setPlacement(prev => ({ ...prev, vertical: 'top' }));
		} else {
			setPlacement(prev => ({ ...prev, vertical: 'bottom' }));
		}

		setPosition({ x, y });
	}, [cursorPosition, content, offset]);

	return { position, placement, tooltipRef };
};