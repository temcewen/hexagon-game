import { GridHexagon, ZoneType } from '../Types.js';
import { Piece, HexCoord, Point } from '../Piece.js';
import { PopupMenu, PopupMenuItem } from '../PopupMenu.js';
import { Beacon } from './Beacon.js';
import { ImageRecolorRenderer } from '../renderers/ImageRecolorRenderer.js';
import { PieceManager } from '../managers/PieceManager.js';
import { Resource } from './Resource.js';
import { PlayerColor } from '../managers/PlayerManager.js';

export class Engineer extends Piece {
    private image: HTMLImageElement | HTMLCanvasElement;
    private imageLoaded: boolean = false;
    private popupMenu: PopupMenu;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon, playerId: string, playerColor: PlayerColor) {
        super(ctx, hexSize * 0.7, position, playerId); // Engineer is 70% the size of grid hexagons
        
        // Load the engineer image
        this.image = new Image();
        this.image.src = 'assets/hard-hat.png';
        this.image.onload = () => {
            this.image = ImageRecolorRenderer.recolorWithPlayerColor(
                this.image as HTMLImageElement,
                playerColor
            );
            this.imageLoaded = true;
        };
        
        // Enable image smoothing
        this.ctx.imageSmoothingEnabled = true;
        this.ctx.imageSmoothingQuality = 'high';

        // Get popup menu instance
        this.popupMenu = PopupMenu.getInstance();
    }

    public draw(isSelected: boolean): void {

        if (this.isSharingTileWith(Resource) && this.getZone() != ZoneType.Friendly) {
            this.addResourceSpotlight();
        }

        // Draw the image if loaded
        if (this.imageLoaded) {
            this.ctx.save();
            
            // Apply transparency if selected
            if (isSelected) {
                this.ctx.globalAlpha = 0.6;
            }
            
            const imageSize = this.hexSize * 1.8; // Slightly larger than the hexagon
            this.ctx.drawImage(
                this.image,
                this.x - imageSize / 2,
                this.y - imageSize / 2,
                imageSize,
                imageSize
            );
            
            // Restore context state
            this.ctx.restore();
        }
    }

    public getValidMoves(): HexCoord[] {
        // Engineer uses the any-direction movement with 2 moves
        return this.getPossibleMovesAnyDirection(2, true);
    }

    private hasBeaconAtCurrentPosition(): boolean {
        const piecesAtPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        return piecesAtPosition.some(piece => piece instanceof Beacon);
    }

    private getBeaconAtCurrentPosition(): Beacon | null {
        const piecesAtPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        return piecesAtPosition.find(piece => piece instanceof Beacon) as Beacon | null;
    }

    private hasEnemyBeaconAtCurrentPosition(): boolean {
        const piecesAtPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        return piecesAtPosition.some(piece => 
            piece instanceof Beacon && (piece as any).playerId !== this.playerId
        );
    }

    private getEnemyBeaconAtCurrentPosition(): Beacon | null {
        const piecesAtPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        return piecesAtPosition.find(piece => 
            piece instanceof Beacon && (piece as any).playerId !== this.playerId
        ) as Beacon | null;
    }

    private reverseEngineerBeacon(beacon: Beacon): void {
        // Create a new beacon with the engineer's player ID
        const newBeacon = beacon.changePlayerControl(this.playerId);
        
        // Remove the old beacon
        beacon.remove();
        
        // Add the beacon through the PieceManager singleton
        PieceManager.getInstance().addPiece(newBeacon);
    }

    private showBeaconRotationMenu(position: Point, beacon: Beacon): void {
        // Create rotation menu items
        const rotationMenuItems: PopupMenuItem[] = [
            {
                text: "↻",
                callback: () => {
                    // Rotate beacon clockwise (add 60 degrees)
                    this.rotateBeacon(beacon, 60);
                    this.ctx.canvas.dispatchEvent(new Event('redraw'));
                    // Show the menu again at the same position to keep it open
                    this.popupMenu.show(position, rotationMenuItems, { 
                        modal: true, 
                        forceKeepOpen: true 
                    });
                }
            },
            {
                text: "↺",
                callback: () => {
                    // Rotate beacon counter-clockwise (subtract 60 degrees)
                    this.rotateBeacon(beacon, -60);
                    this.ctx.canvas.dispatchEvent(new Event('redraw'));
                    // Show the menu again at the same position to keep it open
                    this.popupMenu.show(position, rotationMenuItems, { 
                        modal: true, 
                        forceKeepOpen: true 
                    });
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
        
        // Show the rotation menu with forceKeepOpen option
        this.popupMenu.show(position, rotationMenuItems, { 
            modal: true, 
            forceKeepOpen: true 
        });
    }

    // Helper method to rotate a beacon by modifying its rotationDegrees property
    private rotateBeacon(beacon: Beacon, degrees: number): void {
        // Using reflection to access the rotationDegrees property as it's private
        const beaconAny = beacon as any;
        if (beaconAny && typeof beaconAny.rotationDegrees !== 'undefined') {
            // Calculate new rotation (normalize to 0-359)
            beaconAny.rotationDegrees = ((beaconAny.rotationDegrees + degrees) % 360 + 360) % 360;
        }
    }

    private removeBeacon(beacon: Beacon): void {
        beacon.remove();
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

        // Check if there's a beacon at the current position
        const hasBeacon = this.hasBeaconAtCurrentPosition();
        const beacon = this.getBeaconAtCurrentPosition();
        const hasEnemyBeacon = this.hasEnemyBeaconAtCurrentPosition();
        const enemyBeacon = this.getEnemyBeaconAtCurrentPosition();

        // Define menu items with conditional disabling
        const menuItems: PopupMenuItem[] = [
            {
                text: "Reconfigure Beacon",
                callback: () => {
                    if (beacon) {
                        this.showBeaconRotationMenu(screenPosition, beacon);
                    }
                },
                disabled: !hasBeacon,
                disabledReason: "No beacon at this location to reconfigure"
            },
            {
                text: "Recycle Beacon",
                callback: () => {
                    if (beacon) {
                        this.removeBeacon(beacon);
                        this.popupMenu.hide();
                    }
                },
                disabled: !hasBeacon,
                disabledReason: "No beacon at this location to remove"
            },
            {
                text: "Reverse Engineer",
                callback: () => {
                    if (enemyBeacon) {
                        this.reverseEngineerBeacon(enemyBeacon);
                        this.ctx.canvas.dispatchEvent(new Event('redraw'));
                        this.popupMenu.hide();
                    }
                },
                disabled: !hasEnemyBeacon,
                disabledReason: "No enemy beacon at this location to reverse engineer"
            },
            {
                text: "Cancel",
                callback: () => {
                    this.popupMenu.hide();
                }
            }
        ];

        // Show the popup menu at screen coordinates
        this.popupMenu.show(screenPosition, menuItems);
    }
}
