import { Piece, HexCoord } from '../Piece.js';
import { Resource } from '../Pieces/Resource.js';
import { Transponder } from '../Pieces/Transponder.js';
import { Beacon } from '../Pieces/Beacon.js';
import { GridHexagon } from '../types.js';

export class PieceManager {
    private pieces: Piece[] = [];
    
    constructor() {}
    
    public getPieces(): Piece[] {
        return this.pieces;
    }
    
    public addPiece(piece: Piece): void {
        this.pieces.push(piece);
    }
    
    public removePiece(piece: Piece): void {
        const index = this.pieces.indexOf(piece);
        if (index !== -1) {
            this.pieces.splice(index, 1);
        }
    }
    
    // Get all pieces at specific axial coordinates
    public getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        return this.pieces.filter(piece => 
            piece.q === q &&
            piece.r === r &&
            piece.s === s
        ).sort((a, b) => a.zIndex - b.zIndex);
    }

    public isPositionBlocked(piece: Piece, position: HexCoord): boolean {
        const piecesAtPosition = this.getPiecesAtPosition(position.q, position.r, position.s);
        
        if (piece instanceof Transponder) {
            // Transponder-specific blocking rules
            return piecesAtPosition.some(p => 
                p !== piece && !(p instanceof Beacon)
            );
        }
        
        // Default behavior: only allow beacons to stack
        return piecesAtPosition.some(p => 
            p !== piece && // Don't block self
            !(p instanceof Beacon) // Allow beacons in path
        );
    }

    public getBeaconPathsFromPosition(position: HexCoord): HexCoord[] {
        const piecesAtPosition = this.getPiecesAtPosition(position.q, position.r, position.s);
        const beacon = piecesAtPosition.find(piece => piece instanceof Beacon) as Beacon | undefined;
        
        if (beacon) {
            return beacon.FindBeaconsInPath();
        }
        
        return [];
    }
    
    public updatePieceSizes(newHexSize: number, allHexagons: GridHexagon[]): void {
        // Update each piece with the new size and find its corresponding hexagon in the new grid
        this.pieces.forEach(piece => {
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
        });
    }
    
    // Draw all pieces, with optional highlighting of selected piece
    public drawPieces(selectedPiece: Piece | null = null): void {
        // Sort pieces by z-index
        const sortedPieces = [...this.pieces].sort((a, b) => a.zIndex - b.zIndex);
        
        // Draw each piece
        sortedPieces.forEach(piece => {
            piece.draw(piece === selectedPiece);
        });
    }
} 