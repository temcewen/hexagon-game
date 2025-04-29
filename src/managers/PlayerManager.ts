import { PieceManager } from './PieceManager.js';
import { Resource } from '../pieces/Resource.js';
import { Commander } from '../pieces/Commander.js';
import { Transponder } from '../pieces/Transponder.js';
import { Mage } from '../pieces/Mage.js';
import { Engineer } from '../pieces/Engineer.js';
import { Berserker } from '../pieces/Berserker.js';
import { Mystic } from '../pieces/Mystic.js';
import { HexGridManager } from './HexGridManager.js';

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
    
    // Singleton instance
    private static instance: PlayerManager | null = null;

    private constructor() {
        if (PlayerManager.instance) {
            throw new Error('PlayerManager instance already exists. Use getInstance() instead of creating a new instance.');
        }
        
        // Generate unique IDs for players
        this.player1Id = crypto.randomUUID();
        this.player2Id = crypto.randomUUID();
        
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

    public async initializeGameState(): Promise<void> {
        if (!this.ctx) {
            throw new Error('PlayerManager has not been initialized with a context. Call initialize() first.');
        }

        if (this.initialized) {
            return;
        }
        else {
            this.initialized = true;
        }
        
        const allHexagons = this.hexGridManager.getAllGridHexagons();
        
        // Player 1 pieces (top of board)
        const player1Positions = {
            resource: { q: -3, r: -4 },
            commander: { q: -1, r: -4 },
            transponder: { q: 1, r: -4 },
            mage: { q: 3, r: -4 },
            engineer: { q: -2, r: -3 },
            berserker: { q: 0, r: -3 },
            mystic: { q: 2, r: -3 }
        };

        // Player 2 pieces (bottom of board)
        const player2Positions = {
            resource: { q: -3, r: 4 },
            commander: { q: -1, r: 4 },
            transponder: { q: 1, r: 4 },
            mage: { q: 3, r: 4 },
            engineer: { q: -2, r: 3 },
            berserker: { q: 0, r: 3 },
            mystic: { q: 2, r: 3 }
        };

        // Create Player 1 pieces
        const p1Resource = allHexagons.find(hex => hex.q === player1Positions.resource.q && hex.r === player1Positions.resource.r);
        const p1Commander = allHexagons.find(hex => hex.q === player1Positions.commander.q && hex.r === player1Positions.commander.r);
        const p1Transponder = allHexagons.find(hex => hex.q === player1Positions.transponder.q && hex.r === player1Positions.transponder.r);
        const p1Mage = allHexagons.find(hex => hex.q === player1Positions.mage.q && hex.r === player1Positions.mage.r);
        const p1Engineer = allHexagons.find(hex => hex.q === player1Positions.engineer.q && hex.r === player1Positions.engineer.r);
        const p1Berserker = allHexagons.find(hex => hex.q === player1Positions.berserker.q && hex.r === player1Positions.berserker.r);
        const p1Mystic = allHexagons.find(hex => hex.q === player1Positions.mystic.q && hex.r === player1Positions.mystic.r);

        // Create Player 2 pieces
        const p2Resource = allHexagons.find(hex => hex.q === player2Positions.resource.q && hex.r === player2Positions.resource.r);
        const p2Commander = allHexagons.find(hex => hex.q === player2Positions.commander.q && hex.r === player2Positions.commander.r);
        const p2Transponder = allHexagons.find(hex => hex.q === player2Positions.transponder.q && hex.r === player2Positions.transponder.r);
        const p2Mage = allHexagons.find(hex => hex.q === player2Positions.mage.q && hex.r === player2Positions.mage.r);
        const p2Engineer = allHexagons.find(hex => hex.q === player2Positions.engineer.q && hex.r === player2Positions.engineer.r);
        const p2Berserker = allHexagons.find(hex => hex.q === player2Positions.berserker.q && hex.r === player2Positions.berserker.r);
        const p2Mystic = allHexagons.find(hex => hex.q === player2Positions.mystic.q && hex.r === player2Positions.mystic.r);

        // Add Player 1 pieces
        if (p1Resource) this.pieceManager.addPiece(new Resource(this.ctx, this.hexSize, p1Resource, this.player1Id));
        if (p1Commander) this.pieceManager.addPiece(new Commander(this.ctx, this.hexSize, p1Commander, this.player1Id));
        if (p1Transponder) this.pieceManager.addPiece(new Transponder(this.ctx, this.hexSize, p1Transponder, this.player1Id));
        if (p1Mage) this.pieceManager.addPiece(new Mage(this.ctx, this.hexSize, p1Mage, this.player1Id));
        if (p1Engineer) this.pieceManager.addPiece(new Engineer(this.ctx, this.hexSize, p1Engineer, this.player1Id));
        if (p1Berserker) this.pieceManager.addPiece(new Berserker(this.ctx, this.hexSize, p1Berserker, this.player1Id));
        if (p1Mystic) this.pieceManager.addPiece(new Mystic(this.ctx, this.hexSize, p1Mystic, this.player1Id));

        // Add Player 2 pieces
        if (p2Resource) this.pieceManager.addPiece(new Resource(this.ctx, this.hexSize, p2Resource, this.player2Id));
        if (p2Commander) this.pieceManager.addPiece(new Commander(this.ctx, this.hexSize, p2Commander, this.player2Id));
        if (p2Transponder) this.pieceManager.addPiece(new Transponder(this.ctx, this.hexSize, p2Transponder, this.player2Id));
        if (p2Mage) this.pieceManager.addPiece(new Mage(this.ctx, this.hexSize, p2Mage, this.player2Id));
        if (p2Engineer) this.pieceManager.addPiece(new Engineer(this.ctx, this.hexSize, p2Engineer, this.player2Id));
        if (p2Berserker) this.pieceManager.addPiece(new Berserker(this.ctx, this.hexSize, p2Berserker, this.player2Id));
        if (p2Mystic) this.pieceManager.addPiece(new Mystic(this.ctx, this.hexSize, p2Mystic, this.player2Id));

        // Determine the client player ID (randomly selecting player1 for now)
        // In a real game, this would come from auth/session/connection data
        this.clientPlayerId = Math.random() > 0.5 ? this.player1Id : this.player2Id;
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
}
