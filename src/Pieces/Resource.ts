import { GridHexagon } from '../Types.js';
import { Piece } from '../Piece.js';
import { PopupMenu } from '../PopupMenu.js';

export class Resource extends Piece {
    private readonly _isMovable: boolean;
    private popupMenu: PopupMenu;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize * 0.8, position); // Red pieces are 80% the size of grid hexagons
        this.popupMenu = PopupMenu.getInstance();
    }

    public isMovable(): boolean {
        return false;
    }

    public draw(isSelected: boolean): void {
        this.drawHexagonPath();
        
        // Create a linear gradient for the gold effect
        const gradient = this.ctx.createLinearGradient(
            this.x - this.hexSize,
            this.y - this.hexSize,
            this.x + this.hexSize,
            this.y + this.hexSize
        );

        // Base gold color
        const baseGold = '#FFD700';
        const shimmerGold = '#FFF3B0';
        
        // Calculate shimmer position based on time
        const time = (Date.now() % 3000) / 3000; // 3 second cycle
        const shimmerPos = time;
        const shimmerWidth = 0.2; // Width of shimmer effect

        gradient.addColorStop(0, baseGold);
        gradient.addColorStop(Math.max(0, shimmerPos - shimmerWidth), baseGold);
        gradient.addColorStop(shimmerPos, shimmerGold);
        gradient.addColorStop(Math.min(1, shimmerPos + shimmerWidth), baseGold);
        gradient.addColorStop(1, baseGold);

        // Apply the gradient
        this.ctx.fillStyle = gradient;
        this.ctx.fill();

        // Request next frame for animation
        requestAnimationFrame(() => this.draw(isSelected));
    }
    
    // Override canMoveTo to prevent movement to (-5, -1)
    public canMoveTo(q: number, r: number, s: number): boolean {
        // Prevent movement to (-5, -1)
        if (q === -5 && r === -1) {
            return false;
        }
        return true;
    }
} 