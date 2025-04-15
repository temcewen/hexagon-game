import { GridHexagon } from './types.js';
import { RedTile } from './RedTile.js';

export interface Point {
    x: number;
    y: number;
}

export interface HexCoord {
    q: number;
    r: number;
    s: number;
}

export abstract class Tile {
    public x: number;
    public y: number;
    public q: number;
    public r: number;
    public s: number;
    public zIndex: number;
    public originalZIndex?: number;
    protected hexSize: number;
    protected ctx: CanvasRenderingContext2D;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        this.ctx = ctx;
        this.hexSize = hexSize;
        this.x = position.x;
        this.y = position.y;
        this.q = position.q;
        this.r = position.r;
        this.s = position.s;
        this.zIndex = 0;
    }

    // Default stacking behavior - go on top
    public determineZIndex(existingStack: Tile[]): number {
        return Math.max(...existingStack.map(t => t.zIndex), 0) + 1;
    }

    // Method to check if a point is within this tile
    public containsPoint(point: Point): boolean {
        const dx = point.x - this.x;
        const dy = point.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= this.hexSize * 1.2;
    }

    // Method to move tile to a new position
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

    // Abstract method that each tile type must implement
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

    // Method to determine if the tile can be moved
    public isMovable(): boolean {
        return true; // Default behavior: tiles are movable
    }

    // Optional method for handling click interactions
    public handleClick(mousePos: { x: number, y: number }): void {
        // Base implementation does nothing
    }
} 