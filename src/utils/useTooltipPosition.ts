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
	offset: number = 10	// Default offset value
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

		// Initial position (right of cursor, below it)
		let x = Math.round(cursorPosition.x + offset);
		let y = Math.round(cursorPosition.y + offset);

		// Account for scrollbar in viewport width
		const effectiveViewportWidth = viewportWidth - scrollbarWidth;

		// Pre-calculate if tooltip would fit in default position
		const fitsRight = x + Math.ceil(tooltipRect.width) <= effectiveViewportWidth - offset;
		const fitsBottom = y + Math.ceil(tooltipRect.height) <= viewportHeight - offset;

		// Handle horizontal positioning
		if (!fitsRight) {
			x = Math.round(cursorPosition.x - Math.ceil(tooltipRect.width) - offset);
			setPlacement(prev => ({ ...prev, horizontal: 'left' }));
		} else {
			setPlacement(prev => ({ ...prev, horizontal: 'right' }));
		}

		// Handle vertical positioning
		if (!fitsBottom) {
			y = Math.round(cursorPosition.y - Math.ceil(tooltipRect.height) - offset);
			setPlacement(prev => ({ ...prev, vertical: 'top' }));
		} else {
			setPlacement(prev => ({ ...prev, vertical: 'bottom' }));
		}

		// Ensure tooltip stays within viewport while maintaining offset
		x = Math.round(Math.max(offset, Math.min(x, effectiveViewportWidth - Math.ceil(tooltipRect.width) - offset)));
		y = Math.round(Math.max(offset, Math.min(y, viewportHeight - Math.ceil(tooltipRect.height) - offset)));

		setPosition({ x, y });
	}, [cursorPosition, content, offset]);

	return { position, placement, tooltipRef };
};