import { Piece, Point } from '../Piece.js';
import { PopupMenu } from '../PopupMenu.js';

export class Transponder extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: any) {
        super(ctx, hexSize, position);
        
        // Load the robot image
        this.image = new Image();
        this.image.src = 'assets/robot.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
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

    public handleClick(mousePos: Point): void {
        const menu = PopupMenu.getInstance();
        const items = [
            {
                text: "Drop Beacon",
                callback: () => {
                    // TODO: Implement beacon dropping
                }
            },
            {
                text: "Cancel",
                callback: () => {
                    // Close menu
                    menu.hide();
                }
            }
        ];

        menu.show(mousePos, items);
    }
}
