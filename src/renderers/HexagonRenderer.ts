import { HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';

export class HexagonRenderer {
    private ctx: CanvasRenderingContext2D;
    private readonly BLINK_SPEED_MS: number = 1000; // Blink cycle duration in ms
    
    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }
    
    // Draw a single hexagon at a specific position
    public drawHexagon(x: number, y: number, size: number, fillStyle: string, strokeStyle?: string): void {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const hx = x + size * Math.cos(angle);
            const hy = y + size * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        
        if (fillStyle) {
            this.ctx.fillStyle = fillStyle;
            this.ctx.fill();
        }
        
        if (strokeStyle) {
            this.ctx.strokeStyle = strokeStyle;
            this.ctx.stroke();
        }
    }
    
    // Draw highlights on specified hexagons
    public drawHexagonHighlights(hexCoords: HexCoord[], gridHexagons: GridHexagon[], 
                                gridHexSize: number, highlightColor: string): void {
        for (const hexCoord of hexCoords) {
            // Find the corresponding grid hexagon to get the x,y coordinates
            const hexagon = gridHexagons.find(h => 
                h.q === hexCoord.q && h.r === hexCoord.r && h.s === hexCoord.s
            );
            
            if (hexagon) {
                this.drawHexagon(
                    hexagon.x,
                    hexagon.y,
                    gridHexSize,
                    highlightColor
                );
            }
        }
    }
    
    // Calculate a blinking/pulsing color with changing opacity
    public getBlinkingColor(baseColor: string, minOpacity: number = 0.3, maxOpacity: number = 0.7): string {
        const now = Date.now();
        const phase = (now % this.BLINK_SPEED_MS) / this.BLINK_SPEED_MS;
        const opacityRange = maxOpacity - minOpacity;
        const opacity = minOpacity + Math.sin(phase * Math.PI * 2) * (opacityRange / 2);
        
        // Replace the opacity value in the rgba color string
        return baseColor.replace(/rgba\(([^,]+),([^,]+),([^,]+),[^)]+\)/, 
                                `rgba($1,$2,$3,${opacity})`);
    }
    
    // Draw valid move highlights
    public drawValidMoveHighlights(validMoveHexagons: HexCoord[], gridHexagons: GridHexagon[], 
                                  gridHexSize: number): void {
        if (validMoveHexagons.length === 0) return;
        
        const baseColor = "rgba(0, 255, 0, 0.5)";
        const highlightColor = this.getBlinkingColor(baseColor, 0.3, 0.7);
        
        this.drawHexagonHighlights(validMoveHexagons, gridHexagons, gridHexSize, highlightColor);
    }
    
    // Draw beacon path highlights
    public drawBeaconPathHighlights(beaconPathHighlights: HexCoord[], gridHexagons: GridHexagon[],
                                   gridHexSize: number): void {
        if (beaconPathHighlights.length === 0) return;
        
        const baseColor = "rgba(0, 255, 255, 0.5)";
        const highlightColor = this.getBlinkingColor(baseColor, 0.5, 0.8);
        
        this.drawHexagonHighlights(beaconPathHighlights, gridHexagons, gridHexSize, highlightColor);
    }
} 