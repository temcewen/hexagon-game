import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';

export class Berserker extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the berserker image
        this.image = new Image();
        this.image.src = 'assets/berserker.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        if (!this.imageLoaded) return;

        // Calculate the size for the image (slightly smaller than hex size)
        const imageSize = this.hexSize * 1.2;  // Adjust this multiplier as needed
        
        // Draw the image centered on the hex position
        this.ctx.drawImage(
            this.image,
            this.x - imageSize / 2,
            this.y - imageSize / 2,
            imageSize,
            imageSize
        );
    }

    public getValidMoves(): HexCoord[] {
        // Use getPossibleMovesAnyDirection with 2 moves
        return this.getPossibleMovesAnyDirection(2);
    }
}
