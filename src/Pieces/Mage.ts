import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { Beacon } from './Beacon.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { Resource } from './Resource.js';

export class Mage extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private forcedSelectionManager: ForcedSelectionManager;
    private playerManager: PlayerManager;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) {
        super(ctx, hexSize, position, playerId);
        
        // Get the PlayerManager instance to access colors
        this.playerManager = PlayerManager.getInstance();
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/wizard.png';
        this.image.onload = () => {
            // Get the player's color and recolor the image
            const playerColor = this.playerManager.getPlayerColor(playerId);
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor
            );
            this.imageLoaded = true;
        };

        // Get the ForcedSelectionManager instance
        this.forcedSelectionManager = ForcedSelectionManager.getInstance();
    }

    public draw(isSelected: boolean): void {

        if (this.isSharingTileWith(Resource)) {
            this.addResourceSpotlight();
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

    public async onPlaced(fromPosition: { q: number, r: number, s: number }) {
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
                pieceToSwap.moveToGridHex(fromHexagon);

                // Check if either piece landed on a beacon
                const piecesAtOriginalPos = this.getPiecesAtPosition(fromPosition.q, fromPosition.r, fromPosition.s);
                const piecesAtNewPos = this.getPiecesAtPosition(this.q, this.r, this.s);

                // Handle beacons sequentially
                if (piecesAtNewPos.some(p => p instanceof Beacon)) {
                    await this.handleDroppedOnBeacon(this, piecesAtNewPos.find(p => p instanceof Beacon) as Beacon);
                }
                if (piecesAtOriginalPos.some(p => p instanceof Beacon)) {
                    await this.handleDroppedOnBeacon(pieceToSwap, piecesAtOriginalPos.find(p => p instanceof Beacon) as Beacon);
                }
            }
        }
    }

    private async handleDroppedOnBeacon(piece: Piece, beacon: Beacon): Promise<void> {
        // Check if there's only one beacon in path and piece is already on it
        const connectedBeacons = beacon.FindBeaconsInPath();
        if (connectedBeacons.length === 1 && 
            piece.q === beacon.q && 
            piece.r === beacon.r && 
            piece.s === beacon.s) {
            return;
        }
        
        // Start forced selection mode
        await piece.forceMoveAlongBeaconPath(beacon, true);
        await delay(200);
    }
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}