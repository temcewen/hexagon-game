export class BlinkManager {
    private highlightBlinkTimer: number = 0;
    private readonly BLINK_SPEED_MS: number = 1000; // Blink cycle duration in ms
    private callback: () => void;
    
    constructor(callback: () => void) {
        this.callback = callback;
        this.startBlinkTimer();
    }
    
    private startBlinkTimer(): void {
        // Update the highlight blink effect
        this.highlightBlinkTimer = window.setInterval(() => {
            // Call the callback to trigger a redraw
            this.callback();
        }, 100); // Update every 100ms for smooth animation
    }
    
    public getBlinkPhase(): number {
        const now = Date.now();
        return (now % this.BLINK_SPEED_MS) / this.BLINK_SPEED_MS;
    }
    
    public calculateOpacity(minOpacity: number = 0.3, maxOpacity: number = 0.7): number {
        const phase = this.getBlinkPhase();
        // Use sine wave to create smooth transition between min and max opacity
        return minOpacity + Math.sin(phase * Math.PI * 2) * ((maxOpacity - minOpacity) / 2);
    }
    
    public cleanup(): void {
        if (this.highlightBlinkTimer) {
            window.clearInterval(this.highlightBlinkTimer);
            this.highlightBlinkTimer = 0;
        }
    }
} 