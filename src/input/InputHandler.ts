import { Point } from '../Piece.js';
import { DragDropManager } from '../managers/DragDropManager.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { HexGridManager } from '../managers/HexGridManager.js';

export class InputHandler {
    private canvas: HTMLCanvasElement;
    private dragDropManager: DragDropManager;
    private forcedSelectionManager: ForcedSelectionManager;
    private hexGridManager: HexGridManager;
    
    constructor(
        canvas: HTMLCanvasElement, 
        dragDropManager: DragDropManager,
        forcedSelectionManager: ForcedSelectionManager,
        hexGridManager: HexGridManager
    ) {
        this.canvas = canvas;
        this.dragDropManager = dragDropManager;
        this.forcedSelectionManager = forcedSelectionManager;
        this.hexGridManager = hexGridManager;
        
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
        if (this.forcedSelectionManager.isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseDown(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseMove(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, ignore mouse movement
        if (this.forcedSelectionManager.isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseMove(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseUp(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, handle selection
        if (this.forcedSelectionManager.isInSelectionMode()) {
            this.forcedSelectionManager.handleClick(mousePos, (point) => {
                return this.hexGridManager.getHexCoordAtPoint(point);
            });
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseUp(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseLeave(): void {
        // If in forced selection mode, ignore mouse leave
        if (this.forcedSelectionManager.isInSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseLeave();
        
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