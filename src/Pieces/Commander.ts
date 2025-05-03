import { Piece } from '../Piece.js';
import { GridHexagon, ZoneType } from '../Types.js';
import { HexCoord } from '../Piece.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';
import { Resource } from './Resource.js';
import { PlayerColor } from '../managers/PlayerManager.js';

export class Commander extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string, playerColor: PlayerColor) {
        super(ctx, hexSize, position, playerId);
        
        // Load the commander image
        this.image = new Image();
        this.image.src = 'assets/commander-icon.png';
        this.image.onload = () => {
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor,
                .35
            );
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        if (this.isSharingTileWith(Resource) && this.getZone() != ZoneType.Friendly) {
            this.addResourceSpotlight();
        }

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
