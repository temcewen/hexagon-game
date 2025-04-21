import { GridHexagon } from './types.js';
import { Piece, HexCoord } from './Piece.js';
import { Beacon } from './Pieces/Beacon.js';
import { HexGridManager } from './managers/HexGridManager.js';
import { TooltipManager } from './managers/TooltipManager.js';
import { PieceManager } from './managers/PieceManager.js';
import { DragDropManager } from './managers/DragDropManager.js';
import { InputHandler } from './input/InputHandler.js';
import { HexagonRenderer } from './renderers/HexagonRenderer.js';
import { BlinkManager } from './managers/BlinkManager.js';
import { ForcedSelectionManager } from './managers/ForcedSelectionManager.js';

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    
    // Component managers
    private hexGridManager: HexGridManager;
    private tooltipManager: TooltipManager;
    private pieceManager: PieceManager;
    private dragDropManager: DragDropManager;
    private forcedSelectionManager: ForcedSelectionManager;
    private hexagonRenderer: HexagonRenderer;
    private blinkManager: BlinkManager;
    private inputHandler: InputHandler;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        
        // Initialize component managers
        this.hexGridManager = new HexGridManager();
        this.tooltipManager = new TooltipManager(canvas);
        this.pieceManager = new PieceManager();
        this.hexagonRenderer = new HexagonRenderer(ctx);
        
        // Initialize managers that depend on other managers
        this.dragDropManager = new DragDropManager(this.hexGridManager, this.pieceManager);
        this.forcedSelectionManager = ForcedSelectionManager.getInstance(this.tooltipManager);
        
        // Initialize input handler with all required managers
        this.inputHandler = new InputHandler(
            canvas, 
            this.dragDropManager,
            this.forcedSelectionManager,
            this.hexGridManager
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
        } else if (!this.forcedSelectionManager.isInSelectionMode()) {
            // Hide tooltip when not in special modes
            this.tooltipManager.hideTooltip();
        }
        
        // Draw beacon path highlights when in beacon selection mode
        if (this.forcedSelectionManager.isInSelectionMode()) {
            this.hexagonRenderer.drawForcedSelectionHighlights(
                this.forcedSelectionManager.getHighlightedTiles(),
                this.hexGridManager.getAllGridHexagons(),
                this.hexGridManager.getGridHexSize(),
                this.forcedSelectionManager.getCurrentOptions()?.highlightColor || "rgba(0, 255, 255, 0.5)"
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
        const connectedBeacons = beacon.FindBeaconsInPath();
        const beaconCoords = connectedBeacons.map(b => ({
            q: b.q,
            r: b.r,
            s: b.s
        }));

        return this.forcedSelectionManager.startForcedSelection(
            piece,
            beaconCoords,
            {
                selectionMessage: "Select a beacon to move to",
                highlightColor: "rgba(0, 255, 255, 0.5)",
                allowCancel: true,
                timeout: 30000,
                onSelection: async (selectedTile) => {
                    const selectedBeacon = connectedBeacons.find(b => 
                        b.q === selectedTile.q && 
                        b.r === selectedTile.r && 
                        b.s === selectedTile.s
                    );
                    if (selectedBeacon) {
                        // Move the piece to the selected beacon
                        const targetHex = this.hexGridManager.findHexagonByCoord(
                            selectedBeacon.q,
                            selectedBeacon.r,
                            selectedBeacon.s
                        );
                        if (targetHex) {
                            piece.moveTo(targetHex);
                            // Trigger a redraw
                            this.canvas.dispatchEvent(new Event('redraw'));
                        }
                    }
                }
            }
        );
    }
    
    // Cleanup on destruction
    public cleanup(): void {
        this.blinkManager.cleanup();
        this.tooltipManager.cleanup();
        this.inputHandler.cleanup();
    }

    public getAllPieces(): Piece[] {
        return this.pieceManager.getPieces();
    }
} 