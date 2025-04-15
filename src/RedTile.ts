import { GridHexagon } from './types.js';
import { Tile } from './Tile.js';
import { BlueTile } from './BlueTile.js';
import { PopupMenu, PopupMenuItem } from './PopupMenu.js';

export class RedTile extends Tile {
    private readonly _isMovable: boolean;
    private popupMenu: PopupMenu;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize * 0.8, position); // Red tiles are 80% the size of grid hexagons
        this.popupMenu = PopupMenu.getInstance();
    }

    public onDropped(fromPosition: { q: number, r: number, s: number }): void {
        // Convert tile coordinates to screen coordinates for the popup menu
        const canvas = this.ctx.canvas;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate the scale between canvas logical pixels and CSS pixels
        const scaleX = rect.width / (canvas.width / dpr);
        const scaleY = rect.height / (canvas.height / dpr);
        
        // Convert to screen coordinates
        const screenX = rect.left + (this.x * scaleX);
        const screenY = rect.top + (this.y * scaleY);

        const menuItems: PopupMenuItem[] = [
            {
                text: "Destroy",
                callback: () => {
                    // Will implement destroy functionality later
                    console.log("Destroy clicked");
                }
            },
            {
                text: "Cancel",
                callback: () => {
                    // Just close the menu
                    console.log("Cancel clicked");
                }
            }
        ];

        // Show the popup menu at the tile's position
        this.popupMenu.show({ x: screenX, y: screenY }, menuItems);
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