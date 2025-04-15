import { GridHexagon, TileHexagon } from './types.js';
import { MovableTile } from './movableTile.js';

class RedTiles extends MovableTile {
    constructor(canvas: HTMLCanvasElement, hexSize: number) {
        super(canvas, hexSize * 0.8); // Red tiles are 80% the size of black ones
    }

    protected drawHexagon(x: number, y: number, isSelected: boolean = false): void {
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
        this.ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, .6)' : 'red';
        this.ctx.fill();
    }

    /**
     * Custom stacking rule: Red tiles always go under blue tiles
     */
    protected determineZIndex(placedTile: TileHexagon, existingStack: TileHexagon[]): number {
        // Find blue tiles (tiles not managed by this RedTiles instance)
        const blueTiles = existingStack.filter(tile => !this.hasHexagon(tile));
        
        if (blueTiles.length > 0) {
            // Find the lowest z-index among blue tiles
            const lowestBlueZIndex = Math.min(...blueTiles.map(t => t.zIndex));
            // Place red tile just below the lowest blue tile
            return lowestBlueZIndex - 1;
        }
        
        // If no blue tiles found, use default behavior
        return MovableTile.nextZIndex++;
    }

    /**
     * Custom stack update: Ensure red tiles maintain their relative order
     */
    protected updateStackZIndices(stack: TileHexagon[]): void {
        // Get red tiles in the stack
        const redTiles = stack.filter(tile => this.hasHexagon(tile));
        
        // Sort red tiles by their existing z-index to maintain relative order
        redTiles.sort((a, b) => a.zIndex - b.zIndex);
        
        // Update their z-indices to be consecutive while maintaining order
        redTiles.forEach((tile, index) => {
            tile.zIndex = this.determineZIndex(tile, stack.filter(t => t !== tile));
        });
    }
}

export default RedTiles; 