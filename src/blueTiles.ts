import { GridHexagon, TileHexagon } from './types.js';
import { MovableTile } from './movableTile.js';

class BlueTiles extends MovableTile {
    private commanderImage: HTMLImageElement;

    constructor(canvas: HTMLCanvasElement, hexSize: number) {
        super(canvas, hexSize * 0.6);
        this.commanderImage = new Image();
        this.commanderImage.src = 'assets/commander-icon.png';
        
        // Enable image smoothing for this context
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';
    }

    protected drawHexagon(x: number, y: number, isSelected: boolean = false): void {
        // Save the current context state
        this.ctx.save();
        
        // Draw hexagon path for hit detection and selection
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = Math.PI / 2 + (2 * Math.PI / 6 * i);
            const hx = x + this.hexSize * Math.cos(angle);
            const hy = y + this.hexSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();

        // Calculate image size based on hex size, accounting for device pixel ratio
        const imageSize = this.hexSize * 1.5;
        const dpr = window.devicePixelRatio || 1;
        
        // Draw the commander icon with proper scaling
        if (this.commanderImage.complete) {
            if (isSelected) {
                // When selected/dragging, draw a semi-transparent version first as a shadow
                this.ctx.globalAlpha = 0.6;
                this.ctx.drawImage(
                    this.commanderImage,
                    x - imageSize/2,
                    y - imageSize/2,
                    imageSize,
                    imageSize
                );
                
                // Then draw the main image with slight transparency
                this.ctx.globalAlpha = 0.8;
            }
            else {

                this.ctx.drawImage(
                    this.commanderImage,
                    x - imageSize/2,
                    y - imageSize/2,
                    imageSize,
                    imageSize
                );
            }
        }
        
        // Restore the context state (this will reset globalAlpha to 1)
        this.ctx.restore();
    }

    /**
     * Custom stacking rule: Blue tiles always go on top of red tiles
     */
    protected determineZIndex(placedTile: TileHexagon, existingStack: TileHexagon[]): number {
        // Always ensure blue tiles get the highest z-index
        return MovableTile.nextZIndex;  // Add a large offset to ensure it's always on top
    }

    /**
     * Custom stack update: Ensure blue tiles stay on top and maintain their relative order
     */
    protected updateStackZIndices(stack: TileHexagon[]): void {
        // Get blue tiles in the stack
        const blueTiles = stack.filter(tile => this.hasHexagon(tile));
        
        // Sort blue tiles by their existing z-index to maintain relative order
        blueTiles.sort((a, b) => a.zIndex - b.zIndex);
        
        // Update their z-indices to be consecutive while staying on top
        blueTiles.forEach((tile, index) => {
            tile.zIndex = MovableTile.nextZIndex + 1000 + index;  // Keep blue tiles at high z-indices
        });
        
        // Update the nextZIndex to be above all blue tiles
        MovableTile.nextZIndex = Math.max(...blueTiles.map(t => t.zIndex)) + 1;
    }
}

export default BlueTiles; 