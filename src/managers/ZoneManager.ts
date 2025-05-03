import { HexCoord } from '../Piece.js';
import { ZoneType } from '../Types.js';

export class ZoneManager {
    // Track zone coordinates per player
    private playerZoneCoords: Map<string, Set<string>> = new Map();
    
    // Singleton instance
    private static instance: ZoneManager | null = null;

    private constructor() {
        if (ZoneManager.instance) {
            throw new Error('ZoneManager instance already exists. Use getInstance() instead.');
        }
    }

    /**
     * Gets the singleton instance of ZoneManager
     */
    public static getInstance(): ZoneManager {
        if (!ZoneManager.instance) {
            ZoneManager.instance = new ZoneManager();
        }
        return ZoneManager.instance;
    }

    /**
     * Initializes zone tracking for a player
     */
    public initializePlayerZone(playerId: string): void {
        if (!this.playerZoneCoords.has(playerId)) {
            this.playerZoneCoords.set(playerId, new Set());
        }
    }

    /**
     * Converts a HexCoord to a string representation for storage in Sets
     */
    private coordToString(coord: HexCoord): string {
        return `${coord.q},${coord.r},${coord.s}`;
    }

    /**
     * Adds coordinates to a player's zone
     */
    public addCoordsToZone(coords: HexCoord[], playerId: string): void {
        const playerZones = this.playerZoneCoords.get(playerId);
        if (!playerZones) {
            throw new Error(`No zone set found for player ${playerId}`);
        }

        coords.forEach(coord => {
            playerZones.add(this.coordToString(coord));
        });
    }

    /**
     * Determines the zone type for a given coordinate from a player's perspective
     */
    public getZoneFor(coord: HexCoord, perspectivePlayerId: string): ZoneType {
        const coordStr = this.coordToString(coord);
        
        // Check if the coordinate is in the perspective player's zone
        const inPerspectivePlayerZone = this.playerZoneCoords.get(perspectivePlayerId)?.has(coordStr);
        if (inPerspectivePlayerZone) {
            return ZoneType.Friendly;
        }
        
        // Check if the coordinate is in any other player's zone
        for (const [otherPlayerId, zoneCoords] of this.playerZoneCoords.entries()) {
            if (otherPlayerId !== perspectivePlayerId && zoneCoords.has(coordStr)) {
                return ZoneType.Enemy;
            }
        }
        
        return ZoneType.Neutral;
    }
}
