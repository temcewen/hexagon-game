import { Piece, HexCoord } from '../Piece.js';
import { GridHexagon } from '../types.js';
import { Transponder } from './Transponder.js';
import { BluePiece } from './BluePiece.js';
import { RedPiece } from './RedPiece.js';
import { Beacon } from './Beacon.js';
import { PopupMenu } from '../PopupMenu.js';

export class Mage extends Piece {
    private image: HTMLImageElement;
    private imageLoaded: boolean = false;

    constructor(ctx: CanvasRenderingContext2D, hexSize: number, position: GridHexagon) {
        super(ctx, hexSize, position);
        
        // Load the image
        this.image = new Image();
        this.image.src = 'assets/wizard.png';
        this.image.onload = () => {
            this.imageLoaded = true;
        };
    }

    public draw(isSelected: boolean): void {
        // Draw selection indicator if selected
        if (isSelected) {
            this.ctx.save();
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = '#ffff00';
            this.drawHexagonPath();
            this.ctx.fill();
            this.ctx.restore();
        }

        // Draw the image if loaded
        if (this.imageLoaded) {
            const size = this.hexSize * 1.5; // Make the image slightly larger than the hex
            this.ctx.drawImage(
                this.image,
                this.x - size / 2,
                this.y - size / 2,
                size,
                size
            );
        }
    }

    public getValidMoves(): HexCoord[] {
        // Get all grid hexagons from parent class
        const allGridHexagons = super.getValidMoves();
        const validMoves: HexCoord[] = [];

        // Check each grid hexagon
        for (const hex of allGridHexagons) {
            // Calculate distance from current position
            const dx = Math.abs(hex.q - this.q);
            const dy = Math.abs(hex.r - this.r);
            const dz = Math.abs(hex.s - this.s);
            const distance = Math.max(dx, dy, dz);

            // Only consider hexes within 6 tiles
            if (distance <= 6) {
                // Check if there are any pieces at this position
                const piecesAtPosition = this.getPiecesAtPosition(hex.q, hex.r, hex.s);
                if (piecesAtPosition.some(p => p.isMovable())) {
                    validMoves.push({
                        q: hex.q,
                        r: hex.r,
                        s: hex.s
                    });
                }
            }
        }

        return validMoves;
    }

    public async onDropped(fromPosition: { q: number, r: number, s: number }) {
        // Get pieces at the new position
        const piecesAtNewPosition = this.getPiecesAtPosition(this.q, this.r, this.s);
        
        // Find a piece to swap with (if any)
        const pieceToSwap = piecesAtNewPosition.find(piece => 
            piece.isMovable()
        );

        // If we found a valid piece to swap with
        if (pieceToSwap) {
            // Get the grid hexagon for the original position
            const fromHexagon = this.getGridHexagons().find(hex => 
                hex.q === fromPosition.q && 
                hex.r === fromPosition.r && 
                hex.s === fromPosition.s
            );

            if (fromHexagon) {
                // Move the other piece to our original position with correct x,y coordinates
                pieceToSwap.moveTo(fromHexagon);

                // Check if either piece landed on a beacon
                const piecesAtOriginalPos = this.getPiecesAtPosition(fromPosition.q, fromPosition.r, fromPosition.s);
                const piecesAtNewPos = this.getPiecesAtPosition(this.q, this.r, this.s);

                if (piecesAtNewPos.some(p => p instanceof Beacon)) {
                    await this.handleDroppedOnBeacon(this, piecesAtNewPos.find(p => p instanceof Beacon) as Beacon);
                }
                if (piecesAtOriginalPos.some(p => p instanceof Beacon)) {
                    await this.handleDroppedOnBeacon(pieceToSwap, piecesAtOriginalPos.find(p => p instanceof Beacon) as Beacon);
                }
            }
        }
    }

    private async handleDroppedOnBeacon(piece: Piece, beacon: Beacon): Promise<void> {
        // Import the PopupMenu class
        const popupMenu = PopupMenu.getInstance();
        
        // Create menu options
        const menuItems = [
            {
                text: "Move along beacon path",
            },
            {
                text: "Cancel",
            }
        ];
        
        // Show the popup menu at the position of the beacon and get selected option index
        const selectedOption = await popupMenu.show(
            { x: beacon.x, y: beacon.y }, 
            menuItems,
            { modal: true }
        );
        
        // Process based on selected option (0 = Move along path, 1 = Cancel, -1 = Closed without selection)
        if (selectedOption === 0) { // Move along beacon path
            // Find all beacons connected to this one
            const connectedBeacons = beacon.FindBeaconsInPath();
            
            // Create a special mode where the user must select a beacon
            await new Promise<void>((resolve) => {
                // Store original methods to restore later
                const originalGetValidMoves = piece.getValidMoves;
                const originalOnDropped = piece.onDropped;
                const originalDraw = (piece as any).draw;
                
                // Flag to track if we're in beacon selection mode
                let inBeaconSelectionMode = true;
                
                // Get reference to the context
                const ctx = this.ctx;
                
                // Override the piece's draw method to highlight the beacons
                (piece as any).draw = function(isSelected: boolean) {
                    // Call the original draw method first
                    originalDraw.call(piece, isSelected);
                    
                    // If in beacon selection mode, highlight the connected beacons
                    if (inBeaconSelectionMode) {
                        ctx.save();
                        
                        // Highlight effect for beacons
                        const timestamp = Date.now();
                        const alpha = 0.5 + 0.5 * Math.sin(timestamp / 300); // Pulsing effect
                        
                        ctx.globalAlpha = alpha;
                        ctx.strokeStyle = '#00ffff';
                        ctx.lineWidth = 4;
                        
                        // Draw highlight around each beacon in the path
                        for (const beaconInPath of connectedBeacons) {
                            ctx.beginPath();
                            ctx.arc(beaconInPath.x, beaconInPath.y, piece.getHexSize() * 1.2, 0, Math.PI * 2);
                            ctx.stroke();
                        }
                        
                        ctx.restore();
                    }
                };
                
                // Override getValidMoves to only allow selection of beacons in the path
                piece.getValidMoves = function() {
                    return connectedBeacons.map(b => ({ q: b.q, r: b.r, s: b.s }));
                };
                
                // Setup a special drop handler 
                piece.onDropped = function(fromPosition: { q: number, r: number, s: number }) {
                    // Check if we dropped on a beacon in the path
                    const targetCoord = { q: piece.q, r: piece.r, s: piece.s };
                    const isOnBeacon = connectedBeacons.some(b => 
                        b.q === targetCoord.q && b.r === targetCoord.r && b.s === targetCoord.s
                    );
                    
                    if (isOnBeacon) {
                        // End the beacon selection mode
                        inBeaconSelectionMode = false;
                        
                        // Restore original methods
                        piece.getValidMoves = originalGetValidMoves;
                        piece.onDropped = originalOnDropped;
                        (piece as any).draw = originalDraw;
                        
                        // Resolve the promise, allowing execution to continue
                        resolve();
                    } else {
                        // If not dropped on a beacon, return to starting position
                        const allGridHexagons = piece.getValidMoves();
                        const fromHex = allGridHexagons.find(h => 
                            h.q === fromPosition.q && h.r === fromPosition.r && h.s === fromPosition.s
                        );
                        if (fromHex) {
                            // Convert the HexCoord to GridHexagon with x,y coords
                            const gridHex = this.getGridHexagons().find((gh: GridHexagon) => 
                                gh.q === fromPosition.q && gh.r === fromPosition.r && gh.s === fromPosition.s
                            );
                            if (gridHex) {
                                piece.moveTo(gridHex);
                            }
                        }
                    }
                }.bind(this);
                
                // Use an interval to force redraw and keep the beacon highlights visible
                const redrawInterval = setInterval(() => {
                    if (!inBeaconSelectionMode) {
                        clearInterval(redrawInterval);
                        return;
                    }
                    
                    // Force a redraw - we'll redraw everything
                    // This is a bit of a hack, but it's the simplest way to ensure the highlights are visible
                    const gameCanvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
                    if (gameCanvas) {
                        const evt = new CustomEvent('forceRedraw');
                        gameCanvas.dispatchEvent(evt);
                    }
                }, 50);
            });
        }
    }
}
