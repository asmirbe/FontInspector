export class DebugPanel {
    private readonly panel: HTMLDivElement;
    private readonly content: HTMLDivElement;
    private updateInterval: number | null = null;
    private readonly counter: HTMLDivElement;

    constructor() {
        this.panel = document.createElement('div');
        this.panel.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            width: 300px;
            max-height: 400px;
            background: rgba(0, 0, 0, 0.9);
            color: #00ff00;
            font-family: monospace;
            padding: 10px;
            border-radius: 4px;
            z-index: 10005;
            overflow-y: auto;
            backdrop-filter: blur(16px);
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid #00ff00;
            margin-bottom: 10px;
            padding-bottom: 5px;
        `;

        const title = document.createElement('div');
        title.textContent = 'Debug Panel';

        this.counter = document.createElement('div');
        this.counter.style.fontSize = '12px';

        header.appendChild(title);
        header.appendChild(this.counter);
        this.panel.appendChild(header);

        this.content = document.createElement('div');
        this.panel.appendChild(this.content);
    }

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
        this.counter.textContent = `Tracked: ${data.trackedElements.length}`;
        this.content.innerHTML = `
            <pre style="margin: 0; white-space: pre-wrap; font-size: 12px;">${this.formatDebugData(data)}</pre>
        `;
    }

    private formatDebugData(data: any): string {
        return JSON.stringify({
            activeModals: data.activeModals.map((modal: any) => ({
                id: modal.id,
                element: `${modal.targetElement.tagName}`,
                text: modal.targetElement.text.substring(0, 20) + '...',
                highlighted: modal.isHighlighted
            })),
            trackedElements: data.trackedElements,
            timestamp: new Date().toISOString()
        }, null, 2);
    }
}