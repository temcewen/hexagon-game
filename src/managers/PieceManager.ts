import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { Beacon } from '../pieces/Beacon.js';
import { Resource } from '../pieces/Resource.js';
import { ShadowPosition } from '../pieces/ShadowPosition.js';
import { Transponder } from '../pieces/Transponder.js';

export class PieceManager {
    private pieces: Map<string, Piece> = new Map();
    
    // Singleton instance
    private static instance: PieceManager | null = null;
    
    // Private constructor to enforce singleton pattern
    private constructor() {
        if (PieceManager.instance) {
            throw new Error('PieceManager instance already exists. Use getInstance() instead of creating a new instance.');
        }
    }
    
    /**
     * Gets the singleton instance of PieceManager
     */
    public static getInstance(): PieceManager {
        if (!PieceManager.instance) {
            PieceManager.instance = new PieceManager();
        }
        return PieceManager.instance;
    }
    
    public getPieces(): Piece[] {
        return Array.from(this.pieces.values());
    }
    
    public getPieceById(id: string): Piece | undefined {
        return this.pieces.get(id);
    }
    
    public addPiece(piece: Piece): void {
        this.pieces.set(piece.id, piece);
    }
    
    public removePiece(piece: Piece): void {
        this.pieces.delete(piece.id);
    }
    
    // Get all pieces at specific axial coordinates
    public getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        return Array.from(this.pieces.values())
            .filter(piece => 
                piece.q === q &&
                piece.r === r &&
                piece.s === s
            )
            .sort((a, b) => a.zIndex - b.zIndex);
    }

    public isPositionBlocked(
        piece: Piece, 
        position: HexCoord, 
        allowEnemyBeacons: boolean = false,
        canMoveIntoEnemyPieces: boolean = false,
        canMoveIntoFriendlyPieces: boolean = false
    ): boolean {
        const piecesAtPosition = this.getPiecesAtPosition(position.q, position.r, position.s);
        
        // Check each piece at the position
        return piecesAtPosition.some(p => {
            // Don't block self
            if (p === piece) return false;
            
            // Always allow beacons, shadow positions, and resources
            if (p instanceof Beacon || p instanceof ShadowPosition || p instanceof Resource) return false;
            
            // Handle enemy pieces
            if (p.playerId !== piece.playerId) {
                return !canMoveIntoEnemyPieces;
            }
            
            // Handle friendly pieces
            return !canMoveIntoFriendlyPieces;
        });
    }

    public getBeaconPathsFromPosition(position: HexCoord): HexCoord[] {
        const piecesAtPosition = this.getPiecesAtPosition(position.q, position.r, position.s);
        const beacon = piecesAtPosition.find(piece => piece instanceof Beacon);
        
        if (beacon) {
            return (beacon as Beacon).FindBeaconsInPath();
        }
        
        return [];
    }
    
    public updatePieceSizes(newHexSize: number, allHexagons: GridHexagon[]): void {
        // Update each piece with the new size and find its corresponding hexagon in the new grid
        for (const piece of this.pieces.values()) {
            const hexagon = allHexagons.find(h => h.q === piece.q && h.r === piece.r && h.s === piece.s);
            if (hexagon) {
                // Update piece with new position and size
                // Beacons are 2.5x, Red pieces are 0.8x, Transponders are 1x, others (blue) are 0.6x
                const isRedPiece = piece instanceof Resource;
                const isTransponder = piece instanceof Transponder;
                const isBeacon = piece instanceof Beacon;
                const sizeRatio = isBeacon ? 1.0 : (isRedPiece ? 0.8 : (isTransponder ? 1.0 : 0.6));
                piece.updateSize(newHexSize, sizeRatio);
                piece.moveTo(hexagon);
            } else {
                // Optional: Handle cases where a piece's hexagon might not exist after resize
                // This could happen if the grid dimensions change significantly.
                console.warn(`Could not find corresponding hexagon for piece at (${piece.q}, ${piece.r}, ${piece.s}) after resize.`);
                // As a fallback, update the size but keep the old coords (which might be off-screen)
                const isRedPiece = piece instanceof Resource;
                const isTransponder = piece instanceof Transponder;
                const isBeacon = piece instanceof Beacon;
                const sizeRatio = isBeacon ? 2.5 : (isRedPiece ? 0.8 : (isTransponder ? 1.0 : 0.6));
                piece.updateSize(newHexSize, sizeRatio);
            }
        }
    }
    
    // Draw all pieces, with optional highlighting of selected piece
    public drawPieces(selectedPiece: Piece | null = null): void {
        // Sort pieces by type first (beacons -> resources -> shadows -> others) and then by z-index
        const sortedPieces = Array.from(this.pieces.values()).sort((a, b) => {
            // Beacons should always be drawn first (lowest z-index)
            if (a instanceof Beacon && !(b instanceof Beacon)) return -1;
            if (b instanceof Beacon && !(a instanceof Beacon)) return 1;
            
            // Resources should be above Beacons but below everything else
            if (a instanceof Resource && !(b instanceof Resource)) {
                return b instanceof Beacon ? 1 : -1;  // 1 if Beacon (go after), -1 if other (go before)
            }
            if (b instanceof Resource && !(a instanceof Resource)) {
                return a instanceof Beacon ? -1 : 1;  // -1 if Beacon (go before), 1 if other (go after)
            }
            
            // Then ShadowPositions
            if (a instanceof ShadowPosition && !(b instanceof ShadowPosition)) return -1;
            if (b instanceof ShadowPosition && !(a instanceof ShadowPosition)) return 1;
            
            // If both pieces are of the same type, sort by z-index
            return a.zIndex - b.zIndex;
        });
        
        // Draw each piece
        sortedPieces.forEach(piece => {
            piece.draw(piece === selectedPiece);
        });
    }
} 