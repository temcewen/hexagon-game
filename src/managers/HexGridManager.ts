import { GridHexagon } from '../Types.js';
import { HexCoord, Point } from '../Piece.js';
import { Piece } from '../Piece.js';

export class HexGridManager {
    private gridHexagons: GridHexagon[] = [];
    private gridHexSize: number = 0;

    constructor() {}

    public setGridHexagons(hexagons: GridHexagon[]): void {
        this.gridHexagons = hexagons;
        if (hexagons.length >= 2) {
            // Calculate grid hexagon size from the first two hexagons
            this.gridHexSize = Math.sqrt(
                Math.pow(hexagons[0].x - hexagons[1].x, 2) +
                Math.pow(hexagons[0].y - hexagons[1].y, 2)
            ) / Math.sqrt(3);
        }
    }

    public getAllGridHexagons(): GridHexagon[] {
        return this.gridHexagons;
    }

    public getGridHexSize(): number {
        return this.gridHexSize;
    }

    public findClosestHexagon(targetX: number, targetY: number): { hexagon: GridHexagon | null, distance: number } {
        let closestHexagon: GridHexagon | null = null;
        let minDistance = Infinity;

        for (const hexagon of this.gridHexagons) {
            const dx = targetX - hexagon.x;
            const dy = targetY - hexagon.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                closestHexagon = hexagon;
            }
        }

        return { hexagon: closestHexagon, distance: minDistance };
    }

    public findHexagonByCoord(q: number, r: number, s: number): GridHexagon | undefined {
        return this.gridHexagons.find(h => 
            h.q === q && h.r === r && h.s === s
        );
    }

    public findHexagonAtPoint(point: Point): GridHexagon | null {
        // Find the grid hexagon that contains this point
        for (const hexagon of this.gridHexagons) {
            const dx = point.x - hexagon.x;
            const dy = point.y - hexagon.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Check if point is within the hexagon's radius
            if (distance <= this.gridHexSize) {
                return hexagon;
            }
        }
        
        return null;
    }

    public getHexCoordAtPoint(point: Point): HexCoord | null {
        // Find the grid hexagon at this point
        const hexagon = this.findHexagonAtPoint(point);
        
        if (hexagon) {
            return {
                q: hexagon.q,
                r: hexagon.r,
                s: hexagon.s
            };
        }
        
        return null;
    }
} 