import { Piece, Point } from '../Piece.js';
import { PopupMenu, PopupMenuItem } from '../PopupMenu.js';
import { Beacon } from './Beacon.js';
import { GridHexagon } from '../types.js';
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
    private beacon2DLoaded: boolean = false;
    private beacon3DLoaded: boolean = false;
    private beaconRotationDegrees: number = 0;
    private currentBeaconType: BeaconType | null = null;
    private popupMenu: PopupMenu;
    private beaconPreviewContainer: HTMLDivElement | null = null;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: any) {
        super(ctx, hexSize, position);
        
        // Load the robot image
        this.image = new Image();
        this.image.src = 'assets/robot.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };

        // Load the 2D beacon image
        this.beacon2DImage = new Image();
        this.beacon2DImage.src = 'assets/beacon-2.png';
        this.beacon2DImage.onload = () => {
            this.beacon2DLoaded = true;
        };

        // Load the 3D beacon image
        this.beacon3DImage = new Image();
        this.beacon3DImage.src = 'assets/beacon-3.png';
        this.beacon3DImage.onload = () => {
            this.beacon3DLoaded = true;
        };

        // Get popup menu instance
        this.popupMenu = PopupMenu.getInstance();
        
        // Set up the preview container
        this.setupBeaconPreview();
    }

    private getBeaconImage(type: BeaconType): HTMLImageElement {
        return type === BeaconType.TwoDirectional ? this.beacon2DImage : this.beacon3DImage;
    }

    private setupBeaconPreview(): void {
        this.beaconPreviewContainer = document.getElementById('beaconPreview') as HTMLDivElement;
        if (this.beaconPreviewContainer) {
            // Create a new image element for the preview
            const previewImage = document.createElement('img');
            previewImage.style.width = `${this.hexSize * 2.8}px`;
            previewImage.style.height = `${this.hexSize * 2.8}px`;
            previewImage.style.transition = 'transform 0.2s ease';
            
            // Clear any existing content and add the new image
            this.beaconPreviewContainer.innerHTML = '';
            this.beaconPreviewContainer.appendChild(previewImage);
        }
    }

    private updateBeaconPreview(type: BeaconType): void {
        if (this.beaconPreviewContainer) {
            const previewImage = this.beaconPreviewContainer.querySelector('img');
            if (previewImage) {
                previewImage.src = this.getBeaconImage(type).src;
                previewImage.style.transform = `rotate(${this.beaconRotationDegrees}deg)`;
            }
        }
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
        
        // Show and update the beacon preview
        if (this.beaconPreviewContainer) {
            // Convert canvas coordinates to screen coordinates
            const canvas = this.ctx.canvas;
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            const scaleX = rect.width / (canvas.width / dpr);
            const scaleY = rect.height / (canvas.height / dpr);
            const screenX = rect.left + position.x * scaleX;
            const screenY = rect.top + position.y * scaleY;

            // Explicitly set container size based on image dimensions
            const previewSize = this.hexSize * 2.8;
            this.beaconPreviewContainer.style.width = `${previewSize}px`;
            this.beaconPreviewContainer.style.height = `${previewSize}px`;

            this.beaconPreviewContainer.style.position = 'fixed';
            // Set the anchor point for the CSS transform
            this.beaconPreviewContainer.style.left = `${screenX - 117}px`; 
            this.beaconPreviewContainer.style.top = `${screenY - 10}px`; // 10px gap above the click point
            
            this.beaconPreviewContainer.style.display = 'block';
            this.updateBeaconPreview(beaconType);
        }

        const rotationMenuItems: PopupMenuItem[] = [
            {
                text: "↻",
                callback: () => {
                    this.beaconRotationDegrees = (this.beaconRotationDegrees + 60) % 360;
                    this.updateBeaconPreview(beaconType);
                    this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
                }
            },
            {
                text: "↺",
                callback: () => {
                    this.beaconRotationDegrees = (this.beaconRotationDegrees - 60 + 360) % 360;
                    this.updateBeaconPreview(beaconType);
                    this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
                }
            },
            {
                text: "Cancel",
                callback: () => {
                    // Hide the beacon preview
                    if (this.beaconPreviewContainer) {
                        this.beaconPreviewContainer.style.display = 'none';
                    }
                    this.popupMenu.hide();
                }
            },
            {
                text: "Done",
                callback: () => {
                    // Hide the beacon preview
                    if (this.beaconPreviewContainer) {
                        this.beaconPreviewContainer.style.display = 'none';
                    }

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
        this.popupMenu.show(position, rotationMenuItems, { modal: true, forceKeepOpen: true });
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
                    // Convert canvas coordinates to screen coordinates for the rotation menu
                    const canvas = this.ctx.canvas;
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    const scaleX = rect.width / (canvas.width / dpr);
                    const scaleY = rect.height / (canvas.height / dpr);
                    const screenX = rect.left + mousePos.x * scaleX;
                    const screenY = rect.top + mousePos.y * scaleY;
                    this.showBeaconRotationMenu({ x: screenX, y: screenY }, BeaconType.TwoDirectional);
                },
                disabled: hasBeacon,
                disabledReason: hasBeacon ? "A beacon already exists at this location" : undefined
            },
            {
                text: "Drop 3 Directional Beacon",
                callback: () => {
                    menu.hide();
                    const canvas = this.ctx.canvas;
                    const rect = canvas.getBoundingClientRect();
                    const dpr = window.devicePixelRatio || 1;
                    const scaleX = rect.width / (canvas.width / dpr);
                    const scaleY = rect.height / (canvas.height / dpr);
                    const screenX = rect.left + mousePos.x * scaleX;
                    const screenY = rect.top + mousePos.y * scaleY;
                    this.showBeaconRotationMenu({ x: screenX, y: screenY }, BeaconType.ThreeDirectional);
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
}
