import { Piece, Point, HexCoord } from '../Piece.js';
import { PopupMenu, PopupMenuItem } from '../PopupMenu.js';
import { Beacon } from './Beacon.js';
import { GridHexagon } from '../Types.js';
import { InteractionManager } from '../InteractionManager.js';

export enum BeaconType {
    TwoDirectional = '2D',
    ThreeDirectional = '3D'
}

export class Transponder extends Piece {
    private image: HTMLImageElement;
    private beacon2DImage: HTMLImageElement;
    private beacon3DImage: HTMLImageElement;
    private imageLoaded: boolean = false;
    private beaconRotationDegrees: number = 0;
    private currentBeaconType: BeaconType | null = null;
    private popupMenu: PopupMenu;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: any) {
        super(ctx, hexSize, position);
        
        // Load the robot image
        this.image = new Image();
        this.image.src = 'assets/transponder.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };

        // Load the 2D beacon image
        this.beacon2DImage = new Image();
        this.beacon2DImage.src = 'assets/beacon-2.png';

        // Load the 3D beacon image
        this.beacon3DImage = new Image();
        this.beacon3DImage.src = 'assets/beacon-3.png';

        // Get popup menu instance
        this.popupMenu = PopupMenu.getInstance();
    }

    private getBeaconImage(type: BeaconType): HTMLImageElement {
        return type === BeaconType.TwoDirectional ? this.beacon2DImage : this.beacon3DImage;
    }

    private createBeaconPreviewElement(type: BeaconType): HTMLImageElement {
        const previewImage = document.createElement('img');
        previewImage.src = this.getBeaconImage(type).src;
        previewImage.style.width = `${this.hexSize * 2.8}px`;
        previewImage.style.height = `${this.hexSize * 2.8}px`;
        previewImage.style.position = 'fixed';
        previewImage.style.transformOrigin = '50% 50%';
        previewImage.style.transform = `rotate(${this.beaconRotationDegrees}deg)`;
        previewImage.style.transition = 'transform 0.2s ease';
        previewImage.style.pointerEvents = 'none'; // Prevent interaction with the preview
        return previewImage;
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

    private addBeaconToBoard(beacon: Piece): void {
        const interactionManager = (Piece as any).interactionManager as InteractionManager;
        if (interactionManager) {
            interactionManager.addPiece(beacon);
        } else {
            console.warn('InteractionManager not available - cannot add beacon to board');
        }
    }

    private showBeaconRotationMenu(position: Point, beaconType: BeaconType): void {
        this.currentBeaconType = beaconType;
        this.beaconRotationDegrees = 0; // Reset rotation when opening menu
        
        // Create the preview element
        const previewElement = this.createBeaconPreviewElement(beaconType);
        
        const rotationMenuItems: PopupMenuItem[] = [
            {
                text: "↻",
                callback: () => {
                    this.beaconRotationDegrees = (this.beaconRotationDegrees + 60) % 360;
                    if (previewElement) {
                        previewElement.style.transform = `rotate(${this.beaconRotationDegrees}deg)`;
                    }
                    // Re-show the menu to maintain the same items but with updated preview
                    this.popupMenu.show(position, rotationMenuItems, { 
                        modal: true, 
                        forceKeepOpen: true,
                        previewElement: previewElement,
                        previewSpacing: 20
                    });
                }
            },
            {
                text: "↺",
                callback: () => {
                    this.beaconRotationDegrees = (this.beaconRotationDegrees - 60 + 360) % 360;
                    if (previewElement) {
                        previewElement.style.transform = `rotate(${this.beaconRotationDegrees}deg)`;
                    }
                    // Re-show the menu to maintain the same items but with updated preview
                    this.popupMenu.show(position, rotationMenuItems, { 
                        modal: true, 
                        forceKeepOpen: true,
                        previewElement: previewElement,
                        previewSpacing: 20
                    });
                }
            },
            {
                text: "Cancel",
                callback: () => {
                    this.popupMenu.hide();
                }
            },
            {
                text: "Done",
                callback: () => {
                    // Create a new beacon at the transponder's position with the current rotation
                    const beacon = new Beacon(
                        this.ctx, 
                        this.hexSize, 
                        this.getCurrentPosition(),
                        this.beaconRotationDegrees,
                        this.currentBeaconType === BeaconType.ThreeDirectional
                    );
                    // Add the beacon to the game board through the interaction manager
                    this.addBeaconToBoard(beacon);

                    this.popupMenu.hide();
                }
            }
        ];
        
        // Show the popup menu with the preview element
        this.popupMenu.show(position, rotationMenuItems, { 
            modal: true, 
            forceKeepOpen: true,
            previewElement: previewElement,
            previewSpacing: 20
        });
    }

    public draw(isSelected: boolean): void {
        // Draw the robot image if loaded
        if (this.imageLoaded) {
            this.ctx.save();
            
            // Set opacity to 60% when selected
            if (isSelected) {
                this.ctx.globalAlpha = 0.6;
            }
            else {
                this.ctx.globalAlpha = 1;
            }
            
            const imageSize = this.hexSize * 1.4; // Slightly larger than hex
            this.ctx.drawImage(
                this.image,
                this.x - imageSize / 2,
                this.y - imageSize / 2,
                imageSize,
                imageSize
            );
            
            this.ctx.restore();
        }
    }

    private hasBeaconAtCurrentPosition(): boolean {
        const pieces = this.getPiecesAtPosition(this.q, this.r, this.s);
        return pieces.some(piece => piece instanceof Beacon);
    }

    public handleClick(mousePos: Point): void {
        const menu = PopupMenu.getInstance();
        const hasBeacon = this.hasBeaconAtCurrentPosition();
        const items = [
            {
                text: "Drop 2 Directional Beacon",
                callback: () => {
                    menu.hide();
                    this.showBeaconRotationMenu(mousePos, BeaconType.TwoDirectional);
                },
                disabled: hasBeacon,
                disabledReason: hasBeacon ? "A beacon already exists at this location" : undefined
            },
            {
                text: "Drop 3 Directional Beacon",
                callback: () => {
                    menu.hide();
                    this.showBeaconRotationMenu(mousePos, BeaconType.ThreeDirectional);
                },
                disabled: hasBeacon,
                disabledReason: hasBeacon ? "A beacon already exists at this location" : undefined
            },
            {
                text: "Cancel",
                callback: () => {
                    menu.hide();
                }
            }
        ];
        menu.show(mousePos, items);
    }

    public getValidMoves(): HexCoord[] {
        return super.getPossibleMovesByDirection(3);
    }
}
