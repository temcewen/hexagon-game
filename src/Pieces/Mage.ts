import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { Transponder } from './Transponder.js';
import { BluePiece } from './BluePiece.js';
import { RedPiece } from './RedPiece.js';
import { Beacon } from './Beacon.js';

export class Mage extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/wizard.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        // Draw selection indicator if selected
        if (isSelected) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#ffff00';
            this.drawHexagonPath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw the image if loaded
        if (this.imageLoaded) {
            const size = this.hexSize * 1.5; // Make the image slightly larger than the hex
            this.ctx.drawImage(
                this.image,
                this.x - size / 2,
                this.y - size / 2,
                size,
                size
            );
        }
    }

    public getValidMoves(): HexCoord[] {
        // Get all grid hexagons from parent class
        const allGridHexagons = super.getValidMoves();
        const validMoves: HexCoord[] = [];

        // Check each grid hexagon
        for (const hex of allGridHexagons) {
            // Calculate distance from current position
            const dx = Math.abs(hex.q - this.q);
            const dy = Math.abs(hex.r - this.r);
            const dz = Math.abs(hex.s - this.s);
            const distance = Math.max(dx, dy, dz);

            // Only consider hexes within 6 tiles
            if (distance <= 6) {
                // Check if there are any pieces at this position
                const piecesAtPosition = this.getPiecesAtPosition(hex.q, hex.r, hex.s);
                if (piecesAtPosition.some(p => p.isMovable())) {
                    validMoves.push({
                        q: hex.q,
                        r: hex.r,
                        s: hex.s
                    });
                }
            }
        }

        return validMoves;
    }

    public onDropped(fromPosition: { q: number, r: number, s: number }): void {
        // Get pieces at the new position
        const piecesAtNewPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        
        // Find a piece to swap with (if any)
        const pieceToSwap = piecesAtNewPosition.find(piece => 
            piece.isMovable()
        );

        // If we found a valid piece to swap with
        if (pieceToSwap) {
            // Get the grid hexagon for the original position
            const fromHexagon = this.getGridHexagons().find(hex => 
                hex.q === fromPosition.q && 
                hex.r === fromPosition.r && 
                hex.s === fromPosition.s
            );

            if (fromHexagon) {
                // Move the other piece to our original position with correct x,y coordinates
                pieceToSwap.moveTo(fromHexagon);
            }
        }
    }
}
