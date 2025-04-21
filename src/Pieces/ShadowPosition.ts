import { Piece } from '../Piece.js';
import { GridHexagon } from '../types.js';

export class ShadowPosition extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;
    private opacity: number = 0.25;
    private animationStartTime: number;
    private animationFrameId: number | null = null;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/eye.png';
        this.image.onload = () => {
            this.imageLoaded = true;
            // Start animation when image is loaded
            this.startAnimation();
        };

        // Initialize animation start time
        this.animationStartTime = performance.now();
    }

    private startAnimation(): void {
        if (this.animationFrameId) return; // Don't start if already running
        
        const animate = () => {
            this.ctx.canvas.dispatchEvent(new Event('redraw'));
            this.animationFrameId = requestAnimationFrame(animate);
        };
        animate();
    }

    private stopAnimation(): void {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    public draw(isSelected: boolean): void {
        if (!this.imageLoaded) return;

        // Save the current context state
        this.ctx.save();

        // Draw dark grey hexagon background
        this.ctx.beginPath();
        const angle = Math.PI / 3;
        this.ctx.moveTo(this.x + this.hexSize * Math.cos(0), this.y + this.hexSize * Math.sin(0));
        for (let i = 1; i <= 6; i++) {
            this.ctx.lineTo(
                this.x + this.hexSize * Math.cos(i * angle),
                this.y + this.hexSize * Math.sin(i * angle)
            );
        }
        this.ctx.fillStyle = isSelected ? 'rgba(74, 144, 226, 0.3)' : 'rgba(0, 0, 0, .5)';
        this.ctx.fill();

        // Calculate opacity using sine wave
        const elapsedTime = performance.now() - this.animationStartTime;
        const frequency = 2 * Math.PI / 5000; // Complete cycle every 5000ms
        // Sine wave oscillates between -1 and 1, we transform it to oscillate between 0.25 and 0.5
        this.opacity = 0.375 + 0.125 * Math.sin(frequency * elapsedTime);

        // Set the global alpha for transparency
        this.ctx.globalAlpha = this.opacity;

        // Calculate image dimensions
        const imageSize = this.hexSize * 1.5;
        
        // Draw the image centered on the piece's position
        this.ctx.drawImage(
            this.image,
            this.x - imageSize / 2,
            this.y - imageSize / 2,
            imageSize,
            imageSize
        );

        // Restore the context state
        this.ctx.restore();
    }

    public remove(): void {
        this.stopAnimation();
        super.remove();
    }

    public isMovable(): boolean {
        return false; // ShadowPosition cannot be moved
    }
}
