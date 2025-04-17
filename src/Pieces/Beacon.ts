import { Piece } from '../Piece.js';
import { GridHexagon } from '../types.js';

export class Beacon extends Piece {
    private image: HTMLImageElement;
    private rotationDegrees: number;
    public is3D: boolean;
    private readonly SIZE_MULTIPLIER = 2.5;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, rotationDegrees: number = 0, is3D: boolean = false) {
        super(ctx, hexSize, position);
        this.image = new Image();
        this.image.src = is3D ? 'assets/beacon-3.png' : 'assets/beacon-2.png';
        this.rotationDegrees = rotationDegrees;
        this.is3D = is3D;
    }

    public isMovable(): boolean {
        return false; // Beacon cannot be moved
    }

    public draw(isSelected: boolean): void {
        // Save the current context state
        this.ctx.save();

        // Draw the base hexagon
        this.drawHexagonPath();
        if (isSelected) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Set up the transformation for rotation
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotationDegrees * Math.PI / 180);
        
        // Draw the beacon image with size multiplier
        const imageSize = this.hexSize * this.SIZE_MULTIPLIER;
        this.ctx.drawImage(
            this.image, 
            -imageSize / 2,  // Centered x
            -imageSize / 2,  // Centered y
            imageSize, 
            imageSize
        );

        // Restore the context state
        this.ctx.restore();
    }
}
