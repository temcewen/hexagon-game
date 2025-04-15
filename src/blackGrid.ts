import { GridHexagon } from './types.js';

class BlackGrid {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private hexSize: number;
    private hexHeight: number;
    private hexWidth: number;
    private horizontalSpacing: number;
    private verticalSpacing: number;
    private hexagons: GridHexagon[];

    constructor(canvas: HTMLCanvasElement, hexSize: number) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = context;
        this.hexSize = hexSize;
        this.hexHeight = Math.sqrt(3) * hexSize;
        this.hexWidth = hexSize * 2;
        this.horizontalSpacing = 0.87 * this.hexWidth;
        this.verticalSpacing = 0.87 * this.hexHeight;
        this.hexagons = [];
    }

    private drawHexagon(x: number, y: number): void {
        this.ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = 2 * Math.PI / 6 * i;
            const hx = x + this.hexSize * Math.cos(angle);
            const hy = y + this.hexSize * Math.sin(angle);
            if (i === 0) {
                this.ctx.moveTo(hx, hy);
            } else {
                this.ctx.lineTo(hx, hy);
            }
        }
        this.ctx.closePath();
        this.ctx.fillStyle = 'black';
        this.ctx.fill();
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();
    }

    public createGrid(): void {
        const gridRadius = 7;
        const centerX = this.canvas.width / (window.devicePixelRatio || 1) / 2;
        const centerY = this.canvas.height / (window.devicePixelRatio || 1) / 2;

        for (let q = -gridRadius + 1; q < gridRadius; q++) {
            for (let r = -gridRadius + 1; r < gridRadius; r++) {
                const s = -q - r;
                
                if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) < gridRadius) {
                    const x = centerX + this.verticalSpacing * q;
                    const y = centerY + this.horizontalSpacing * (-r - q/2);
                    
                    this.hexagons.push({ x, y, q, r, s });
                }
            }
        }
    }

    public draw(): void {
        this.hexagons.forEach(hexagon => {
            this.drawHexagon(hexagon.x, hexagon.y);
        });
    }

    public getHexagons(): GridHexagon[] {
        return this.hexagons;
    }

    public updateHexSize(newHexSize: number): void {
        this.hexSize = newHexSize;
        this.hexHeight = Math.sqrt(3) * newHexSize;
        this.hexWidth = newHexSize * 2;
        this.horizontalSpacing = 0.87 * this.hexWidth;
        this.verticalSpacing = 0.87 * this.hexHeight;
        this.hexagons = []; // Clear existing hexagons, they will be recreated with createGrid()
    }
}

export default BlackGrid; 