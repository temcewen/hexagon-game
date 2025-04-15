import { GridHexagon } from './types.js';
import { Point, Piece } from './Piece.js';
import { RedPiece } from './Pieces/RedPiece.js';
import { BluePiece } from './Pieces/BluePiece.js';
import { Transponder } from './Pieces/Transponder.js';
import { InteractionType } from './InteractionType.js';

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private pieces: Piece[];
    private selectedPiece: Piece | null;
    private isDragging: boolean;
    private dragOffset: Point;
    private dragStartPos: Point;
    private gridHexagons: GridHexagon[];
    private mouseDownTime: number;
    private mouseDownPos: Point;
    private readonly CLICK_THRESHOLD_MS: number = 200; // Max time for a click
    private readonly CLICK_DISTANCE_THRESHOLD: number = 5; // Max distance for a click

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.pieces = [];
        this.selectedPiece = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };
        this.gridHexagons = [];
        this.mouseDownTime = 0;
        this.mouseDownPos = { x: 0, y: 0 };

        this.setupEventListeners();
    }

    public addPiece(piece: Piece): void {
        this.pieces.push(piece);
    }

    public setGridHexagons(hexagons: GridHexagon[]): void {
        this.gridHexagons = hexagons;
    }

    // Get all pieces at specific axial coordinates
    public getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        return this.pieces.filter(piece => 
            piece.q === q &&
            piece.r === r &&
            piece.s === s
        ).sort((a, b) => a.zIndex - b.zIndex);
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
        this.mouseDownTime = Date.now();
        this.mouseDownPos = mousePos;
        
        // Sort pieces by z-index in descending order to check top pieces first
        const sortedPieces = [...this.pieces].sort((a, b) => b.zIndex - a.zIndex);
        
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

    private handleMouseMove(e: MouseEvent): void {
        if (!this.selectedPiece) return;

        const mousePos = this.getMousePos(e);
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
        }

        if (this.isDragging) {
            this.selectedPiece.x = mousePos.x - this.dragOffset.x;
            this.selectedPiece.y = mousePos.y - this.dragOffset.y;
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (!this.selectedPiece) return;

        const mousePos = this.getMousePos(e);
        const timeDiff = Date.now() - this.mouseDownTime;
        const dx = mousePos.x - this.mouseDownPos.x;
        const dy = mousePos.y - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!this.isDragging && timeDiff < this.CLICK_THRESHOLD_MS && distance <= this.CLICK_DISTANCE_THRESHOLD) {
            // It's a click!
            console.log('Interaction type:', InteractionType.CLICK);
            if (this.selectedPiece.handleClick) {
                this.selectedPiece.handleClick(mousePos);
            }
        } else if (this.isDragging) {
            // Handle drag end
            const targetX = mousePos.x - this.dragOffset.x;
            const targetY = mousePos.y - this.dragOffset.y;

            // Find closest grid hexagon
            let closestHexagon: GridHexagon | null = null;
            let minDistance = Infinity;

            for (const hexagon of this.gridHexagons) {
                const dx = targetX - hexagon.x;
                const dy = targetY - hexagon.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestHexagon = hexagon;
                }
            }

            if (closestHexagon && minDistance <= this.selectedPiece.getHexSize()) {
                // Find other pieces at this position
                const piecesAtPosition = this.pieces.filter(piece => 
                    piece !== this.selectedPiece &&
                    piece.q === closestHexagon!.q &&
                    piece.r === closestHexagon!.r &&
                    piece.s === closestHexagon!.s
                );

                // Store original position before moving
                const fromPosition = {
                    q: this.selectedPiece.q,
                    r: this.selectedPiece.r,
                    s: this.selectedPiece.s
                };

                // Check if the move is allowed
                if (!this.selectedPiece.canMoveTo(closestHexagon.q, closestHexagon.r, closestHexagon.s)) {
                    // Return to starting position if move is not allowed
                    this.selectedPiece.x = this.dragStartPos.x;
                    this.selectedPiece.y = this.dragStartPos.y;
                    
                    // Restore original z-index if it was stored
                    if (this.selectedPiece.originalZIndex !== undefined) {
                        this.selectedPiece.zIndex = this.selectedPiece.originalZIndex;
                        this.selectedPiece.originalZIndex = undefined;
                    }

                    // Reset drag state
                    this.isDragging = false;
                    this.selectedPiece = null;
                    return;
                }

                // Move piece to new position
                this.selectedPiece.moveTo(closestHexagon);
 
                // Check if the position actually changed
                if (fromPosition.q !== closestHexagon.q ||
                    fromPosition.r !== closestHexagon.r ||
                    fromPosition.s !== closestHexagon.s) {
                    // Call onDropped only if the position changed
                    if (this.selectedPiece.onDropped) {
                        this.selectedPiece.onDropped(fromPosition);
                    }
                }

                // Restore original z-index before recalculating new z-index
                if (this.selectedPiece.originalZIndex !== undefined) {
                    this.selectedPiece.zIndex = this.selectedPiece.originalZIndex;
                    this.selectedPiece.originalZIndex = undefined;
                }

                // Update z-index based on piece's stacking rules
                this.selectedPiece.zIndex = this.selectedPiece.determineZIndex(piecesAtPosition);
            } else {
                // Return to starting position if not dropped on a valid hexagon
                this.selectedPiece.x = this.dragStartPos.x;
                this.selectedPiece.y = this.dragStartPos.y;
            }
        }

        this.isDragging = false;
        this.selectedPiece = null;
    }

    private handleMouseLeave(): void {
        if (this.isDragging && this.selectedPiece) {
            // Return to starting position
            this.selectedPiece.x = this.dragStartPos.x;
            this.selectedPiece.y = this.dragStartPos.y;
            this.isDragging = false;
            this.selectedPiece = null;
        }
    }

    public draw(): void {
        // Sort pieces by z-index
        const sortedPieces = [...this.pieces].sort((a, b) => a.zIndex - b.zIndex);
        
        // Draw each piece
        sortedPieces.forEach(piece => {
            piece.draw(piece === this.selectedPiece);
        });
    }

    public updatePieceSizes(newHexSize: number, leftHexagons: GridHexagon[], rightHexagons: GridHexagon[]): void {
        // Store existing pieces
        const existingPieces = [...this.pieces];
        
        // Clear current pieces
        this.pieces = [];
        
        // Combine all hexagons for position matching
        const allHexagons = [...leftHexagons, ...rightHexagons];
        
        // Recreate pieces with new sizes and positions
        existingPieces.forEach(piece => {
            const isRedPiece = piece instanceof RedPiece;
            const isTransponder = piece instanceof Transponder;
            
            // Find the corresponding hexagon position from all hexagons
            const hexagon = allHexagons.find(h => h.q === piece.q && h.r === piece.r && h.s === piece.s);
            if (hexagon) {
                // Update piece with new position and size
                // Red pieces are 0.8x, Transponders are 1x, others (blue) are 0.6x
                const sizeRatio = isRedPiece ? 0.8 : (isTransponder ? 1.0 : 0.6);
                piece.updateSize(newHexSize, sizeRatio);
                piece.moveTo(hexagon);
                this.pieces.push(piece);
            }
        });
    }
} 