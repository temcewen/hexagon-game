import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { HexUtils } from '../utils/HexUtils.js';

export class Beacon extends Piece {
    private image: HTMLImageElement;
    private rotationDegrees: number;
    public is3D: boolean;
    private readonly SIZE_MULTIPLIER = 2.5;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, rotationDegrees: number = 0, is3D: boolean = false) {
        super(ctx, hexSize, position);
        this.image = new Image();
        this.image.src = is3D ? 'assets/beacon-3.png' : 'assets/beacon-2.png';
        this.rotationDegrees = rotationDegrees;
        this.is3D = is3D;
    }

    public isMovable(): boolean {
        return false; // Beacon cannot be moved
    }

    public draw(isSelected: boolean): void {
        // Save the current context state
        this.ctx.save();

        // Draw the base hexagon
        this.drawHexagonPath();
        if (isSelected) {
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 3;
            this.ctx.stroke();
        }

        // Set up the transformation for rotation
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotationDegrees * Math.PI / 180);
        
        // Draw the beacon image with size multiplier
        const imageSize = this.hexSize * this.SIZE_MULTIPLIER;
        this.ctx.drawImage(
            this.image, 
            -imageSize / 2,  // Centered x
            -imageSize / 2,  // Centered y
            imageSize, 
            imageSize
        );

        // Restore the context state
        this.ctx.restore();
    }

    private normalizeRotation(degrees: number): number {
        return ((degrees % 360) + 360) % 360;  // Ensures positive value between 0-359
    }

    private getDirectionFromDegrees(degrees: number): number {
        // Convert degrees to closest 60-degree increment (0 = up, 60 = up-right, etc.)
        const normalizedDegrees = this.normalizeRotation(degrees);
        return Math.round(normalizedDegrees / 60) % 6;
    }

    private getValidDirections(): number[] {
        const baseDirection = this.getDirectionFromDegrees(this.rotationDegrees);
        
        if (this.is3D) {
            // For 3D beacons: opposite, left, and right of pointing direction
            const oppositeDir = (baseDirection + 3) % 6;
            const leftDir = (baseDirection + 2) % 6;
            const rightDir = (baseDirection + 4) % 6;
            return [oppositeDir, leftDir, rightDir];
        } else {
            // For 2D beacons: pointing direction and opposite direction
            const oppositeDir = (baseDirection + 3) % 6;
            return [baseDirection, oppositeDir];
        }
    }

    private getNeighborCoordinates(direction: number): HexCoord {
        return HexUtils.getCoordinateInDirection({
            q: this.q,
            r: this.r,
            s: this.s,
        }, direction);
    }

    private IsValidBeaconPathTile(coord: HexCoord, pieces: Piece[]): Boolean {
        if (!super.canMoveTo(coord.q, coord.r, coord.s)) {
            return false;
        }
        else if (pieces.length == 0 || (pieces.length == 1 && pieces[0] instanceof Beacon)) {
            return true;
        }
        return false;
    }

    public FindBeaconsInPath(): Beacon[] {
        const visited = new Set<string>();
        const result: Beacon[] = [];
        const queue: Beacon[] = [this];
        
        const positionKey = (q: number, r: number, s: number) => `${q},${r},${s}`;
        visited.add(positionKey(this.q, this.r, this.s));

        while (queue.length > 0) {
            const currentBeacon = queue.shift()!;
            result.push(currentBeacon);

            const validDirections = currentBeacon.getValidDirections();

            for (const direction of validDirections) {
                var neighborCoord = currentBeacon.getNeighborCoordinates(direction);
                var key = positionKey(neighborCoord.q, neighborCoord.r, neighborCoord.s);
                
                if (visited.has(key)) continue;

                // Get pieces at the neighbor position
                var piecesAtPosition = this.getPiecesAtPosition(
                    neighborCoord.q,
                    neighborCoord.r,
                    neighborCoord.s
                );

                while (this.IsValidBeaconPathTile(neighborCoord, piecesAtPosition)) {

                    if (visited.has(key)) {
                        neighborCoord = HexUtils.getCoordinateInDirection(neighborCoord, direction);
                        key = positionKey(neighborCoord.q, neighborCoord.r, neighborCoord.s);
                        piecesAtPosition = this.getPiecesAtPosition(
                            neighborCoord.q,
                            neighborCoord.r,
                            neighborCoord.s
                        );
                    }
                    
                    // Check if there's exactly one piece and it's a beacon
                    if (piecesAtPosition.length === 1 && piecesAtPosition[0] instanceof Beacon) {
                        const nextBeacon = piecesAtPosition[0] as Beacon;
                        visited.add(key);
                        queue.push(nextBeacon);
                        break;
                    }

                    
                    neighborCoord = HexUtils.getCoordinateInDirection(neighborCoord, direction);
                    key = positionKey(neighborCoord.q, neighborCoord.r, neighborCoord.s);
                    piecesAtPosition = this.getPiecesAtPosition(
                        neighborCoord.q,
                        neighborCoord.r,
                        neighborCoord.s
                    );
                }

            }
        }

        return result;
    }
}
