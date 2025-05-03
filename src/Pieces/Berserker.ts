import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon, ZoneType } from '../Types.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';
import { PieceManager } from '../managers/PieceManager.js';
import { ShadowPosition } from './ShadowPosition.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { Beacon } from './Beacon.js';
import { Resource } from './Resource.js';
import { PlayerColor } from '../managers/PlayerManager.js';

export class Berserker extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private pieceManager: PieceManager;
    private forcedSelectionManager: ForcedSelectionManager;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string, playerColor: PlayerColor) {
        super(ctx, hexSize, position, playerId);
        
        this.pieceManager = PieceManager.getInstance();
        this.forcedSelectionManager = ForcedSelectionManager.getInstance();
        
        // Load the berserker image
        this.image = new Image();
        this.image.src = 'assets/berserker.png';
        this.image.onload = () => {
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor
            );
            this.imageLoaded = true;
        };
    }

    public async onPlaced(fromPosition: { q: number, r: number, s: number }): Promise<void> {
        let enemyRemoved = false;
        
        // Get all pieces at the current position
        const piecesAtPosition = this.pieceManager.getPiecesAtPosition(this.q, this.r, this.s);
        
        // Find and remove any enemy pieces
        piecesAtPosition.forEach(piece => {
            // Skip if it's our own piece or if it's a beacon/shadow
            if (piece === this || 
                piece.playerId === this.playerId || 
                piece instanceof ShadowPosition ||
                piece instanceof Beacon ||
                piece instanceof Resource) {
                return;
            }
            
            // Remove enemy piece
            this.pieceManager.removePiece(piece);
            enemyRemoved = true;
        });

        // If we removed an enemy piece, allow for a subsequent move
        if (enemyRemoved) {
            const validMoves = this.getValidMoves();
            
            if (validMoves.length > 0) {
                var selectedTile = await this.forcedSelectionManager.startForcedSelection(
                    validMoves,
                    {
                        selectionMessage: "Select where to move the Berserker",
                        highlightColor: "rgba(0, 255, 255, 0.5)",
                        allowCancel: false
                    }
                );

                // Move the berserker to the selected position
                if (selectedTile != null) {
                    const currentPos = { q: this.q, r: this.r, s: this.s };
                    this.setPosition(selectedTile);
                    await this.onPlaced(currentPos);
                }
            }
        }
    }

    public draw(isSelected: boolean): void {
        if (this.isSharingTileWith(Resource) && this.getZone() != ZoneType.Friendly) {
            this.addResourceSpotlight();
        }

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
        return this.getPossibleMovesAnyDirection(2, true, false);
    }

    private setPosition(newPos: HexCoord): void {
        // Get all grid hexagons to find the matching position
        const gridHexagons = this.getGridHexagons();
        const targetHex = gridHexagons.find(hex => 
            hex.q === newPos.q && 
            hex.r === newPos.r && 
            hex.s === newPos.s
        );
        
        if (targetHex) {
            this.moveToGridHex(targetHex);
        } else {
            console.warn('Invalid position selected for Berserker');
        }
    }
}
