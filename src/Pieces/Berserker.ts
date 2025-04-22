import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';

export class Berserker extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private playerManager: PlayerManager;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) {
        super(ctx, hexSize, position, playerId);
        
        // Get the PlayerManager instance
        this.playerManager = PlayerManager.getInstance();
        
        // Load the berserker image
        this.image = new Image();
        this.image.src = 'assets/berserker.png';
        this.image.onload = () => {
            // Get the player's color and recolor the image
            const playerColor = this.playerManager.getPlayerColor(playerId);
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor
            );
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
