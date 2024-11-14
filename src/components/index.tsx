import React, { useRef } from 'react';
import type { UIState, UIHandlers, ModalInfo } from '../types';
import { createRoot } from 'react-dom/client';

export const Tooltip: React.FC<{
	isActive: boolean;
	visible: boolean;
	content: string;
	position: { x: number; y: number };
}> = ({ isActive, visible, content, position }) => {
	if (!isActive || !visible) return null;

	return (
		<div
			className="font-detector-tooltip"
			style={{
				position: 'fixed',
				background: 'rgba(0, 0, 0, 0.8)',
				backdropFilter: 'blur(16px)',
				padding: '8px',
				border: 0,
				color: 'white',
				fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
				fontSize: '14px',
				lineHeight: 1,
				borderRadius: '4px',
				pointerEvents: 'none',
				zIndex: 10000,
				left: '0',
				top: '0',
				transform: `translate(${position.x}px, ${position.y}px)`,
			}}
		>
			{content}
		</div>
	);
};

export const ExitButton: React.FC<{
	isActive: boolean;
	onExit: () => void;
}> = ({ isActive, onExit }) => {
	if (!isActive) return null;

	return (
		<button
			className="font-detector-exit"
			onClick={onExit}
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
				lineHeight: 1,
				color: 'white',
				cursor: 'pointer',
				zIndex: 10002
			}}
		>
			Cancel
		</button>
	);
};

const HighlightButton: React.FC<{
	modalId: string;
	element: HTMLElement;
	isHighlighted: boolean;
	onHighlight: (element: HTMLElement, modalId: string, isHighlighting: boolean) => void;
}> = ({ modalId, element, isHighlighted, onHighlight }) => (
	<button
		className="font-detector-highlight-btn"
		onClick={() => onHighlight(element, modalId, !isHighlighted)}
		style={{
			padding: '6px 12px',
			margin: 0,
			border: '1px solid',
			borderColor: isHighlighted ? '#1976D2' : 'rgba(0, 0, 0, 0.1)',
			borderRadius: '4px',
			background: isHighlighted ? '#2196F3' : '#f0f0f0',
			color: isHighlighted ? 'white' : 'black',
			cursor: 'pointer',
			fontSize: '12px',
			fontFamily: 'inherit',
			whiteSpace: 'nowrap',
			transition: 'all 0.2s ease'
		}}
	>
		{isHighlighted ? 'Remove Highlight' : 'Highlight Element'}
	</button>
);

const MetricsRow: React.FC<{
	label: string;
	value: string;
	customContent?: React.ReactNode;
}> = ({ label, value, customContent }) => (
	<>
		<div style={{ fontWeight: 600, marginTop: '8px' }}>{label}</div>
		<div style={{ marginLeft: 0, marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
			{customContent}
			{value}
		</div>
	</>
);

const Modal: React.FC<{
	id: string;
	info: ModalInfo;
	onClose: (id: string) => void;
	onBringToFront: (id: string) => void;
	onHighlight: (element: HTMLElement, modalId: string, isHighlighting: boolean) => void;
}> = ({ id, info, onClose, onBringToFront, onHighlight }) => {
	const modalRef = useRef<HTMLDivElement>(null);

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation(); // Stop event propagation
		onClose(id);
	};

	const handleMouseDown = (e: React.MouseEvent) => {
		if (!(e.target as HTMLElement).classList.contains('modal-close-btn')) {
			onBringToFront(id);
		}
	};

	return (
		<div
			ref={modalRef}
			className="font-detector-modal"
			style={{
				position: 'absolute',
				background: 'white',
				padding: '16px',
				borderRadius: '4px',
				boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)',
				fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
				zIndex: info.zIndex,
				maxWidth: '300px',
				minWidth: '250px',
				border: '1px solid rgba(0, 0, 0, 0.1)',
				left: `${info.position.x}px`,
				top: `${info.position.y}px`
			}}
			onMouseDown={handleMouseDown}
			onClick={(e) => e.stopPropagation()} // Stop click propagation for the entire modal
		>
			{/* Rest of the Modal component remains the same */}
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '10px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<p style={{ margin: 0, fontWeight: 'bold' }}>Font Details</p>
				</div>
				<div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
					<HighlightButton
						modalId={id}
						element={info.targetElement}
						isHighlighted={info.isHighlighted}
						onHighlight={onHighlight}
					/>
					<button
						className="modal-close-btn"
						onClick={handleClose} // Use the new handleClose function
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '18px'
						}}
					>
						×
					</button>
				</div>
			</div>

			<div>
				<MetricsRow label="Font Family:" value={info.metrics.name} />
				<MetricsRow label="Weight:" value={info.metrics.weight.toString()} />
				<MetricsRow
					label="Color:"
					value={info.metrics.color}
					customContent={
						<span
							style={{
								backgroundColor: info.metrics.color,
								width: '10px',
								height: '10px',
								display: 'inline-block',
								marginRight: '5px'
							}}
						/>
					}
				/>
				<MetricsRow label="Style:" value={info.metrics.style} />
				<MetricsRow label="Size:" value={info.metrics.size} />
				<MetricsRow label="Line Height:" value={info.metrics.lineHeight} />
				<MetricsRow label="Letter Spacing:" value={info.metrics.letterSpacing} />
			</div>
		</div>
	);
};

export const ModalsContainer: React.FC<{
	modals: Map<string, ModalInfo>;
	onCloseModal: (id: string) => void;
	onBringToFront: (id: string) => void;
	onHighlightElement: (element: HTMLElement, modalId: string, isHighlighting: boolean) => void;
}> = ({ modals, onCloseModal, onBringToFront, onHighlightElement }) => {
	return (
		<>
			{Array.from(modals.entries()).map(([id, info]) => (
				<Modal
					key={id}
					id={id}
					info={info}
					onClose={onCloseModal}
					onBringToFront={onBringToFront}
					onHighlight={onHighlightElement}
				/>
			))}
		</>
	);
};

export const FontDetectorApp: React.FC<{
	state: UIState;
	handlers: UIHandlers;
}> = ({ state, handlers }) => {
	return (
		<>
			<Tooltip
				isActive={state.isActive}
				visible={state.tooltip.visible}
				content={state.tooltip.content}
				position={state.tooltip.position}
			/>
			<ExitButton
				isActive={state.isActive}
				onExit={handlers.onExit}
			/>
			<ModalsContainer
				modals={state.modals}
				onCloseModal={handlers.onCloseModal}
				onBringToFront={handlers.onBringModalToFront}
				onHighlightElement={handlers.onHighlightElement}
			/>
		</>
	);
};

export class ShadowContainer {
	private container: HTMLDivElement;
	private shadowRoot: ShadowRoot;
	private rootContainer: HTMLDivElement;
	private root: ReturnType<typeof createRoot> | null = null;

	constructor() {
		// Create container div
		this.container = document.createElement('div');
		this.container.id = 'font-detector-container';
		this.container.style.cssText = `
		all: initial;
		`;

		// Create shadow root
		this.shadowRoot = this.container.attachShadow({ mode: 'open' });

		// Create root container in shadow DOM
		this.rootContainer = document.createElement('div');
		this.rootContainer.id = 'font-detector-root';
		this.rootContainer.style.cssText = `
		all: initial
		`;
		// Add base styles to shadow DOM
		const styleSheet = document.createElement('style');
		styleSheet.textContent = `
            :host {
                all: initial;
                pointer-events: none;
            }
        `;

		this.shadowRoot.appendChild(styleSheet);
		this.shadowRoot.appendChild(this.rootContainer);
	}

	public mount(): void {
		document.body.appendChild(this.container);
		this.setupRoot();
	}

	public unmount(): void {
		if (this.container.parentNode) {
			this.container.parentNode.removeChild(this.container);
		}
		this.root = null;
	}

	private setupRoot(): void {
		// Create React root in shadow DOM
		this.root = createRoot(this.rootContainer);
	}

	public render(state: UIState, handlers: UIHandlers): void {
		if (this.root) {
			this.root.render(
				<FontDetectorApp
					state={state}
					handlers={handlers}
				/>
			);
		}
	}

	public getShadowRoot(): ShadowRoot {
		return this.shadowRoot;
	}
}