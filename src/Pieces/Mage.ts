import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { Transponder } from './Transponder.js';
import { BluePiece } from './BluePiece.js';
import { RedPiece } from './RedPiece.js';

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
            const size = this.hexSize * 1.8; // Make the image slightly larger than the hex
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
                if (piecesAtPosition.length > 0) {
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
            piece instanceof Mage ||
            piece instanceof Transponder ||
            piece instanceof BluePiece ||
            piece instanceof RedPiece
        );

        // If we found a valid piece to swap with
        if (pieceToSwap) {
            // Move the other piece to our original position
            pieceToSwap.moveTo({
                q: fromPosition.q,
                r: fromPosition.r,
                s: fromPosition.s,
                x: 0, // These will be calculated by the game engine
                y: 0
            });
        }
    }
}
