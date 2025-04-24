export interface HexPosition {
    q: number;
    r: number;
    s: number;
}

export interface BaseHexagon {
    x: number;
    y: number;
    q: number;
    r: number;
    s: number;
}

export interface GridHexagon extends BaseHexagon {
    // Grid-specific properties can be added here
}

export interface TileHexagon extends GridHexagon {
    zIndex: number;
    originalZIndex?: number;  // Store original z-index during drag operations
}

export interface MousePosition {
    x: number;
    y: number;
}

declare global {
    interface HTMLCanvasElement {
        hasMouseDownHandler?: boolean;
    }
}

// Type guard to check if a hexagon is a TileHexagon
export function isTileHexagon(hex: GridHexagon | TileHexagon): hex is TileHexagon {
    return 'zIndex' in hex;
} 