import { GridHexagon } from '../types.js';
import { Piece } from '../Piece.js';
import { BluePiece } from './BluePiece.js';
import { PopupMenu } from '../PopupMenu.js';

export class RedPiece extends Piece {
    private readonly _isMovable: boolean;
    private popupMenu: PopupMenu;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize * 0.8, position); // Red pieces are 80% the size of grid hexagons
        this.popupMenu = PopupMenu.getInstance();
    }

    public draw(isSelected: boolean): void {
        this.drawHexagonPath();
        // If immovable, use a darker shade of red
        this.ctx.fillStyle = isSelected ? 'rgba(255, 0, 0, .6)' : 'red';
        this.ctx.fill();
    }

    // Custom stacking behavior - red pieces always go under blue pieces
    public determineZIndex(existingStack: Piece[]): number {
        // Find blue pieces in the stack
        const bluePieces = existingStack.filter(piece => piece instanceof BluePiece);
        
        if (bluePieces.length > 0) {
            // Find the lowest z-index among blue pieces
            const lowestBlueZIndex = Math.min(...bluePieces.map(t => t.zIndex));
            // Place red piece just below the lowest blue piece
            return lowestBlueZIndex - 1;
        }
        
        // If no blue pieces, use default behavior
        return super.determineZIndex(existingStack);
    }

    // Override canMoveTo to prevent movement to (-5, -1)
    public canMoveTo(q: number, r: number, s: number): boolean {
        // Prevent movement to (-5, -1)
        if (q === -5 && r === -1) {
            return false;
        }
        return true;
    }
} 