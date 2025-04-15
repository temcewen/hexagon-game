import { GridHexagon } from './types.js';
import { Tile } from './Tile.js';
import { PopupMenu, PopupMenuItem } from './PopupMenu.js';

export class BlueTile extends Tile {
    private commanderImage: HTMLImageElement;
    private popupMenu: PopupMenu;
    private rotationDegrees: number = 0;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize * 0.6, position); // Blue tiles are 60% the size of grid hexagons
        
        this.commanderImage = new Image();
        this.commanderImage.src = 'assets/commander-icon.png';
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Get popup menu instance
        this.popupMenu = PopupMenu.getInstance();
    }

    public handleClick(mousePos: { x: number, y: number }): void {
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

        // Define the rotation submenu
        const showRotationMenu = (position: { x: number, y: number }) => {
            const rotationMenuItems: PopupMenuItem[] = [
                {
                    text: "↻",
                    callback: () => {
                        this.rotationDegrees = (this.rotationDegrees + 60) % 360;
                        this.ctx.canvas.dispatchEvent(new Event('redraw'));
                        // Show the menu again at the same position
                        this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
                    }
                },
                {
                    text: "↺",
                    callback: () => {
                        this.rotationDegrees = (this.rotationDegrees - 60 + 360) % 360;
                        this.ctx.canvas.dispatchEvent(new Event('redraw'));
                        // Show the menu again at the same position
                        this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
                    }
                },
                {
                    text: "Done",
                    callback: () => {
                        // Explicitly hide the menu and modal overlay
                        this.popupMenu.hide();
                    }
                }
            ];
            this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
        };

        // Define main menu items
        const menuItems: PopupMenuItem[] = [
            {
                text: "Rotate",
                callback: () => {
                    showRotationMenu({ x: screenX, y: screenY });
                }
            },
            {
                text: "Option 3",
                callback: () => {
                    console.log("Option 3 clicked");
                }
            }
        ];

        // Show initial popup menu at screen coordinates
        this.popupMenu.show({ x: screenX, y: screenY }, menuItems);
    }

    public draw(isSelected: boolean): void {
        // Save the current context state
        this.ctx.save();
        
        // Calculate image size based on hex size
        const imageSize = this.hexSize * 1.5;
        
        // Apply rotation transform
        this.ctx.translate(this.x, this.y);
        this.ctx.rotate(this.rotationDegrees * Math.PI / 180);
        this.ctx.translate(-this.x, -this.y);
        
        // Draw the commander icon with proper scaling
        if (this.commanderImage.complete) {
            if (isSelected) {
                // When selected/dragging, draw a semi-transparent version first as a shadow
                this.ctx.globalAlpha = 0.6;
                this.ctx.drawImage(
                    this.commanderImage,
                    this.x - imageSize/2,
                    this.y - imageSize/2,
                    imageSize,
                    imageSize
                );
                
                // Then draw the main image with slight transparency
                this.ctx.globalAlpha = 0.8;
            }
            
            this.ctx.drawImage(
                this.commanderImage,
                this.x - imageSize/2,
                this.y - imageSize/2,
                imageSize,
                imageSize
            );
        }
        
        // Restore the context state
        this.ctx.restore();
    }

    // Custom stacking behavior - blue tiles always go on top
    public determineZIndex(existingStack: Tile[]): number {
        // Get the highest z-index in the stack and add an offset
        return Math.max(...existingStack.map(t => t.zIndex), 0) + 1000;
    }
} 