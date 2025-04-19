import { Point } from '../Piece.js';
import { DragDropManager } from '../managers/DragDropManager.js';
import { BeaconPathManager } from '../managers/BeaconPathManager.js';

export class InputHandler {
    private canvas: HTMLCanvasElement;
    private dragDropManager: DragDropManager;
    private beaconPathManager: BeaconPathManager;
    
    constructor(
        canvas: HTMLCanvasElement, 
        dragDropManager: DragDropManager,
        beaconPathManager: BeaconPathManager
    ) {
        this.canvas = canvas;
        this.dragDropManager = dragDropManager;
        this.beaconPathManager = beaconPathManager;
        
        this.setupEventListeners();
    }
    
    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    private getMousePos(evt: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate the scale between CSS pixels and canvas logical pixels
        const scaleX = (this.canvas.width / dpr) / rect.width;
        const scaleY = (this.canvas.height / dpr) / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }
    
    private handleMouseDown(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in beacon selection mode, delegate to beacon path manager
        if (this.beaconPathManager.isInBeaconSelectionMode()) {
            this.beaconPathManager.handleBeaconSelection(mousePos);
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseDown(mousePos);
    }
    
    private handleMouseMove(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in beacon selection mode, ignore mouse movement
        if (this.beaconPathManager.isInBeaconSelectionMode()) {
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseMove(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseUp(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        // If in beacon selection mode, ignore mouse up except for beacon selection
        if (this.beaconPathManager.isInBeaconSelectionMode()) {
            this.beaconPathManager.handleBeaconSelection(mousePos);
            return;
        }
        
        // Otherwise, delegate to drag drop manager
        this.dragDropManager.handleMouseUp(mousePos);
        
        // Trigger a redraw
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    private handleMouseLeave(): void {
        // If in beacon selection mode, ignore mouse leave
        if (this.beaconPathManager.isInBeaconSelectionMode()) {
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