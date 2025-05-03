import { PieceManager } from './PieceManager.js';
import { HexCoord } from '../Piece.js';
import { Resource } from '../pieces/Resource.js';
import { Commander } from '../pieces/Commander.js';
import { Transponder } from '../pieces/Transponder.js';
import { Mage } from '../pieces/Mage.js';
import { Engineer } from '../pieces/Engineer.js';
import { Berserker } from '../pieces/Berserker.js';
import { Mystic } from '../pieces/Mystic.js';
import { HexGridManager } from './HexGridManager.js';
import { Piece } from '../Piece.js';
import { ZoneType } from '../Types.js';
import { ZoneManager } from './ZoneManager.js';

export type PlayerColor = 'lightblue' | 'lightgreen' | 'pink' | 'purple' | 'yellow' | 'darkorange';

export class PlayerManager {
    private initialized: boolean = false;
    private ctx: CanvasRenderingContext2D | null = null;
    private hexSize: number = 0;
    private readonly player1Id: string;
    private readonly player2Id: string;
    private clientPlayerId: string | null = null;
    private playerColors: Map<string, PlayerColor> = new Map();
    private availableColors: PlayerColor[] = ['lightblue', 'lightgreen', 'pink', 'purple', 'yellow', 'darkorange'];
    
    // Track zone coordinates per player
    private playerZoneCoords: Map<string, Set<string>> = new Map();
    
    // Singleton instance
    private static instance: PlayerManager | null = null;

    private constructor() {
        if (PlayerManager.instance) {
            throw new Error('PlayerManager instance already exists. Use getInstance() instead of creating a new instance.');
        }
        
        // Generate unique IDs for players
        this.player1Id = crypto.randomUUID();
        this.player2Id = crypto.randomUUID();
        
        // Initialize zone tracking for each player
        const zoneManager = ZoneManager.getInstance();
        zoneManager.initializePlayerZone(this.player1Id);
        zoneManager.initializePlayerZone(this.player2Id);
        
        // Assign random colors to players
        this.assignRandomColors();
    }
    
    /**
     * Gets the singleton instance of PlayerManager
     */
    public static getInstance(): PlayerManager {
        if (!PlayerManager.instance) {
            PlayerManager.instance = new PlayerManager();
        }
        return PlayerManager.instance;
    }
    
    public initialize(ctx: CanvasRenderingContext2D, hexSize: number): void {
        this.ctx = ctx;
        this.hexSize = hexSize;
    }

    private assignRandomColors(): void {
        // Shuffle the colors array
        for (let i = this.availableColors.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.availableColors[i], this.availableColors[j]] = [this.availableColors[j], this.availableColors[i]];
        }
        
        // Assign the first two colors to the players
        this.playerColors.set(this.player1Id, this.availableColors[0]);
        this.playerColors.set(this.player2Id, this.availableColors[1]);
    }
    
    private get pieceManager(): PieceManager {
        return PieceManager.getInstance();
    }
    
    private get hexGridManager(): HexGridManager {
        return HexGridManager.getInstance();
    }

    /**
     * Converts a HexCoord to a string representation for storage in Sets
     */
    private coordToString(coord: HexCoord): string {
        return `${coord.q},${coord.r},${coord.s}`;
    }

    /**
     * Extracts coordinates from piece positions array
     */
    private extractCoords(piecePositions: Array<{ type: any, position: HexCoord }>): HexCoord[] {
        return piecePositions.map(piece => piece.position);
    }

    /**
     * Determines the zone type for a given coordinate from a player's perspective
     */
    public getZoneFor(coord: HexCoord, playerId?: string): ZoneType {
        // If no playerId is provided, use client player's perspective (for UI coloring)
        const perspectivePlayerId = playerId || this.clientPlayerId;
        if (!perspectivePlayerId) {
            throw new Error('No player perspective available for zone determination');
        }

        return ZoneManager.getInstance().getZoneFor(coord, perspectivePlayerId);
    }

    public async initializeGameState(): Promise<void> {
        if (!this.ctx) {
            throw new Error('PlayerManager has not been initialized with a context. Call initialize() first.');
        }

        if (this.initialized) {
            return;
        }

        // Determine the client player ID (randomly selecting player1 for now)
        // In a real game, this would come from auth/session/connection data
        this.clientPlayerId = Math.random() > 0.5 ? this.player1Id : this.player2Id;
        
        this.initialized = true;
        
        // Create pieces for Player 1 at the top-right corner (6, 0)
        this.addPiecesToBottomMiddle(this.player1Id);

        // Create pieces for Player 2 at the bottom-middle corner (0, -6)
        this.addPiecesToTopMiddle(this.player2Id);
    }

    public getPlayer1Id(): string {
        return this.player1Id;
    }

    public getPlayer2Id(): string {
        return this.player2Id;
    }

    public getClientPlayer(): string {
        if (!this.clientPlayerId) {
            throw new Error("Client player ID not set. Make sure initializeGameState has completed.");
        }
        return this.clientPlayerId;
    }
    
    public getPlayerColor(playerId: string): PlayerColor {
        const color = this.playerColors.get(playerId);
        if (!color) {
            throw new Error(`No color assigned to player with ID: ${playerId}`);
        }
        return color;
    }

    public getClientPlayerColor(): PlayerColor {
        return this.getPlayerColor(this.getClientPlayer());
    }

    public getAllPlayerIds(): string[] {
        return [this.player1Id, this.player2Id];
    }
    
    public getPlayerName(playerId: string): string {
        if (playerId === this.player1Id) {
            return "Player 1";
        } else if (playerId === this.player2Id) {
            return "Player 2";
        }
        return "Unknown Player";
    }

    /**
     * Creates a piece at the specified position
     * @private
     */
    private createPieceAtPosition(
        pieceType: typeof Resource | typeof Commander | typeof Transponder | typeof Mage | 
                 typeof Engineer | typeof Berserker | typeof Mystic,
        position: HexCoord,
        playerId: string
    ): Piece | null {
        if (!this.ctx) {
            throw new Error('PlayerManager has not been initialized with a context. Call initialize() first.');
        }
        
        const hexGridManager = this.hexGridManager;
        const gridHex = hexGridManager.getGridHexagonAtCoord(position.q, position.r, position.s);
        
        if (!gridHex) {
            console.warn(`No grid hexagon found at position (${position.q}, ${position.r}, ${position.s})`);
            return null;
        }
        
        const hexSize = hexGridManager.getGridHexSize();
        let piece: Piece | null = null;
        
        // Get the player's color
        const playerColor = this.getPlayerColor(playerId);
        
        switch (pieceType.name) {
            case Resource.name:
                piece = new Resource(this.ctx, hexSize, gridHex, playerId);
                break;
            case Commander.name:
                piece = new Commander(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
            case Transponder.name:
                piece = new Transponder(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
            case Mage.name:
                piece = new Mage(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
            case Engineer.name:
                piece = new Engineer(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
            case Berserker.name:
                piece = new Berserker(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
            case Mystic.name:
                piece = new Mystic(this.ctx, hexSize, gridHex, playerId, playerColor);
                break;
        }
        
        if (piece) {
            
            // Update getZoneAt to use the piece's playerId
            piece.getZoneAt = (coord: HexCoord) => {
                return this.getZoneFor(coord, piece.playerId);
            };

            // Add the piece using the piece manager.
            this.pieceManager.addPiece(piece);
        }
        
        return piece;
    }

    /**
     * Add pieces to the top-middle corner (0,6)
     */
    private addPiecesToTopMiddle(playerId: string): Piece[] {
        console.log(`Adding pieces to top-middle corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for top-middle corner (0,6)
        const piecePositions = [
            { type: Resource, position: { q: -1, r: 6, s: -5 } },
            { type: Resource, position: { q: 0, r: 6, s: -6 } },
            { type: Resource, position: { q: 1, r: 5, s: -6 } },
            { type: Commander, position: { q: 0, r: 5, s: -5 } },
            { type: Berserker, position: { q: 0, r: 4, s: -4 } },
            { type: Transponder, position: { q: 2, r: 4, s: -6 } },
            { type: Mage, position: { q: 1, r: 4, s: -5 } },
            { type: Mystic, position: { q: -1, r: 5, s: -4 } },
            { type: Engineer, position: { q: -2, r: 6, s: -4 } }
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for top-middle corner`);
        return pieces;
    }
    
    /**
     * Add pieces to the top-right corner (6,0)
     */
    private addPiecesToTopRight(playerId: string): Piece[] {
        console.log(`Adding pieces to top-right corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for top-right corner (6,0) based on the provided snapshot
        const piecePositions = [
            { type: Resource, position: { q: 6, r: -1, s: -5 } },
            { type: Resource, position: { q: 6, r: 0, s: -6 } },
            { type: Resource, position: { q: 5, r: 1, s: -6 } },
            { type: Commander, position: { q: 5, r: 0, s: -5 } },
            { type: Berserker, position: { q: 4, r: 0, s: -4 } },
            { type: Transponder, position: { q: 6, r: -2, s: -4 } },
            { type: Mage, position: { q: 5, r: -1, s: -4 } },
            { type: Mystic, position: { q: 4, r: 1, s: -5 } },
            { type: Engineer, position: { q: 4, r: 2, s: -6 } }
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for top-right corner`);
        return pieces;
    }
    
    /**
     * Add pieces to the bottom-right corner (6,-6)
     */
    private addPiecesToBottomRight(playerId: string): Piece[] {
        console.log(`Adding pieces to bottom-right corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for bottom-right corner (6,-6)
        const piecePositions = [
            { type: Resource, position: { q: 6, r: -5, s: -1 } },
            { type: Resource, position: { q: 6, r: -6, s: 0 } },
            { type: Resource, position: { q: 5, r: -6, s: 1 } },
            { type: Commander, position: { q: 5, r: -5, s: 0 } },
            { type: Berserker, position: { q: 4, r: -4, s: 0 } },
            { type: Engineer, position: { q: 6, r: -4, s: -2 } },
            { type: Mystic, position: { q: 5, r: -4, s: -1 } },
            { type: Mage, position: { q: 4, r: -5, s: 1 } },
            { type: Transponder, position: { q: 4, r: -6, s: 2 } }
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for bottom-right corner`);
        return pieces;
    }
    
    /**
     * Add pieces to the bottom-middle corner (0,-6)
     */
    private addPiecesToBottomMiddle(playerId: string): Piece[] {
        console.log(`Adding pieces to bottom-middle corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for bottom-middle corner (0,-6)
        const piecePositions = [
            { type: Resource, position: { q: -1, r: -5, s: 6 } },
            { type: Resource, position: { q: 0, r: -6, s: 6 } },
            { type: Resource, position: { q: 1, r: -6, s: 5 } },
            { type: Commander, position: { q: 0, r: -5, s: 5 } },
            { type: Berserker, position: { q: 0, r: -4, s: 4 } },
            { type: Engineer, position: { q: 2, r: -6, s: 4 } },
            { type: Mystic, position: { q: 1, r: -5, s: 4 } },
            { type: Mage, position: { q: -1, r: -4, s: 5 } },
            { type: Transponder, position: { q: -2, r: -4, s: 6 } }
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for bottom-middle corner`);
        return pieces;
    }
    
    /**
     * Add pieces to the bottom-left corner (-6,0)
     */
    private addPiecesToBottomLeft(playerId: string): Piece[] {
        console.log(`Adding pieces to bottom-left corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for bottom-left corner, mirroring top-right positions by piece type
        const piecePositions = [
            { type: Resource, position: { q: -6, r: 1, s: 5 } },      // Mirrors Resource at (6, -1, -5)
            { type: Resource, position: { q: -6, r: 0, s: 6 } },      // Mirrors Resource at (6, 0, -6)
            { type: Resource, position: { q: -5, r: -1, s: 6 } },     // Mirrors Resource at (5, 1, -6)
            { type: Commander, position: { q: -5, r: 0, s: 5 } },     // Mirrors Commander at (5, 0, -5)
            { type: Berserker, position: { q: -4, r: 0, s: 4 } },     // Mirrors Berserker at (4, 0, -4)
            { type: Transponder, position: { q: -6, r: 2, s: 4 } },   // Mirrors Transponder at (6, -2, -4)
            { type: Mage, position: { q: -5, r: 1, s: 4 } },          // Mirrors Mage at (5, -1, -4)
            { type: Mystic, position: { q: -4, r: -1, s: 5 } },       // Mirrors Mystic at (4, 1, -5)
            { type: Engineer, position: { q: -4, r: -2, s: 6 } }      // Mirrors Engineer at (4, 2, -6)
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for bottom-left corner`);
        return pieces;
    }
    
    /**
     * Add pieces to the top-left corner (-6,6)
     */
    private addPiecesToTopLeft(playerId: string): Piece[] {
        console.log(`Adding pieces to top-left corner for player ${playerId}`);
        const pieces: Piece[] = [];
        
        // Hardcoded positions for top-left corner, mirroring bottom-right positions by piece type
        const piecePositions = [
            { type: Resource, position: { q: -6, r: 5, s: 1 } },      // Mirrors Resource at (6, -5, -1)
            { type: Resource, position: { q: -6, r: 6, s: 0 } },      // Mirrors Resource at (6, -6, 0)
            { type: Resource, position: { q: -5, r: 6, s: -1 } },     // Mirrors Resource at (5, -6, 1)
            { type: Commander, position: { q: -5, r: 5, s: 0 } },     // Mirrors Commander at (5, -5, 0)
            { type: Berserker, position: { q: -4, r: 4, s: 0 } },     // Mirrors Berserker at (4, -4, 0)
            { type: Engineer, position: { q: -6, r: 4, s: 2 } },      // Mirrors Engineer at (6, -4, -2)
            { type: Mystic, position: { q: -5, r: 4, s: 1 } },        // Mirrors Mystic at (5, -4, -1)
            { type: Mage, position: { q: -4, r: 5, s: -1 } },         // Mirrors Mage at (4, -5, 1)
            { type: Transponder, position: { q: -4, r: 6, s: -2 } }   // Mirrors Transponder at (4, -6, 2)
        ];

        // Add coordinates to appropriate zone using ZoneManager
        ZoneManager.getInstance().addCoordsToZone(this.extractCoords(piecePositions), playerId);
        
        for (const pieceInfo of piecePositions) {
            const piece = this.createPieceAtPosition(pieceInfo.type, pieceInfo.position, playerId);
            if (piece) pieces.push(piece);
        }
        
        console.log(`Created ${pieces.length} pieces for top-left corner`);
        return pieces;
    }
}
