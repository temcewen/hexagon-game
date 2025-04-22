export class TooltipManager {
    private tooltipElement: HTMLDivElement | null = null;
    private canvas: HTMLCanvasElement | null = null;
    
    // Singleton instance
    private static instance: TooltipManager | null = null;
    
    // Private constructor to enforce singleton pattern
    private constructor() {
        if (TooltipManager.instance) {
            throw new Error('TooltipManager instance already exists. Use getInstance() instead of creating a new instance.');
        }
    }
    
    /**
     * Gets the singleton instance of TooltipManager
     */
    public static getInstance(): TooltipManager {
        if (!TooltipManager.instance) {
            TooltipManager.instance = new TooltipManager();
        }
        return TooltipManager.instance;
    }
    
    public setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.createTooltipElement();
    }

    // Create the HTML tooltip element
    private createTooltipElement(): void {
        // Check if tooltip already exists or canvas is not set
        if (this.tooltipElement || !this.canvas) return;
        
        // Create tooltip element
        this.tooltipElement = document.createElement('div');
        this.tooltipElement.id = 'game-tooltip';
        this.tooltipElement.style.cssText = `
            position: absolute;
            padding: 10px 15px;
            background-color: rgba(0, 0, 0, 0.8);
            color: white;
            border-radius: 8px;
            font-family: Arial, sans-serif;
            font-size: 16px;
            font-weight: bold;
            pointer-events: none;
            z-index: 1000;
            box-shadow: 0 0 5px rgba(0, 255, 255, 0.5);
            border: 2px solid rgba(0, 255, 255, 0.5);
            text-align: center;
            max-width: 400px;
            display: none;
            transform: translate(-50%, 0);
            top: 20px;
            left: 50%;
        `;
        
        // Add it to the DOM, right after the canvas
        if (this.canvas.parentNode) {
            this.canvas.parentNode.appendChild(this.tooltipElement);
        } else {
            document.body.appendChild(this.tooltipElement);
        }
    }

    // Show the HTML tooltip with the given text
    public showTooltip(text: string, position?: {top?: number, left?: number}): void {
        if (!this.tooltipElement) this.createTooltipElement();
        if (!this.tooltipElement) return; // Safety check
        
        // Set the text
        this.tooltipElement.textContent = text;
        
        // Position the tooltip if custom position provided
        if (position) {
            if (position.top !== undefined) {
                this.tooltipElement.style.top = `${position.top}px`;
            }
            if (position.left !== undefined) {
                this.tooltipElement.style.left = `${position.left}px`;
            }
        } else {
            // Default position at top-center
            this.tooltipElement.style.top = '20px';
            this.tooltipElement.style.left = '50%';
        }
        
        // Show the tooltip
        this.tooltipElement.style.display = 'block';
    }
    
    // Hide the HTML tooltip
    public hideTooltip(): void {
        if (this.tooltipElement) {
            this.tooltipElement.style.display = 'none';
        }
    }
    
    // Clean up tooltip resources
    public cleanup(): void {
        if (this.tooltipElement && this.tooltipElement.parentNode) {
            this.tooltipElement.parentNode.removeChild(this.tooltipElement);
            this.tooltipElement = null;
        }
    }
} 