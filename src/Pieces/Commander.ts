import { Piece } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { HexCoord } from '../Piece.js';

export class Commander extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the commander image
        this.image = new Image();
        this.image.src = 'assets/commander-icon.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        if (!this.imageLoaded) return;

        // Calculate the size for the image (slightly smaller than hex)
        const imageSize = this.hexSize * 1.5;
        
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
        // Commander can move 1 space in any direction
        return this.getPossibleMovesAnyDirection(1);
    }
}
