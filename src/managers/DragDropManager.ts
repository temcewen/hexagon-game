import { Point, Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { HexGridManager } from './HexGridManager.js';
import { PieceManager } from './PieceManager.js';
import { InteractionType } from '../InteractionType.js';

export class DragDropManager {
    private selectedPiece: Piece | null = null;
    private isDragging: boolean = false;
    private dragOffset: Point = { x: 0, y: 0 };
    private dragStartPos: Point = { x: 0, y: 0 };
    private mouseDownTime: number = 0;
    private mouseDownPos: Point = { x: 0, y: 0 };
    private validMoveHexagons: HexCoord[] = [];
    
    private readonly CLICK_THRESHOLD_MS: number = 200; // Max time for a click
    private readonly CLICK_DISTANCE_THRESHOLD: number = 5; // Max distance for a click
    
    private hexGridManager: HexGridManager;
    private pieceManager: PieceManager;
    
    constructor(hexGridManager: HexGridManager, pieceManager: PieceManager) {
        this.hexGridManager = hexGridManager;
        this.pieceManager = pieceManager;
    }
    
    public getSelectedPiece(): Piece | null {
        return this.selectedPiece;
    }
    
    public getIsDragging(): boolean {
        return this.isDragging;
    }
    
    public getValidMoveHexagons(): HexCoord[] {
        return this.validMoveHexagons;
    }
    
    // Handle mouse down - potential start of drag or click
    public handleMouseDown(mousePos: Point): void {
        this.mouseDownTime = Date.now();
        this.mouseDownPos = mousePos;
        
        // Sort pieces by z-index in descending order to check top pieces first
        const sortedPieces = [...this.pieceManager.getPieces()].sort((a, b) => b.zIndex - a.zIndex);
        
        for (const piece of sortedPieces) {
            if (piece.containsPoint(mousePos)) {
                this.selectedPiece = piece;
                // Don't set isDragging immediately - wait to see if it's a click or drag
                this.dragOffset = {
                    x: mousePos.x - piece.x,
                    y: mousePos.y - piece.y
                };
                this.dragStartPos = {
                    x: piece.x,
                    y: piece.y
                };
                break;
            }
        }
    }
    
    // Handle mouse move - continue drag if started
    public handleMouseMove(mousePos: Point): void {
        if (!this.selectedPiece) return;

        const dx = mousePos.x - this.mouseDownPos.x;
        const dy = mousePos.y - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If we've moved beyond the threshold, it's a drag
        if (!this.isDragging && distance > this.CLICK_DISTANCE_THRESHOLD && this.selectedPiece.isMovable()) {
            this.isDragging = true;
            // Store original z-index and set a very high z-index during drag
            this.selectedPiece.originalZIndex = this.selectedPiece.zIndex;
            this.selectedPiece.zIndex = 99999; // Extremely high z-index during drag
            console.log('Interaction type:', InteractionType.DRAG);
            
            // Get valid moves when starting to drag
            this.validMoveHexagons = this.selectedPiece.getValidMoves();
        }

        if (this.isDragging) {
            this.selectedPiece.x = mousePos.x - this.dragOffset.x;
            this.selectedPiece.y = mousePos.y - this.dragOffset.y;
        }
    }
    
    // Handle mouse up - end drag or trigger click
    public handleMouseUp(mousePos: Point): boolean {
        if (!this.selectedPiece) return false;

        const timeDiff = Date.now() - this.mouseDownTime;
        const dx = mousePos.x - this.mouseDownPos.x;
        const dy = mousePos.y - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        let pieceInteracted = false;

        if (!this.isDragging && timeDiff < this.CLICK_THRESHOLD_MS && distance <= this.CLICK_DISTANCE_THRESHOLD) {
            // It's a click!
            console.log('Interaction type:', InteractionType.CLICK);
            if (this.selectedPiece.handleClick) {
                this.selectedPiece.handleClick(mousePos);
                pieceInteracted = true;
            }
        } else if (this.isDragging) {
            // Handle drag end
            const targetX = mousePos.x - this.dragOffset.x;
            const targetY = mousePos.y - this.dragOffset.y;

            // Find closest grid hexagon
            const { hexagon: closestHexagon, distance: minDistance } = 
                this.hexGridManager.findClosestHexagon(targetX, targetY);

            if (closestHexagon && minDistance <= this.selectedPiece.getHexSize()) {
                // Find other pieces at this position
                const piecesAtPosition = this.pieceManager.getPiecesAtPosition(
                    closestHexagon.q, closestHexagon.r, closestHexagon.s
                ).filter(piece => piece !== this.selectedPiece);

                // Store original position before moving
                const fromPosition = {
                    q: this.selectedPiece.q,
                    r: this.selectedPiece.r,
                    s: this.selectedPiece.s
                };

                // Check if the move is allowed
                if (!this.selectedPiece.canMoveTo(closestHexagon.q, closestHexagon.r, closestHexagon.s)) {
                    // Return to starting position if move is not allowed
                    this.returnPieceToStart();
                } else {
                    // Move piece to new position
                    this.selectedPiece.moveTo(closestHexagon);
     
                    // Check if the position actually changed
                    if (fromPosition.q !== closestHexagon.q ||
                        fromPosition.r !== closestHexagon.r ||
                        fromPosition.s !== closestHexagon.s) {
                        // Call onDropped only if the position changed
                        if (this.selectedPiece.onDropped) {
                            this.selectedPiece.onDropped(fromPosition);
                            pieceInteracted = true;
                        }
                    }

                    // Restore original z-index before recalculating new z-index
                    if (this.selectedPiece.originalZIndex !== undefined) {
                        this.selectedPiece.zIndex = this.selectedPiece.originalZIndex;
                        this.selectedPiece.originalZIndex = undefined;
                    }

                    // Update z-index based on piece's stacking rules
                    this.selectedPiece.zIndex = this.selectedPiece.determineZIndex(piecesAtPosition);
                }
            } else {
                // Return to starting position if not dropped on a valid hexagon
                this.returnPieceToStart();
            }
            
            pieceInteracted = true;
        }

        this.cleanupDragState();
        return pieceInteracted;
    }
    
    // Handle mouse leave - cancel drag operation
    public handleMouseLeave(): void {
        if (this.isDragging && this.selectedPiece) {
            this.returnPieceToStart();
            this.cleanupDragState();
        }
    }
    
    // Return piece to its starting position
    private returnPieceToStart(): void {
        if (!this.selectedPiece) return;
        
        this.selectedPiece.x = this.dragStartPos.x;
        this.selectedPiece.y = this.dragStartPos.y;
        
        // Restore original z-index if it was stored
        if (this.selectedPiece.originalZIndex !== undefined) {
            this.selectedPiece.zIndex = this.selectedPiece.originalZIndex;
            this.selectedPiece.originalZIndex = undefined;
        }
    }
    
    // Clean up the drag state
    private cleanupDragState(): void {
        this.isDragging = false;
        this.selectedPiece = null;
        this.validMoveHexagons = [];
    }
} 