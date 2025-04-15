import { GridHexagon } from './types.js';
import { Tile } from './Tile.js';
import { BlueTile } from './BlueTile.js';

export class RedTile extends Tile {
    private readonly _isMovable: boolean;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize * 0.8, position); // Red tiles are 80% the size of grid hexagons
    }

    public draw(isSelected: boolean): void {
        this.drawHexagonPath();
        // If immovable, use a darker shade of red
        this.ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, .6)' : 'red';
        this.ctx.fill();
    }

    // Custom stacking behavior - red tiles always go under blue tiles
    public determineZIndex(existingStack: Tile[]): number {
        // Find blue tiles in the stack
        const blueTiles = existingStack.filter(tile => tile instanceof BlueTile);
        
        if (blueTiles.length > 0) {
            // Find the lowest z-index among blue tiles
            const lowestBlueZIndex = Math.min(...blueTiles.map(t => t.zIndex));
            // Place red tile just below the lowest blue tile
            return lowestBlueZIndex - 1;
        }
        
        // If no blue tiles, use default behavior
        return super.determineZIndex(existingStack);
    }
} 