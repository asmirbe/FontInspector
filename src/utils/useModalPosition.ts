import { useEffect, useState, RefObject } from 'react';

interface Position {
	x: number;
	y: number;
}

interface UseModalPositionProps {
	initialPosition: Position;
	modalRef: RefObject<HTMLElement>;
	offset?: { x: number; y: number };
}

export function useModalPosition({
	initialPosition,
	modalRef,
	offset = { x: 10, y: 10 }
}: UseModalPositionProps) {
	const [position, setPosition] = useState<Position>(initialPosition);
	console.log('position', position);

	return { position };
}