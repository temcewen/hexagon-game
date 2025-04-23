import { GridHexagon } from './Types.js';
import { Piece, HexCoord } from './Piece.js';
import { HexGridManager } from './managers/HexGridManager.js';
import { TooltipManager } from './managers/TooltipManager.js';
import { PieceManager } from './managers/PieceManager.js';
import { DragDropManager } from './managers/DragDropManager.js';
import { InputHandler } from './input/InputHandler.js';
import { HexagonRenderer } from './renderers/HexagonRenderer.js';
import { BlinkManager } from './managers/BlinkManager.js';
import { ForcedSelectionManager } from './managers/ForcedSelectionManager.js';
import { PlayerManager } from './managers/PlayerManager.js';

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    private hexagonRenderer: HexagonRenderer;
    private inputHandler: InputHandler;

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D, hexSize: number) {
        this.canvas = canvas;
        
        // Initialize renderers
        this.hexagonRenderer = new HexagonRenderer(ctx);
        
        // Initialize managers
        const hexGridManager = HexGridManager.getInstance();
        const tooltipManager = TooltipManager.getInstance();
        tooltipManager.setCanvas(canvas);
        const pieceManager = PieceManager.getInstance();
        const dragDropManager = DragDropManager.getInstance();
        const forcedSelectionManager = ForcedSelectionManager.getInstance();
        forcedSelectionManager.setTooltipManager(tooltipManager);
        const playerManager = PlayerManager.getInstance();
        playerManager.initialize(ctx, hexSize);
        
        // Initialize input handler with required managers
        this.inputHandler = new InputHandler(canvas);
        
        // Initialize blink manager with redraw callback
        const blinkManager = BlinkManager.getInstance();
        blinkManager.setCallback(() => {
            if (dragDropManager.getIsDragging() && dragDropManager.getSelectedPiece()) {
                this.draw();
            }
        });
    }

    public addPiece(piece: Piece): void {
        PieceManager.getInstance().addPiece(piece);
    }

    public setGridHexagons(hexagons: GridHexagon[]): void {
        HexGridManager.getInstance().setGridHexagons(hexagons);
        // Initialize game state when grid is set
        PlayerManager.getInstance().initializeGameState();
    }

    public getAllGridHexagons(): GridHexagon[] {
        return HexGridManager.getInstance().getAllGridHexagons();
    }

    public getPiecesAtPosition(q: number, r: number, s: number): Piece[] {
        return PieceManager.getInstance().getPiecesAtPosition(q, r, s);
    }

    public isPositionBlocked(
        piece: Piece, 
        position: HexCoord, 
        allowEnemyBeacons: boolean,
        canMoveIntoEnemyPieces: boolean = false,
        canMoveIntoFriendlyPieces: boolean = false
    ): boolean {
        return PieceManager.getInstance().isPositionBlocked(
            piece, 
            position, 
            allowEnemyBeacons,
            canMoveIntoEnemyPieces,
            canMoveIntoFriendlyPieces
        );
    }

    public getBeaconPathsFromPosition(position: HexCoord): HexCoord[] {
        return PieceManager.getInstance().getBeaconPathsFromPosition(position);
    }

    public draw(): void {
        const pieceManager = PieceManager.getInstance();
        const dragDropManager = DragDropManager.getInstance();
        const forcedSelectionManager = ForcedSelectionManager.getInstance();
        const tooltipManager = TooltipManager.getInstance();
        const hexGridManager = HexGridManager.getInstance();
        
        // Draw all pieces
        pieceManager.drawPieces(dragDropManager.getSelectedPiece());
        
        // Draw valid move highlights when dragging
        if (dragDropManager.getIsDragging() && dragDropManager.getSelectedPiece()) {
            this.hexagonRenderer.drawValidMoveHighlights(
                dragDropManager.getValidMoveHexagons(),
                hexGridManager.getAllGridHexagons(),
                hexGridManager.getGridHexSize()
            );
            
            // Show drag and drop tooltip
            tooltipManager.showTooltip('Drag to a valid highlighted position');
        } else if (!forcedSelectionManager.isInSelectionMode()) {
            // Hide tooltip when not in special modes
            tooltipManager.hideTooltip();
        }
        
        // Draw beacon path highlights when in beacon selection mode
        if (forcedSelectionManager.isInSelectionMode()) {
            this.hexagonRenderer.drawForcedSelectionHighlights(
                forcedSelectionManager.getHighlightedTiles(),
                hexGridManager.getAllGridHexagons(),
                hexGridManager.getGridHexSize(),
                forcedSelectionManager.getCurrentOptions()?.highlightColor || "rgba(0, 255, 255, 0.5)"
            );
        }
    }

    public updatePieceSizes(newHexSize: number, allHexagons: GridHexagon[]): void {
        PieceManager.getInstance().updatePieceSizes(newHexSize, allHexagons);
    }

    public removePiece(piece: Piece): void {
        PieceManager.getInstance().removePiece(piece);
        this.canvas.dispatchEvent(new Event('redraw'));
    }
    
    // Method to force piece to move along a beacon path
    public async ForceMoveAlongBeaconPath(piece: Piece, beacon: any, allowEnemyBeacons: boolean = false): Promise<HexCoord | null> {
        var connectedBeacons = beacon.FindBeaconsInPath();
        
        const beaconCoords = connectedBeacons.map((b: any) => ({
            q: b.q,
            r: b.r,
            s: b.s
        }));

        // If there are no valid beacons, return early
        if (beaconCoords.length === 0) {
            return Promise.resolve(null);
        }

        const forcedSelectionManager = ForcedSelectionManager.getInstance();
        const hexGridManager = HexGridManager.getInstance();

        return forcedSelectionManager.startForcedSelection(
            beaconCoords,
            {
                selectionMessage: "Select a beacon to move to",
                highlightColor: "rgba(0, 255, 255, 0.5)",
                allowCancel: true,
                timeout: 30000,
                onSelection: async (selectedTile) => {
                    const selectedBeacon = connectedBeacons.find((b: any) => 
                        b.q === selectedTile.q && 
                        b.r === selectedTile.r && 
                        b.s === selectedTile.s
                    );
                    if (selectedBeacon) {
                        // Move the piece to the selected beacon
                        const targetHex = hexGridManager.findHexagonByCoord(
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
        BlinkManager.getInstance().cleanup();
        TooltipManager.getInstance().cleanup();
        this.inputHandler.cleanup();
    }

    public getAllPieces(): Piece[] {
        return PieceManager.getInstance().getPieces();
    }
} 