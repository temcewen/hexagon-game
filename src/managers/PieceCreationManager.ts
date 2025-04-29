import { Piece } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { HexGridManager } from './HexGridManager.js';
import { PieceManager } from './PieceManager.js';
import { PlayerManager } from './PlayerManager.js';
import { PlayerSelectionDialog } from '../ui/PlayerSelectionDialog.js';
import { InteractionManager } from '../InteractionManager.js';

export class PieceCreationManager {
    private static instance: PieceCreationManager | null = null;
    private ctx: CanvasRenderingContext2D | null = null;
    private hexSize: number = 0;
    private isDraggingNewPiece: boolean = false;
    private newPieceType: any = null;
    private newPieceX: number = 0;
    private newPieceY: number = 0;
    private previewPiece: Piece | null = null;
    private readonly TEMP_PLAYER_ID = "preview";
    
    private hexGridManager: HexGridManager;
    private pieceManager: PieceManager;
    private playerManager: PlayerManager;
    private playerSelectionDialog: PlayerSelectionDialog | null = null;
    private interactionManager: InteractionManager;
    
    // Cache valid drop locations to avoid recalculating them on every frame
    private validDropLocations: { hex: GridHexagon, canPlace: boolean }[] = [];
    private recalculateDropLocations: boolean = true;
    
    private constructor() {
        this.hexGridManager = HexGridManager.getInstance();
        this.pieceManager = PieceManager.getInstance();
        this.playerManager = PlayerManager.getInstance();
        this.interactionManager = InteractionManager.getInstance();
        // Don't initialize playerSelectionDialog until needed
    }
    
    public static getInstance(): PieceCreationManager {
        if (!PieceCreationManager.instance) {
            PieceCreationManager.instance = new PieceCreationManager();
        }
        return PieceCreationManager.instance;
    }
    
    public initialize(ctx: CanvasRenderingContext2D, hexSize: number): void {
        this.ctx = ctx;
        this.hexSize = hexSize;
    }
    
    public startDraggingNewPiece(
        pieceType: new (ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) => Piece,
        mousePos: { x: number, y: number },
        menuHexSize: number
    ): void {
        this.isDraggingNewPiece = true;
        this.newPieceType = pieceType;
        this.newPieceX = mousePos.x;
        this.newPieceY = mousePos.y;
        
        // Create a temporary preview piece
        const tempPosition: GridHexagon = {
            x: mousePos.x,
            y: mousePos.y,
            q: 0,
            r: 0,
            s: 0
        };
        
        try {
            // Use player1's ID for preview coloring
            const previewPlayerId = this.playerManager.getPlayer1Id();
            // Create preview piece with a size more appropriate for the game board
            this.previewPiece = new pieceType(this.ctx!, this.hexSize, tempPosition, previewPlayerId);
            console.log(`Created dragging preview for ${pieceType.name}`);
            
            // Special handling for Mystic
            if (pieceType.name === 'Mystic' && this.previewPiece) {
                // Force imageLoaded for preview
                (this.previewPiece as any).imageLoaded = true;
                
                // Create a simple circle as a fallback image
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = 64;
                tempCanvas.height = 64;
                const tempCtx = tempCanvas.getContext('2d')!;
                
                // Draw a purple circle
                tempCtx.fillStyle = '#8a2be2'; // BlueViolet
                tempCtx.beginPath();
                tempCtx.arc(32, 32, 28, 0, Math.PI * 2);
                tempCtx.fill();
                
                // Add an eye symbol
                tempCtx.fillStyle = '#fff';
                tempCtx.beginPath();
                tempCtx.ellipse(32, 32, 16, 8, 0, 0, Math.PI * 2);
                tempCtx.fill();
                tempCtx.fillStyle = '#000';
                tempCtx.beginPath();
                tempCtx.arc(32, 32, 6, 0, Math.PI * 2);
                tempCtx.fill();
                
                // Set the image
                (this.previewPiece as any).image = tempCanvas;
            }
        } catch (error) {
            console.error("Error creating piece preview:", error);
            this.previewPiece = null;
        }
    }
    
    public handleMouseMove(mousePos: { x: number, y: number }): void {
        if (this.isDraggingNewPiece && this.previewPiece) {
            this.newPieceX = mousePos.x;
            this.newPieceY = mousePos.y;
            
            // Update preview piece position
            this.previewPiece.x = mousePos.x;
            this.previewPiece.y = mousePos.y;
        }
    }
    
    public async handleMouseUp(mousePos: { x: number, y: number }): Promise<boolean> {
        console.log("PieceCreationManager.handleMouseUp called", mousePos);
        
        if (!this.isDraggingNewPiece || !this.previewPiece) {
            console.log("Not dragging or no preview piece");
            return false;
        }
        
        // Check if dropped on a valid grid position
        const hexCoord = this.hexGridManager.getHexCoordAtPoint(mousePos);
        console.log("Dropped at hex coord:", hexCoord);
        
        if (!hexCoord) {
            // Not dropped on grid, cancel
            console.log("Not dropped on grid");
            this.cancelDrag();
            return false;
        }
        
        // Get the grid hexagon at this position - find it from all grid hexagons
        const gridHex = this.hexGridManager.getAllGridHexagons().find(
            hex => hex.q === hexCoord.q && hex.r === hexCoord.r && hex.s === hexCoord.s
        );
        
        console.log("Found grid hex:", gridHex);
        
        if (!gridHex) {
            // No valid grid hexagon, cancel
            console.log("No valid grid hexagon found");
            this.cancelDrag();
            return false;
        }
        
        // Get pieces at this position - validate it's empty or has only compatible pieces
        const piecesAtPosition = this.pieceManager.getPiecesAtPosition(hexCoord.q, hexCoord.r, hexCoord.s);
        console.log("Pieces at position:", piecesAtPosition.length);
        
        const hasIncompatiblePiece = piecesAtPosition.some(p => {
            // Currently we'll only allow placing on empty tiles or tiles with certain pieces
            // This is a simplified check - you might need more complex logic
            const isCompatible = ['Resource', 'ShadowPosition'].includes(p.constructor.name);
            console.log("Found piece:", p.constructor.name, "compatible:", isCompatible);
            return !isCompatible;
        });
        
        if (hasIncompatiblePiece) {
            // Cannot place here due to other pieces
            console.log("Position has incompatible pieces");
            this.cancelDrag();
            return false;
        }
        
        try {
            // Initialize the player selection dialog only when needed
            if (!this.playerSelectionDialog) {
                console.log("Initializing player selection dialog");
                this.playerSelectionDialog = PlayerSelectionDialog.getInstance();
                this.playerSelectionDialog.initialize();
            }
            
            // Preserve the piece type before async operation
            const pieceTypeToCreate = this.newPieceType;
            if (!pieceTypeToCreate) {
                console.error("No piece type available before player selection");
                return false;
            }
            
            // Prompt for player selection
            console.log("Showing player selection dialog");
            const playerId = await this.playerSelectionDialog.show();
            console.log("Player selected:", playerId);
            
            // Use the preserved piece type instead of this.newPieceType
            console.log("Creating new piece of type:", pieceTypeToCreate.name);
            const newPiece = new pieceTypeToCreate(
                this.ctx!,
                this.hexSize,
                gridHex,
                playerId
            );
            
            // Add to piece manager using interaction manager (which handles both)
            console.log("Adding piece to board using interaction manager");
            this.interactionManager.addPiece(newPiece);
            
            // Redraw - use the canvas element directly for the redraw event
            console.log("Triggering redraw");
            if (this.ctx && this.ctx.canvas) {
                this.ctx.canvas.dispatchEvent(new Event('redraw'));
            } else {
                console.error("No canvas context available for redraw");
            }
            
            return true;
        } catch (error) {
            console.error('Error creating new piece:', error);
        } finally {
            this.cancelDrag();
        }
        
        return false;
    }
    
    public cancelDrag(): void {
        this.isDraggingNewPiece = false;
        this.newPieceType = null;
        this.previewPiece = null;
        // Clear cached locations when canceling drag
        this.validDropLocations = [];
    }
    
    public isDragging(): boolean {
        return this.isDraggingNewPiece;
    }
    
    public draw(): void {
        if (this.isDraggingNewPiece && this.previewPiece) {
            // Draw semi-transparent preview piece
            this.ctx!.save();
            this.ctx!.globalAlpha = 0.6;
            
            try {
                this.previewPiece.draw(false);
            } catch (error) {
                console.error("Error drawing piece preview:", error);
            }
            
            this.ctx!.restore();
            
            // Draw highlight for valid drop locations
            if (this.hexGridManager) {
                // Only recalculate valid drop locations when needed
                if (this.recalculateDropLocations) {
                    this.calculateValidDropLocations();
                    this.recalculateDropLocations = false;
                }
                this.drawValidDropLocations();
            }
        }
    }
    
    private calculateValidDropLocations(): void {
        const hexagons = this.hexGridManager.getAllGridHexagons();
        this.validDropLocations = [];
        
        for (const hex of hexagons) {
            // Check if position is valid for placement
            const piecesAtPosition = this.pieceManager.getPiecesAtPosition(hex.q, hex.r, hex.s);
            const canPlace = !piecesAtPosition.some(p => {
                // Same simplified check as in handleMouseUp
                return !(['Resource', 'ShadowPosition'].includes(p.constructor.name));
            });
            
            this.validDropLocations.push({ hex, canPlace });
        }
    }
    
    private drawValidDropLocations(): void {
        this.ctx!.save();
        this.ctx!.fillStyle = 'rgba(0, 255, 0, 0.2)';
        this.ctx!.strokeStyle = 'rgba(0, 255, 0, 0.5)';
        this.ctx!.lineWidth = 2;
        
        for (const location of this.validDropLocations) {
            if (location.canPlace) {
                const hex = location.hex;
                // Draw highlight for valid positions
                this.ctx!.beginPath();
                for (let i = 0; i < 6; i++) {
                    const angle = 2 * Math.PI / 6 * i;
                    const hx = hex.x + this.hexSize * Math.cos(angle);
                    const hy = hex.y + this.hexSize * Math.sin(angle);
                    if (i === 0) {
                        this.ctx!.moveTo(hx, hy);
                    } else {
                        this.ctx!.lineTo(hx, hy);
                    }
                }
                this.ctx!.closePath();
                this.ctx!.fill();
                this.ctx!.stroke();
            }
        }
        
        this.ctx!.restore();
    }
    
    public updateHexSize(hexSize: number): void {
        this.hexSize = hexSize;
        this.recalculateDropLocations = true;
    }
    
    // Also add method to force recalculation when needed
    public invalidateDropLocations(): void {
        this.recalculateDropLocations = true;
    }
} 