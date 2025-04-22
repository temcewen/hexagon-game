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
    private pieceManager: PieceManager;
    private hexGridManager: HexGridManager;
    private ctx: CanvasRenderingContext2D;
    private hexSize: number;
    private readonly player1Id: string;
    private readonly player2Id: string;
    private clientPlayerId: string | null = null;
    private playerColors: Map<string, PlayerColor> = new Map();
    private availableColors: PlayerColor[] = ['lightblue', 'lightgreen', 'pink', 'purple', 'yellow', 'darkorange'];
    
    // Singleton instance
    private static instance: PlayerManager | null = null;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, pieceManager: PieceManager, hexGridManager: HexGridManager) {
        this.ctx = ctx;
        this.hexSize = hexSize;
        this.pieceManager = pieceManager;
        this.hexGridManager = hexGridManager;
        // Generate unique IDs for players
        this.player1Id = crypto.randomUUID();
        this.player2Id = crypto.randomUUID();
        
        // Assign random colors to players
        this.assignRandomColors();
        
        // Store instance for singleton pattern
        PlayerManager.instance = this;
    }
    
    /**
     * Gets the singleton instance of PlayerManager
     * @throws Error if getInstance is called before the manager is initialized
     */
    public static getInstance(): PlayerManager {
        if (!PlayerManager.instance) {
            throw new Error('PlayerManager has not been initialized yet. Make sure it is created before calling getInstance.');
        }
        return PlayerManager.instance;
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

    public async initializeGameState(): Promise<void> {
        const allHexagons = this.hexGridManager.getAllGridHexagons();
        
        // Find specific hexagons for initial piece placement
        const initialResourceHex = allHexagons.find(hex => hex.q === -6 && hex.r === 0);
        const initialBlueHex = allHexagons.find(hex => hex.q === 6 && hex.r === 0);
        const initialTransponderHex = allHexagons.find(hex => hex.q === 0 && hex.r === -6);
        const initialMageHex = allHexagons.find(hex => hex.q === 0 && hex.r === 0);
        const initialEngineerHex = allHexagons.find(hex => hex.q === 2 && hex.r === 4);
        const initialBerserkerHex = allHexagons.find(hex => hex.q === 3 && hex.r === 0);
        const initialMysticHex = allHexagons.find(hex => hex.q === 1 && hex.r === -3);

        if (initialResourceHex) {
            const resourcePiece = new Resource(this.ctx, this.hexSize, initialResourceHex, this.player1Id);
            this.pieceManager.addPiece(resourcePiece);
        }

        if (initialBlueHex) {
            const commander = new Commander(this.ctx, this.hexSize, initialBlueHex, this.player2Id);
            this.pieceManager.addPiece(commander);
        }

        if (initialTransponderHex) {
            const transponder = new Transponder(this.ctx, this.hexSize, initialTransponderHex, this.player1Id);
            this.pieceManager.addPiece(transponder);
        }

        if (initialMageHex) {
            const mage = new Mage(this.ctx, this.hexSize, initialMageHex, this.player2Id);
            this.pieceManager.addPiece(mage);
        }

        if (initialEngineerHex) {
            const engineer = new Engineer(this.ctx, this.hexSize, initialEngineerHex, this.player1Id);
            this.pieceManager.addPiece(engineer);
        }

        if (initialBerserkerHex) {
            const berserker = new Berserker(this.ctx, this.hexSize, initialBerserkerHex, this.player2Id);
            this.pieceManager.addPiece(berserker);
        }

        if (initialMysticHex) {
            const mystic = new Mystic(this.ctx, this.hexSize, initialMysticHex, this.player2Id);
            this.pieceManager.addPiece(mystic);
        }

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
}
