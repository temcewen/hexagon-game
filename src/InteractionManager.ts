import { GridHexagon } from './types.js';
import { Point, Piece, HexCoord } from './Piece.js';
import { Resource } from './Pieces/Resource.js';
import { Transponder } from './Pieces/Transponder.js';
import { InteractionType } from './InteractionType.js';
import { Beacon } from './Pieces/Beacon.js';
import { HexGridManager } from './managers/HexGridManager.js';
import { TooltipManager } from './managers/TooltipManager.js';
import { PieceManager } from './managers/PieceManager.js';
import { DragDropManager } from './managers/DragDropManager.js';
import { BeaconPathManager } from './managers/BeaconPathManager.js';
import { InputHandler } from './input/InputHandler.js';
import { HexagonRenderer } from './renderers/HexagonRenderer.js';
import { BlinkManager } from './managers/BlinkManager.js';

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    
    // Component managers
    private hexGridManager: HexGridManager;
    private tooltipManager: TooltipManager;
    private pieceManager: PieceManager;
    private dragDropManager: DragDropManager;
    private beaconPathManager: BeaconPathManager;
    private inputHandler: InputHandler;
    private hexagonRenderer: HexagonRenderer;
    private blinkManager: BlinkManager;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Initialize component managers
        this.hexGridManager = new HexGridManager();
        this.tooltipManager = new TooltipManager(canvas);
        this.pieceManager = new PieceManager();
        this.hexagonRenderer = new HexagonRenderer(ctx);
        
        // Initialize managers that depend on other managers
        this.dragDropManager = new DragDropManager(this.hexGridManager, this.pieceManager);
        this.beaconPathManager = new BeaconPathManager(this.hexGridManager, this.tooltipManager);
        
        // Initialize input handler
        this.inputHandler = new InputHandler(
            canvas, 
            this.dragDropManager,
            this.beaconPathManager
        );
        
        // Initialize blink manager with redraw callback
        this.blinkManager = new BlinkManager(() => {
            if (this.dragDropManager.getIsDragging() && this.dragDropManager.getSelectedPiece()) {
                this.draw();
            }
        });
    }

    public addPiece(piece: Piece): void {
        this.pieceManager.addPiece(piece);
    }

    public setGridHexagons(hexagons: GridHexagon[]): void {
        this.hexGridManager.setGridHexagons(hexagons);
    }

    public getAllGridHexagons(): GridHexagon[] {
        return this.hexGridManager.getAllGridHexagons();
    }

    public getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        return this.pieceManager.getPiecesAtPosition(q, r, s);
    }

    public isPositionBlocked(piece: Piece, position: HexCoord): boolean {
        return this.pieceManager.isPositionBlocked(piece, position);
    }

    public getBeaconPathsFromPosition(position: HexCoord): HexCoord[] {
        return this.pieceManager.getBeaconPathsFromPosition(position);
    }

    public draw(): void {
        // Draw all pieces
        this.pieceManager.drawPieces(this.dragDropManager.getSelectedPiece());
        
        // Draw valid move highlights when dragging
        if (this.dragDropManager.getIsDragging() && this.dragDropManager.getSelectedPiece()) {
            this.hexagonRenderer.drawValidMoveHighlights(
                this.dragDropManager.getValidMoveHexagons(),
                this.hexGridManager.getAllGridHexagons(),
                this.hexGridManager.getGridHexSize()
            );
            
            // Show drag and drop tooltip
            this.tooltipManager.showTooltip('Drag to a valid highlighted position');
        } else if (!this.beaconPathManager.isInBeaconSelectionMode()) {
            // Hide tooltip when not in special modes
            this.tooltipManager.hideTooltip();
        }
        
        // Draw beacon path highlights when in beacon selection mode
        if (this.beaconPathManager.isInBeaconSelectionMode()) {
            this.hexagonRenderer.drawBeaconPathHighlights(
                this.beaconPathManager.getBeaconPathHighlights(),
                this.hexGridManager.getAllGridHexagons(),
                this.hexGridManager.getGridHexSize()
            );
        }
    }

    public updatePieceSizes(newHexSize: number, allHexagons: GridHexagon[]): void {
        this.pieceManager.updatePieceSizes(newHexSize, allHexagons);
    }

    public removePiece(piece: Piece): void {
        this.pieceManager.removePiece(piece);
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    // Method to force piece to move along a beacon path
    public async ForceMoveAlongBeaconPath(piece: Piece, beacon: Beacon): Promise<void> {
        return this.beaconPathManager.forceMoveAlongBeaconPath(piece, beacon);
    }
    
    // Cleanup on destruction
    public cleanup(): void {
        this.blinkManager.cleanup();
        this.tooltipManager.cleanup();
        this.inputHandler.cleanup();
    }
} 