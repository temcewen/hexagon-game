import { Piece } from '../Piece.js';
import { Resource } from '../pieces/Resource.js';
import { Commander } from '../pieces/Commander.js';
import { Transponder } from '../pieces/Transponder.js';
import { Mage } from '../pieces/Mage.js';
import { Engineer } from '../pieces/Engineer.js';
import { Berserker } from '../pieces/Berserker.js';
import { Mystic } from '../pieces/Mystic.js';
import { GridHexagon } from '../Types.js';
import { PieceCreationManager } from '../managers/PieceCreationManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';

export class PieceCreationMenu {
    private static instance: PieceCreationMenu | null = null;
    private ctx: CanvasRenderingContext2D;
    private canvas: HTMLCanvasElement;
    private menuWidth: number = 160;
    private hexSize: number = 30;
    private pieceSpacing: number = 80;
    private menuItems: Array<{
        pieceType: new (ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) => Piece;
        name: string;
        preview: Piece | null;
    }> = [];
    private isDraggingPiece: boolean = false;
    private draggedPieceType: any = null;
    private draggedPieceX: number = 0;
    private draggedPieceY: number = 0;
    private pieceCreationManager: PieceCreationManager;
    private playerManager: PlayerManager;
    private lastDrawWidth: number = 0;
    private lastDrawHeight: number = 0;

    private constructor() {
        // Initialize managers - delay this until the initialize method
        this.playerManager = PlayerManager.getInstance();
    }

    public static getInstance(): PieceCreationMenu {
        if (!PieceCreationMenu.instance) {
            PieceCreationMenu.instance = new PieceCreationMenu();
        }
        return PieceCreationMenu.instance;
    }

    public initialize(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
        this.canvas = canvas;
        this.ctx = ctx;
        
        // Get the PieceCreationManager reference
        this.pieceCreationManager = PieceCreationManager.getInstance();
        
        // Initialize menu items with all piece types except Beacon
        this.menuItems = [
            { pieceType: Resource, name: 'Resource', preview: null },
            { pieceType: Commander, name: 'Commander', preview: null },
            { pieceType: Transponder, name: 'Transponder', preview: null },
            { pieceType: Mage, name: 'Mage', preview: null },
            { pieceType: Engineer, name: 'Engineer', preview: null },
            { pieceType: Berserker, name: 'Berserker', preview: null },
            { pieceType: Mystic, name: 'Mystic', preview: null }
        ];
        
        // Create preview pieces
        this.createPreviewPieces();
    }

    private createPreviewPieces(): void {
        // Get client player ID for preview rendering
        // This ensures consistent colors with the actual game
        const previewPlayerId = this.playerManager.getPlayer1Id();
        
        this.menuItems.forEach((item, index) => {
            // Create a position for the preview piece
            const position: GridHexagon = {
                x: 0, // Will be set during draw
                y: 0, // Will be set during draw
                q: 0,
                r: 0,
                s: 0
            };
            
            // Create the preview piece with appropriate size
            try {
                item.preview = new item.pieceType(this.ctx, this.hexSize, position, previewPlayerId);
                console.log(`Created preview for ${item.name}`);
                
                // Special case for pieces that need image loading
                if (item.name === 'Mystic') {
                    // Force imageLoaded for preview
                    (item.preview as any).imageLoaded = true;
                    
                    // Create a simple circle as a fallback image - but only once
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
                    
                    // Set the image and cache the canvas to avoid recreating it on every draw
                    (item.preview as any).image = tempCanvas;
                    
                    // Override the draw method to use a simpler approach
                    const originalDraw = item.preview.draw;
                    item.preview.draw = function(isSelected: boolean) {
                        const ctx = this.ctx;
                        const imageSize = this.hexSize * 1.5;
                        
                        // Just draw the image directly without any complex logic
                        ctx.drawImage(
                            (this as any).image,
                            this.x - imageSize / 2,
                            this.y - imageSize / 2,
                            imageSize,
                            imageSize
                        );
                    };
                }
            } catch (error) {
                console.error(`Error creating preview for ${item.name}:`, error);
            }
        });
    }

    public draw(): void {
        if (!this.ctx || !this.canvas) return;
        
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        const canvasHeight = this.canvas.height / (window.devicePixelRatio || 1);
        
        // We need to always draw the menu - remove the skip condition
        // Update last dimensions for reference
        this.lastDrawWidth = canvasWidth;
        this.lastDrawHeight = canvasHeight;
        
        // Draw the menu background
        this.ctx.fillStyle = 'rgba(20, 20, 20, 0.7)';
        this.ctx.fillRect(canvasWidth - this.menuWidth, 0, this.menuWidth, canvasHeight);
        
        // Draw a border
        this.ctx.strokeStyle = '#666';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(canvasWidth - this.menuWidth, 0, this.menuWidth, canvasHeight);
        
        // Draw menu title
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '16px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Pieces', canvasWidth - this.menuWidth / 2, 30);
        
        // Draw each piece in the menu
        const startY = 70;
        this.menuItems.forEach((item, index) => {
            const x = canvasWidth - this.menuWidth / 2;
            const y = startY + index * this.pieceSpacing;
            
            // Update preview piece position
            if (item.preview) {
                // Save context state
                this.ctx.save();
                
                // Position the piece
                item.preview.x = x;
                item.preview.y = y;
                
                // Draw the piece
                try {
                    item.preview.draw(false);
                } catch (error) {
                    console.error(`Error drawing ${item.name}:`, error);
                }
                
                // Restore context state
                this.ctx.restore();
                
                // Draw the piece name
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.name, x, y + this.hexSize + 20);
            } else {
                // Fallback if preview piece isn't available
                this.ctx.fillStyle = '#fff';
                this.ctx.beginPath();
                this.ctx.arc(x, y, this.hexSize * 0.5, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(item.name, x, y + this.hexSize + 20);
            }
        });
    }

    public handleMouseDown(mousePos: { x: number, y: number }): boolean {
        const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
        
        // Check if the click is within the menu area
        if (mousePos.x < canvasWidth - this.menuWidth) {
            return false; // Not in menu area
        }
        
        // Check if clicking on a piece
        const startY = 70;
        for (let i = 0; i < this.menuItems.length; i++) {
            const x = canvasWidth - this.menuWidth / 2;
            const y = startY + i * this.pieceSpacing;
            
            // Check if click is within this piece's area
            const distance = Math.sqrt(
                Math.pow(mousePos.x - x, 2) + 
                Math.pow(mousePos.y - y, 2)
            );
            
            if (distance <= this.hexSize * 1.2) { // Slightly larger than piece size for easier selection
                // Start dragging this piece
                this.isDraggingPiece = true;
                this.draggedPieceType = this.menuItems[i].pieceType;
                this.draggedPieceX = mousePos.x;
                this.draggedPieceY = mousePos.y;
                
                // Notify the piece creation manager
                this.pieceCreationManager.startDraggingNewPiece(
                    this.draggedPieceType,
                    mousePos,
                    this.hexSize
                );
                
                return true;
            }
        }
        
        return false;
    }

    public updateHexSize(hexSize: number): void {
        this.hexSize = hexSize * 0.6; // Make menu pieces slightly smaller than board pieces
        
        // Recreate preview pieces with new size
        this.createPreviewPieces();
    }
} 