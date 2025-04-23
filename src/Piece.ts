import { GridHexagon } from './Types.js';
import { InteractionManager } from './InteractionManager.js';
import { HexUtils } from './utils/HexUtils.js';

export interface Point {
    x: number;
    y: number;
}

export interface HexCoord {
    q: number;
    r: number;
    s: number;
}

export abstract class Piece {
    private static interactionManager: InteractionManager;

    public static setInteractionManager(manager: InteractionManager): void {
        Piece.interactionManager = manager;
    }

    public readonly id: string;
    public readonly playerId: string;

    public x: number;
    public y: number;
    public q: number;
    public r: number;
    public s: number;
    public zIndex: number;
    public originalZIndex?: number;
    protected hexSize: number;
    protected ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) {
        this.ctx = ctx;
        this.hexSize = hexSize;
        this.x = position.x;
        this.y = position.y;
        this.q = position.q;
        this.r = position.r;
        this.s = position.s;
        this.zIndex = 0;
        this.id = crypto.randomUUID();
        this.playerId = playerId;
    }

    // Optional method for handling drop events
    public onPlaced?(fromPosition: { q: number, r: number, s: number }): void | Promise<void> {
        // Base implementation does nothing.
    }

    // Get all pieces at specific axial coordinates
    protected getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        if (!Piece.interactionManager) {
            console.warn('InteractionManager not set - cannot get pieces at position');
            return [];
        }
        return Piece.interactionManager.getPiecesAtPosition(q, r, s);
    }

    // Get all grid hexagons
    protected getGridHexagons(): GridHexagon[] {
        if (!Piece.interactionManager) {
            console.warn('InteractionManager not set - cannot get grid hexagons');
            return [];
        }
        return Piece.interactionManager.getAllGridHexagons();
    }

    // Default stacking behavior - go on top
    public determineZIndex(existingStack: Piece[]): number {
        return Math.max(...existingStack.map(t => t.zIndex), 0) + 1;
    }

    // Method to check if a point is within this piece
    public containsPoint(point: Point): boolean {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.hexSize * 1.2;
    }

    // Method to move piece to a new position
    public moveTo(position: GridHexagon): void {
        this.x = position.x;
        this.y = position.y;
        this.q = position.q;
        this.r = position.r;
        this.s = position.s;
    }

    // Add this method after the moveTo method
    public getHexSize(): number {
        return this.hexSize;
    }

    public remove(): void {
        if (!Piece.interactionManager) {
            console.warn('InteractionManager not set - cannot remove piece');
            return;
        }
        Piece.interactionManager.removePiece(this);
    }

    // Method to determine if a piece can move to specific coordinates
    public canMoveTo(q: number, r: number, s: number): boolean {
        return this.getValidMoves().some(move => 
            move.q === q && move.r === r && move.s === s
        );
    }

    // New method to get all valid move positions for this piece
    public getValidMoves(): HexCoord[] {
        if (!Piece.interactionManager) {
            console.warn('InteractionManager not set - cannot get valid moves');
            return [];
        }
        
        // Default implementation: can move to any grid hexagon
        return Piece.interactionManager.getAllGridHexagons().map((hex: GridHexagon) => ({
            q: hex.q,
            r: hex.r,
            s: hex.s
        }));
    }

    // Abstract method that each piece type must implement
    public abstract draw(isSelected: boolean): void;

    // Helper method to draw hexagon path (used by child classes)
    protected drawHexagonPath(): void {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const hx = this.x + this.hexSize * Math.cos(angle);
            const hy = this.y + this.hexSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
    }

    public updateSize(newBaseHexSize: number, ratio: number): void {
        this.hexSize = newBaseHexSize * ratio;
    }

    // Method to determine if the piece can be moved
    public isMovable(): boolean {
        return true; // Default behavior: pieces are movable
    }

    protected getPossibleMovesByDirection(
        availableDistance: number, 
        allowEnemyBeacons: boolean = false,
        canMoveIntoEnemyPieces: boolean = false,
        canMoveIntoFriendlyPieces: boolean = false
    ): HexCoord[] {
        // Initialize a set to store unique valid moves
        const validMovesSet = new Set<string>();

        // Helper function to convert HexCoord to string key for the set
        const coordToKey = (coord: HexCoord): string => `${coord.q},${coord.r},${coord.s}`;

        // Helper function to convert string key back to HexCoord
        const keyToCoord = (key: string): HexCoord => {
            const [q, r, s] = key.split(',').map(Number);
            return { q, r, s };
        };

        // Add current position as a valid move
        validMovesSet.add(coordToKey({ q: this.q, r: this.r, s: this.s }));

        // Get valid board coordinates from InteractionManager
        const validBoardHexes = Piece.interactionManager.getAllGridHexagons();

        // Calculate potential moves in all six directions
        for (const dir of HexUtils.DIRECTIONS) {
            // Explore each direction until we hit a blocking piece or reach max distance
            for (let distance = 1; distance <= availableDistance; distance++) {
                const move = {
                    q: this.q + (dir.q * distance),
                    r: this.r + (dir.r * distance),
                    s: this.s + (dir.s * distance)
                };

                // Check if move is on the valid board grid
                const isValidBoardPosition = validBoardHexes.some((hex: GridHexagon) => 
                    hex.q === move.q && hex.r === move.r && hex.s === move.s
                );
                if (!isValidBoardPosition) break; // Stop exploring this direction if we're off the board

                // Check if position is blocked
                if (Piece.interactionManager.isPositionBlocked(this, move, allowEnemyBeacons, canMoveIntoEnemyPieces, canMoveIntoFriendlyPieces)) {
                    break; // Stop exploring this direction if we hit a blocking piece
                }

                // Add valid move to set
                validMovesSet.add(coordToKey(move));
            }
        }

        const finalValidMoves = new Set<string>();

        // Process valid moves and beacon paths
        for (const moveKey of validMovesSet) {
            const move = keyToCoord(moveKey);
            finalValidMoves.add(moveKey);

            // Get pieces at the position to check for beacons
            const piecesAtPosition = this.getPiecesAtPosition(move.q, move.r, move.s);
            
            // Find a beacon by checking if the constructor name is "Beacon" instead of using instanceof
            const beaconAtPosition = piecesAtPosition.find(p => 
                p.constructor.name === "Beacon"
            );
            
            // Only process beacon paths if we found a beacon
            if (beaconAtPosition) {
                // Process beacon paths if a beacon exists at this position
                const beaconPaths = Piece.interactionManager.getBeaconPathsFromPosition(move);
                
                // Add each unblocked beacon path coordinate
                beaconPaths.forEach((pathBeacon) => {
                    const pathKey = coordToKey(pathBeacon);
                    if (!Piece.interactionManager.isPositionBlocked(this, pathBeacon, allowEnemyBeacons, canMoveIntoEnemyPieces, canMoveIntoFriendlyPieces)) {
                        finalValidMoves.add(pathKey);
                    }
                });
            }
        }

        // Convert the final set back to an array of HexCoords
        return Array.from(finalValidMoves).map(keyToCoord);
    }

    protected getPossibleMovesAnyDirection(
        availableDistance: number, 
        allowEnemyBeacons: boolean = false,
        canMoveIntoEnemyPieces: boolean = false,
        canMoveIntoFriendlyPieces: boolean = false
    ): HexCoord[] {
        // Initialize a set to store unique valid moves
        const validMovesSet = new Set<string>();

        // Helper function to convert HexCoord to string key for the set
        const coordToKey = (coord: HexCoord): string => `${coord.q},${coord.r},${coord.s}`;

        // Helper function to convert string key back to HexCoord
        const keyToCoord = (key: string): HexCoord => {
            const [q, r, s] = key.split(',').map(Number);
            return { q, r, s };
        };

        // Get valid board coordinates from InteractionManager
        const validBoardHexes = Piece.interactionManager.getAllGridHexagons();

        // Queue for BFS: [position, remaining moves]
        type QueueItem = { pos: HexCoord; remainingMoves: number };
        const queue: QueueItem[] = [{ 
            pos: { q: this.q, r: this.r, s: this.s }, 
            remainingMoves: availableDistance 
        }];
        
        // Add starting position
        validMovesSet.add(coordToKey({ q: this.q, r: this.r, s: this.s }));

        while (queue.length > 0) {
            const { pos, remainingMoves } = queue.shift()!;
            
            // If no moves left, skip processing this position
            if (remainingMoves <= 0) continue;

            // Try each direction from current position
            for (const dir of HexUtils.DIRECTIONS) {
                const nextMove = {
                    q: pos.q + dir.q,
                    r: pos.r + dir.r,
                    s: pos.s + dir.s
                };

                const moveKey = coordToKey(nextMove);
                
                // Skip if we've already processed this position
                if (validMovesSet.has(moveKey)) continue;

                // Check if move is on the valid board grid
                const isValidBoardPosition = validBoardHexes.some((hex: GridHexagon) => 
                    hex.q === nextMove.q && hex.r === nextMove.r && hex.s === nextMove.s
                );
                if (!isValidBoardPosition) continue;

                // Check if position is blocked
                if (Piece.interactionManager.isPositionBlocked(this, nextMove, allowEnemyBeacons, canMoveIntoEnemyPieces, canMoveIntoFriendlyPieces)) continue;

                // Add valid move to set
                validMovesSet.add(moveKey);

                // Add to queue with one less remaining move
                queue.push({ pos: nextMove, remainingMoves: remainingMoves - 1 });
            }
        }

        const finalValidMoves = new Set<string>();

        // Process valid moves and beacon paths
        for (const moveKey of validMovesSet) {
            const move = keyToCoord(moveKey);
            finalValidMoves.add(moveKey);

            // Get pieces at the position to check for beacons
            const piecesAtPosition = this.getPiecesAtPosition(move.q, move.r, move.s);
            
            // Find a beacon by checking if the constructor name is "Beacon" instead of using instanceof
            const beaconAtPosition = piecesAtPosition.find(p => 
                p.constructor.name === "Beacon"
            );
            
            // Only process beacon paths if we found a beacon
            if (beaconAtPosition) {
                // Process beacon paths if a beacon exists at this position
                const beaconPaths = Piece.interactionManager.getBeaconPathsFromPosition(move);
                
                // Add each unblocked beacon path coordinate
                beaconPaths.forEach((pathBeacon) => {
                    const pathKey = coordToKey(pathBeacon);
                    if (!Piece.interactionManager.isPositionBlocked(this, pathBeacon, allowEnemyBeacons, canMoveIntoEnemyPieces, canMoveIntoFriendlyPieces)) {
                        finalValidMoves.add(pathKey);
                    }
                });
            }
        }

        // Convert the final set back to an array of HexCoords
        return Array.from(finalValidMoves).map(keyToCoord);
    }

    // Optional method for handling click interactions
    public handleClick(mousePos: { x: number, y: number }): void {
        // Base implementation does nothing
    }

    // Method to force moving along a beacon path
    public ForceMoveAlongBeaconPath(beacon: any, allowEnemyBeacons: boolean = false): Promise<HexCoord | null> {
        if (!Piece.interactionManager) {
            console.warn('InteractionManager not set - cannot force move along beacon path');
            return Promise.resolve(null);
        }
        // Pass the call to InteractionManager to avoid circular dependency
        return Piece.interactionManager.ForceMoveAlongBeaconPath(this, beacon, allowEnemyBeacons);
    }
} 