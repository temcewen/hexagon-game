import { Piece } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { HexCoord } from '../Piece.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';

export class Commander extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private playerManager: PlayerManager;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) {
        super(ctx, hexSize, position, playerId);
        
        // Get the PlayerManager instance
        this.playerManager = PlayerManager.getInstance();
        
        // Load the commander image
        this.image = new Image();
        this.image.src = 'assets/commander-icon.png';
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
