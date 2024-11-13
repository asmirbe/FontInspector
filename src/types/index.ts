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
	targetElement: HTMLElement;
	isHighlighted: boolean;
	metrics: FontMetrics;
	position: {
		x: number;
		y: number;
	};
	zIndex: number;
}

export interface DebugConfig {
    enabled: boolean;
    logLevel: 'info' | 'debug' | 'verbose';
    showDebugPanel: boolean;
}

export interface TrackedElement {
	element: HTMLElement;
	originalStyles: {
		outline: string;
		backgroundColor: string;
	};
}

export interface UIState {
	isActive: boolean;
	tooltip: {
		visible: boolean;
		content: string;
		position: { x: number; y: number };
	};
	modals: Map<string, ModalInfo>;
	trackedElements: Map<string, TrackedElement>;
	topZIndex: number;
}

export interface UIHandlers {
	onExit: () => void;
	onCloseModal: (id: string) => void;
	onBringModalToFront: (id: string) => void;
	onHighlightElement: (element: HTMLElement, modalId: string, isHighlighting: boolean) => void;
}