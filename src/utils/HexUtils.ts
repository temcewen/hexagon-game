import { HexCoord } from '../Piece.js';

export class HexUtils {
    // Directions array for hex grid navigation, starting from Up and going clockwise
    public static readonly DIRECTIONS: HexCoord[] = [
        { q: 0, r: 1, s: -1 },  // Up
        { q: 1, r: 0, s: -1 },  // Up-Right
        { q: 1, r: -1, s: 0 },  // Down-Right
        { q: 0, r: -1, s: 1 },  // Down
        { q: -1, r: 0, s: 1 },  // Down-Left
        { q: -1, r: 1, s: 0 }   // Up-Left
    ];

    /**
     * Gets the coordinate of the neighboring hex in the specified direction
     * @param coord Starting coordinate
     * @param direction Direction index (0-5, where 0 is Up, proceeding clockwise)
     * @returns New coordinate in the specified direction
     */
    public static getCoordinateInDirection(coord: HexCoord, direction: number): HexCoord {
        const normalizedDirection = ((direction % 6) + 6) % 6;  // Ensure direction is 0-5
        const dir = HexUtils.DIRECTIONS[normalizedDirection];
        return {
            q: coord.q + dir.q,
            r: coord.r + dir.r,
            s: coord.s + dir.s
        };
    }

    /**
     * Validates if the coordinates follow the rule q + r + s = 0
     * @param coord Coordinate to validate
     * @returns true if the coordinate is valid
     */
    public static isValidHexCoord(coord: HexCoord): boolean {
        return coord.q + coord.r + coord.s === 0;
    }

    /**
     * Creates a string key from hex coordinates for use in Sets/Maps
     * @param coord Hex coordinate
     * @returns String representation of the coordinate
     */
    public static coordToKey(coord: HexCoord): string {
        return `${coord.q},${coord.r},${coord.s}`;
    }
} 