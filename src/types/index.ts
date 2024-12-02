export interface FontMetrics {
	name: string;
	weight: number;
	style: string;
	size: string;
	color: string;
	lineHeight: string;
	letterSpacing: string;
	category?: string;
	loadTime?: number;
	alternativeFonts?: string[];
}

export interface FontHierarchyData {
	tag: string;
	fontMetrics: FontMetrics;
	frequency: number;
	children: FontHierarchyData[];
}

export interface FontAnalysisReport {
	hierarchy: FontHierarchyData[];
	fontUsageStats?: Map<string, number>;
}

export interface TrackedElement {
	element: HTMLElement;
	originalStyles: {
		outline: string;
		backgroundColor: string;
	};
}

export interface ModalInfo {
	metrics: FontMetrics;
	position: { x: number; y: number };
	targetElement: HTMLElement;
	isHighlighted: boolean;
}

export interface DebugConfig {
	enabled: boolean;
	logLevel: 'info' | 'debug' | 'verbose';
	showDebugPanel: boolean;
}
