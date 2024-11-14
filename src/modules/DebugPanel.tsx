import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';

// Define the type for window to include EnhancedFontAnalyzer
declare global {
	interface Window {
		EnhancedFontAnalyzer: any;
	}
}

export class DebugPanel {
	private readonly panel: HTMLDivElement;
	private root: any;
	private updateInterval: number | null = null;
	private currentData: any = { trackedElements: [] };

	constructor() {
		this.panel = document.createElement('div');
		this.panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            font-family: monospace;
            padding: 14px;
            z-index: 2147483646;
            overflow-y: auto;
				background: #262626cc;
				background-blend-mode: luminosity;
				backdrop-filter: blur(16px);
				border: 0;
				color: white;
				font-family: 'Segoe UI', Helvetica, Arial, sans-serif;
				font-size: 14px;
				line-height: 20px;
				border-radius: 6px;
        `;

		// Create React root
		this.root = createRoot(this.panel);
		this.root.render(
			<DebugPanelComponent
				data={this.currentData}
				formatDebugData={this.formatDebugData}
			/>
		);
	}

	private formatDebugData = (data: any): string => {
		return JSON.stringify({
			activeModals: data.activeModals?.map((modal: any) => ({
				id: modal.id,
				element: `${modal.targetElement?.tagName}`,
				text: modal.targetElement?.text?.substring(0, 20) + '...',
				highlighted: modal.isHighlighted
			})) || [],
			trackedElements: data.trackedElements,
			timestamp: new Date().toLocaleString()
		}, null, 2);
	};

	public startAutoUpdate(callback: () => any): void {
		this.updateInterval = window.setInterval(() => {
			this.update(callback());
		}, 100);
	}

	public stopAutoUpdate(): void {
		if (this.updateInterval) {
			clearInterval(this.updateInterval);
			this.updateInterval = null;
		}
	}

	public show(): void {
		document.body.appendChild(this.panel);
	}

	public hide(): void {
		this.stopAutoUpdate();
		if (this.panel.parentNode) {
			this.panel.parentNode.removeChild(this.panel);
		}
	}

	public update(data: any): void {
		this.currentData = data;
		this.root.render(
			<DebugPanelComponent
				data={this.currentData}
				formatDebugData={this.formatDebugData}
			/>
		);
	}
}

// React component for the Debug Panel
const DebugPanelComponent: React.FC<{
	data: any;
	formatDebugData: (data: any) => string;
}> = ({ data, formatDebugData }) => {
	const contentRef = useRef<HTMLPreElement>(null);
	const [content, setContent] = useState('');

	useEffect(() => {
		const newContent = formatDebugData(data);
		if (newContent !== content) {
			setContent(newContent);
		}
	}, [data, formatDebugData]);

	return (
		<>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				marginBottom: '10px',
			}}>
				<div>Debug Panel</div>
				<div style={{ fontSize: '12px' }}>
					Tracked: {data.trackedElements.length}
				</div>
			</div>
			<div>
				<pre
					ref={contentRef}
					style={{
						margin: 0,
						whiteSpace: 'pre-wrap',
						fontSize: '12px'
					}}
					dangerouslySetInnerHTML={{ __html: content }}
				/>
			</div>
		</>
	);
};