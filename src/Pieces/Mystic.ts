import { Piece, Point, HexCoord } from '../Piece.js';
import { GridHexagon } from '../Types.js';
import { PopupMenu } from '../PopupMenu.js';
import { ShadowPosition } from './ShadowPosition.js';
import { InteractionManager } from '../InteractionManager.js';
import { ForcedSelectionManager } from '../managers/ForcedSelectionManager.js';
import { PlayerManager } from '../managers/PlayerManager.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';

export class Mystic extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private popupMenu: PopupMenu;
    private playerManager: PlayerManager;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string) {
        super(ctx, hexSize, position, playerId);
        
        // Get the PlayerManager instance
        this.playerManager = PlayerManager.getInstance();
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/eye.png';
        this.image.onload = () => {
            // Get the player's color and recolor the image
            const playerColor = this.playerManager.getPlayerColor(playerId);
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor,
                .35
            );
            this.imageLoaded = true;
        };

        // Get popup menu instance
        this.popupMenu = PopupMenu.getInstance();
    }

    private getCurrentPosition(): GridHexagon {
        return {
            x: this.x,
            y: this.y,
            q: this.q,
            r: this.r,
            s: this.s
        };
    }

    public draw(isSelected: boolean): void {
        if (!this.imageLoaded) return;

        // Save the current context state
        this.ctx.save();

        // Calculate image dimensions (make it slightly smaller than the hex)
        const imageSize = this.hexSize * 1.5;
        
        // Draw the image centered on the piece's position
        this.ctx.drawImage(
            this.image,
            this.x - imageSize / 2,
            this.y - imageSize / 2,
            imageSize,
            imageSize
        );

        // Restore the context state
        this.ctx.restore();
    }

    public getValidMoves(): HexCoord[] {
        // Use getPossibleMovesAnyDirection with 2 moves
        return this.getPossibleMovesAnyDirection(2);
    }

    private findShadowPositions(): HexCoord[] {
        const interactionManager = (Piece as any).interactionManager as InteractionManager;
        if (!interactionManager) return [];

        // Get all pieces from the interaction manager that are ShadowPosition instances
        const shadowPositions = interactionManager.getAllPieces()
            .filter((piece: Piece) => piece instanceof ShadowPosition)
            .map((piece: Piece) => ({
                q: piece.q,
                r: piece.r,
                s: piece.s
            }));

        return shadowPositions;
    }

    public handleClick(mousePos: Point): void {
        // Convert canvas coordinates to screen coordinates
        const canvas = this.ctx.canvas;
        const rect = canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate the scale between canvas logical pixels and CSS pixels
        const scaleX = rect.width / (canvas.width / dpr);
        const scaleY = rect.height / (canvas.height / dpr);
        
        // Convert to screen coordinates
        const screenX = rect.left + mousePos.x * scaleX;
        const screenY = rect.top + mousePos.y * scaleY;
        const screenPosition = { x: screenX, y: screenY };

        // Find available shadow positions
        const shadowPositions = this.findShadowPositions();

        // Define menu items
        const menuItems = [
            {
                text: "Self-Reflection",
                callback: () => {
                    // Create a new ShadowPosition at the current position
                    const shadowPosition = new ShadowPosition(
                        this.ctx,
                        this.hexSize,
                        this.getCurrentPosition(),
                        this.playerId
                    );
                    // Add the shadow position to the game board through the interaction manager
                    const interactionManager = (Piece as any).interactionManager as InteractionManager;
                    if (interactionManager) {
                        interactionManager.addPiece(shadowPosition);
                        this.ctx.canvas.dispatchEvent(new Event('redraw'));
                    } else {
                        console.warn('InteractionManager not available - cannot add shadow position to board');
                    }
                    this.popupMenu.hide();
                }
            },
            {
                text: "Superposition",
                disabled: shadowPositions.length === 0,
                callback: async () => {
                    this.popupMenu.hide();
                    const forcedSelectionManager = ForcedSelectionManager.getInstance();
                    
                    await forcedSelectionManager.startForcedSelection(
                        shadowPositions,
                        {
                            selectionMessage: "Select a shadow position to move to",
                            highlightColor: "rgba(0, 255, 255, 0.5)",
                            allowCancel: true,
                            onSelection: (selectedTile) => {
                                // Store the Mystic's current position
                                const mysticOriginalPosition = this.getCurrentPosition();

                                // Find the target hex for the Mystic
                                const targetHex = this.getGridHexagons().find(hex => 
                                    hex.q === selectedTile.q && 
                                    hex.r === selectedTile.r && 
                                    hex.s === selectedTile.s
                                );

                                if (targetHex) {
                                    // Find the ShadowPosition at the target location
                                    const interactionManager = (Piece as any).interactionManager as InteractionManager;
                                    if (interactionManager) {
                                        const piecesAtTarget = interactionManager.getPiecesAtPosition(
                                            selectedTile.q,
                                            selectedTile.r,
                                            selectedTile.s
                                        );
                                        const shadowAtTarget = piecesAtTarget.find(piece => piece instanceof ShadowPosition);
                                        
                                        if (shadowAtTarget) {
                                            // Move the Mystic to the target position
                                            this.moveTo(targetHex);
                                            
                                            // Move the ShadowPosition to the Mystic's original position
                                            const shadowTargetHex = this.getGridHexagons().find(hex => 
                                                hex.q === mysticOriginalPosition.q && 
                                                hex.r === mysticOriginalPosition.r && 
                                                hex.s === mysticOriginalPosition.s
                                            );
                                            if (shadowTargetHex) {
                                                shadowAtTarget.moveTo(shadowTargetHex);
                                            }
                                            
                                            // Trigger a redraw
                                            this.ctx.canvas.dispatchEvent(new Event('redraw'));
                                        }
                                    }
                                }
                            }
                        }
                    );
                }
            },
            {
                text: "Cancel",
                callback: () => {
                    this.popupMenu.hide();
                }
            }
        ];

        // Show the popup menu
        this.popupMenu.show(screenPosition, menuItems);
    }
}
