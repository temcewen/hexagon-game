import { Point } from '../Piece.js';
import { DragDropManager } from '../managers/DragDropManager.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { HexGridManager } from '../managers/HexGridManager.js';
import { PieceCreationManager } from '../managers/PieceCreationManager.js';
import { PieceCreationMenu } from '../ui/PieceCreationMenu.js';

export class InputHandler {
    private canvas: HTMLCanvasElement;
    private pieceCreationMenu: PieceCreationMenu;
    private pieceCreationManager: PieceCreationManager;
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.pieceCreationMenu = PieceCreationMenu.getInstance();
        this.pieceCreationManager = PieceCreationManager.getInstance();
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
        const dpr = window.devicePixelRatio || 1;
        return {
            x: (e.clientX - rect.left) / (rect.width / (this.canvas.width / dpr)),
            y: (e.clientY - rect.top) / (rect.height / (this.canvas.height / dpr))
        };
    }
    
    private handleMouseDown(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, ignore mouse down
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            return;
        }
        
        // First check if clicking in the piece creation menu
        if (this.pieceCreationMenu.handleMouseDown(mousePos)) {
            // If true, the menu handled it
            this.canvas.dispatchEvent(new Event('redraw'));
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
        
        // Check if we're dragging a new piece from the menu
        if (this.pieceCreationManager.isDragging()) {
            this.pieceCreationManager.handleMouseMove(mousePos);
            this.canvas.dispatchEvent(new Event('redraw'));
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        DragDropManager.getInstance().handleMouseMove(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private async handleMouseUp(e: MouseEvent): Promise<void> {
        const mousePos = this.getMousePos(e);
        
        // If in forced selection mode, handle selection
        if (ForcedSelectionManager.getInstance().isInSelectionMode()) {
            ForcedSelectionManager.getInstance().handleClick(mousePos, (point) => {
                return HexGridManager.getInstance().getHexCoordAtPoint(point);
            });
            return;
        }
        
        // Check if we're dropping a new piece from the menu
        if (this.pieceCreationManager.isDragging()) {
            await this.pieceCreationManager.handleMouseUp(mousePos);
            this.canvas.dispatchEvent(new Event('redraw'));
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
        
        // If dragging a new piece, cancel it
        if (this.pieceCreationManager.isDragging()) {
            this.pieceCreationManager.cancelDrag();
            this.canvas.dispatchEvent(new Event('redraw'));
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