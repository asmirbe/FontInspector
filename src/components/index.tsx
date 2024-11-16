import React, { useRef } from 'react';
import type { UIState, UIHandlers, ModalInfo, TooltipProps, ModalProps } from '../types';
import { createRoot } from 'react-dom/client';
import { useTooltipPosition } from '../utils/useTooltipPosition';
import { useModalPosition } from '../utils/useModalPosition';

export const Tooltip: React.FC<TooltipProps> = ({
	isActive,
	visible,
	content,
	position
}) => {
	const { position: tooltipPosition, placement, tooltipRef } = useTooltipPosition(
		content,
		position
	);

	if (!isActive || !visible) return null;

	return (
		<div
			ref={tooltipRef}
			className="font-detector-tooltip"
			style={{
				position: 'fixed',
				background: '#262626cc',
				backdropFilter: 'blur(16px)',
				WebkitBackdropFilter: 'blur(16px)',
				padding: '4px 8px',
				border: 0,
				backgroundBlendMode: 'luminosity',
				color: 'white',
				fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
				fontSize: '14px',
				lineHeight: '20px',
				borderRadius: '6px',
				pointerEvents: 'none',
				zIndex: 10000,
				left: '0',
				top: '0',
				transform: `translate(${tooltipPosition.x}px, ${tooltipPosition.y}px)`,
				whiteSpace: 'nowrap',
			}}
			data-placement={`${placement.vertical}-${placement.horizontal}`}
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
				background: '#262626cc',
				backdropFilter: 'blur(16px)',
				WebkitBackdropFilter: 'blur(16px)',
				padding: '4px 8px',
				border: 0,
				backgroundBlendMode: 'luminosity',
				color: 'white',
				fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
				fontSize: '14px',
				lineHeight: '20px',
				borderRadius: '6px',
				cursor: 'pointer',
				zIndex: 10002
			}}
		>
			Exit Font Inspector
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
		<div style={{ display: 'flex', alignItems: 'center' }}>
			{customContent}
			{value}
		</div>
	</>
);

export const Modal: React.FC<ModalProps> = ({ id, info, onClose, onBringToFront, onHighlight }) => {
	const modalRef = useRef<HTMLDivElement>(null);
	const { position } = useModalPosition({
		initialPosition: info.position,
		modalRef,
		padding: 20,
		clickPosition: info.clickPosition // Pass the original click position
	});

	const handleClose = (e: React.MouseEvent) => {
		e.stopPropagation();
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
				borderRadius: '8px',
				boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
				fontFamily: 'system-ui, sans-serif',
				zIndex: info.zIndex,
				maxWidth: '300px',
				minWidth: '250px',
				left: `${position.x}px`,
				top: `${position.y}px`,
				transition: 'transform 0.2s ease, opacity 0.2s ease',
			}}
			onMouseDown={handleMouseDown}
			onClick={(e) => e.stopPropagation()}
		>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '12px',
				borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
				paddingBottom: '8px'
			}}>
				<div style={{ display: 'flex', alignItems: 'center' }}>
					<p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>Font Details</p>
				</div>
				<div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
					<HighlightButton
						modalId={id}
						element={info.targetElement}
						isHighlighted={info.isHighlighted}
						onHighlight={onHighlight}
					/>
					<button
						className="modal-close-btn"
						onClick={handleClose}
						style={{
							background: 'none',
							border: 'none',
							cursor: 'pointer',
							fontSize: '20px',
							color: '#666',
							padding: '4px',
							display: 'flex',
							alignItems: 'center',
							justifyContent: 'center',
							width: '24px',
							height: '24px',
							borderRadius: '4px',
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
								width: '12px',
								height: '12px',
								display: 'inline-block',
								marginRight: '8px',
								borderRadius: '2px',
								border: '1px solid rgba(0, 0, 0, 0.1)'
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