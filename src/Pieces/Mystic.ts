import { Piece } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { HexCoord } from '../Piece.js';

export class Mystic extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/eye.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        if (!this.imageLoaded) return;

        // Save the current context state
        this.ctx.save();

        // Calculate image dimensions (make it slightly smaller than the hex)
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

    public getValidMoves(): HexCoord[] {
        // Use getPossibleMovesAnyDirection with 2 moves
        return this.getPossibleMovesAnyDirection(2);
    }
}
