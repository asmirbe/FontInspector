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

	// Regex patterns for JSON syntax
	private readonly patterns = {
		key: /"([^"]+)":/g,
		string: /: "([^"]+)"/g,
		number: /: (-?\d+\.?\d*)/g,
		boolean: /: (true|false)/g,
		null: /: (null)/g,
		brackets: /([{}\[\]])/g,
		comma: /(,)/g
	};

	private readonly colors = {
		key: '#f44',
		string: '#7d8',
		number: '#f60',
		boolean: '#3bf',
		null: '#3bf',
		brackets: '#d4d4d4',
		comma: '#d4d4d4'
	};

	constructor() {
		this.panel = document.createElement('div');
		this.panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #fff;
            font-family: monospace;
            padding: 10px;
            border-radius: 4px;
            z-index: 10005;
            overflow-y: auto;
            backdrop-filter: blur(16px);
        `;

		// Create React root
		this.root = createRoot(this.panel);
		this.root.render(
			<DebugPanelComponent
				data={this.currentData}
				patterns={this.patterns}
				colors={this.colors}
				formatDebugData={this.formatDebugData}
				highlightJson={this.highlightJson}
			/>
		);
	}

	private highlightJson = (json: string): string => {
		let highlighted = json;

		highlighted = highlighted
			.replace(this.patterns.key, `"<span style="color: ${this.colors.key}">$1</span>":`)
			.replace(this.patterns.string, `: "<span style="color: ${this.colors.string}">$1</span>"`)
			.replace(this.patterns.number, `: <span style="color: ${this.colors.number}">$1</span>`)
			.replace(this.patterns.boolean, `: <span style="color: ${this.colors.boolean}">$1</span>`)
			.replace(this.patterns.null, `: <span style="color: ${this.colors.null}">$1</span>`)
			.replace(this.patterns.brackets, `<span style="color: ${this.colors.brackets}">$1</span>`)
			.replace(this.patterns.comma, `<span style="color: ${this.colors.comma}">$1</span>`);

		return highlighted;
	};

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
				patterns={this.patterns}
				colors={this.colors}
				formatDebugData={this.formatDebugData}
				highlightJson={this.highlightJson}
			/>
		);
	}
}

// React component for the Debug Panel
const DebugPanelComponent: React.FC<{
	data: any;
	patterns: any;
	colors: any;
	formatDebugData: (data: any) => string;
	highlightJson: (json: string) => string;
}> = ({ data, formatDebugData, highlightJson }) => {
	const contentRef = useRef<HTMLPreElement>(null);
	const [content, setContent] = useState('');

	useEffect(() => {
		const newContent = formatDebugData(data);
		const newHighlighted = highlightJson(newContent);
		if (newHighlighted !== content) {
			setContent(newHighlighted);
		}
	}, [data, formatDebugData, highlightJson]);

	return (
		<>
			<div style={{
				display: 'flex',
				justifyContent: 'space-between',
				alignItems: 'center',
				borderBottom: '1px solid rgba(255, 255, 255, 0.5)',
				marginBottom: '10px',
				paddingBottom: '10px'
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
