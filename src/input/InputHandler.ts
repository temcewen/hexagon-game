import { Point } from '../Piece.js';
import { DragDropManager } from '../managers/DragDropManager.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { HexGridManager } from '../managers/HexGridManager.js';

export class InputHandler {
    private canvas: HTMLCanvasElement;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    private getMousePos(e: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top
        };
    }
    
    private handleMouseDown(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, ignore mouse down
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        DragDropManager.getInstance().handleMouseDown(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseMove(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, ignore mouse movement
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        DragDropManager.getInstance().handleMouseMove(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseUp(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, handle selection
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            ForcedSelectionManager.getInstance().handleClick(mousePos, (point) => {
                return HexGridManager.getInstance().getHexCoordAtPoint(point);
            });
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        DragDropManager.getInstance().handleMouseUp(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseLeave(): void {
        // If in forced selection mode, ignore mouse leave
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        DragDropManager.getInstance().handleMouseLeave();
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    public cleanup(): void {
        // Remove event listeners
        this.canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.removeEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.removeEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
} 