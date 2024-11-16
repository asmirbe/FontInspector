import { useState, useEffect, RefObject } from 'react';

interface Position {
	x: number;
	y: number;
}

interface UseModalPositionProps {
	initialPosition: Position;
	modalRef: RefObject<HTMLDivElement>;
	padding?: number;
	clickPosition?: Position; // Store original click position for flipping
}

export const useModalPosition = ({
	initialPosition,
	modalRef,
	padding = 20,
	clickPosition
}: UseModalPositionProps) => {
	const [position, setPosition] = useState(initialPosition);

	useEffect(() => {
		const calculatePosition = () => {
			if (!modalRef.current) return initialPosition;

			const modalRect = modalRef.current.getBoundingClientRect();
			const viewportWidth = document.documentElement.clientWidth;
			const viewportHeight = document.documentElement.clientHeight;
			const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
			const scrollY = window.pageYOffset || document.documentElement.scrollTop;

			// Start with initial position
			let x = initialPosition.x;
			let y = initialPosition.y;

			// Convert to viewport coordinates for boundary checking
			let viewportX = x - scrollX;
			let viewportY = y - scrollY;

			if (clickPosition) {
				// Calculate available space on each side
				const clickViewportX = clickPosition.x - scrollX;
				const clickViewportY = clickPosition.y - scrollY;

				const spaceRight = viewportWidth - clickViewportX;
				const spaceLeft = clickViewportX;
				const spaceBottom = viewportHeight - clickViewportY;
				const spaceTop = clickViewportY;

				// Flip horizontally if needed
				if (viewportX + modalRect.width > viewportWidth - padding && spaceLeft > spaceRight) {
					// If there's more space on the left, flip to the left
					x = clickPosition.x - modalRect.width - padding;
					viewportX = x - scrollX;
				} else if (viewportX < padding && spaceRight > spaceLeft) {
					// If there's more space on the right, flip to the right
					x = clickPosition.x + padding;
					viewportX = x - scrollX;
				}

				// Flip vertically if needed
				if (viewportY + modalRect.height > viewportHeight - padding && spaceTop > spaceBottom) {
					// If there's more space on top, flip upwards
					y = clickPosition.y - modalRect.height - padding;
					viewportY = y - scrollY;
				} else if (viewportY < padding && spaceBottom > spaceTop) {
					// If there's more space on bottom, flip downwards
					y = clickPosition.y + padding;
					viewportY = y - scrollY;
				}
			}

			// Final boundary checks to ensure modal stays within viewport
			if (viewportX + modalRect.width > viewportWidth - padding) {
				x = scrollX + viewportWidth - modalRect.width - padding;
			}
			if (viewportX < padding) {
				x = scrollX + padding;
			}
			if (viewportY + modalRect.height > viewportHeight - padding) {
				y = scrollY + viewportHeight - modalRect.height - padding;
			}
			if (viewportY < padding) {
				y = scrollY + padding;
			}

			return { x, y };
		};

		// Initial position calculation
		const newPosition = calculatePosition();
		if (newPosition.x !== position.x || newPosition.y !== position.y) {
			setPosition(newPosition);
		}

		// Recalculate on window resize or scroll
		const handleViewportChange = () => {
			const newPosition = calculatePosition();
			setPosition(newPosition);
		};

		window.addEventListener('resize', handleViewportChange);

		return () => {
			window.removeEventListener('resize', handleViewportChange);
		};
	}, [initialPosition, modalRef, padding, clickPosition]);

	return { position };
};