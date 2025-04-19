import { Piece, Point, HexCoord } from '../Piece.js';
import { Beacon } from '../Pieces/Beacon.js';
import { HexGridManager } from './HexGridManager.js';
import { TooltipManager } from './TooltipManager.js';

export class BeaconPathManager {
    private InBeaconSelectionMode: boolean = false;
    private beaconPathHighlights: HexCoord[] = [];
    private currentPieceInBeaconPath: Piece | null = null;
    private beaconSelectionResolve: ((value: void) => void) | null = null;
    private originalPiecePosition: {q: number, r: number, s: number, x: number, y: number} | null = null;
    
    private hexGridManager: HexGridManager;
    private tooltipManager: TooltipManager;
    
    constructor(hexGridManager: HexGridManager, tooltipManager: TooltipManager) {
        this.hexGridManager = hexGridManager;
        this.tooltipManager = tooltipManager;
    }
    
    public isInBeaconSelectionMode(): boolean {
        return this.InBeaconSelectionMode;
    }
    
    public getBeaconPathHighlights(): HexCoord[] {
        return this.beaconPathHighlights;
    }
    
    // Method to force piece to move along a beacon path
    public async forceMoveAlongBeaconPath(piece: Piece, beacon: Beacon): Promise<void> {
        if (this.InBeaconSelectionMode) {
            console.warn('Already in beacon selection mode');
            return;
        }

        // Find all beacons connected to this one using the beacon's method
        const connectedBeacons = beacon.FindBeaconsInPath();

        // If there's only one beacon and piece is already on it, do nothing
        if (connectedBeacons.length === 1 && 
            piece.q === beacon.q && 
            piece.r === beacon.r && 
            piece.s === beacon.s) {
            return;
        }

        // Store the original position for cancellation
        this.originalPiecePosition = {
            q: piece.q,
            r: piece.r,
            s: piece.s,
            x: piece.x,
            y: piece.y
        };
        
        // Store the beacon path for highlighting
        this.beaconPathHighlights = connectedBeacons.map((b: any) => ({ q: b.q, r: b.r, s: b.s }));
        this.currentPieceInBeaconPath = piece;
        
        // Enter beacon selection mode
        this.InBeaconSelectionMode = true;
        
        // Show instruction tooltip using HTML
        this.tooltipManager.showTooltip('Click on a beacon to move along the path. Press ESC to cancel.');
        
        // Add ESC key listener for cancellation
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && this.InBeaconSelectionMode) {
                this.cancelBeaconSelection();
            }
        };
        
        document.addEventListener('keydown', handleKeyDown);
        
        // Create a promise that will resolve when beacon selection is complete
        return new Promise<void>((resolve) => {
            this.beaconSelectionResolve = resolve;
            
            // When the promise resolves, clean up the event listener
            const originalResolve = this.beaconSelectionResolve;
            this.beaconSelectionResolve = () => {
                document.removeEventListener('keydown', handleKeyDown);
                // Hide the tooltip
                this.tooltipManager.hideTooltip();
                if (originalResolve) originalResolve();
            };
            
            // Set a timeout in case something goes wrong
            setTimeout(() => {
                if (this.InBeaconSelectionMode) {
                    console.warn('Beacon selection mode timed out after 30 seconds');
                    this.cancelBeaconSelection();
                }
            }, 30000);
        });
    }
    
    // Method to cancel beacon selection mode and return the piece to its original position
    public cancelBeaconSelection(): void {
        if (!this.InBeaconSelectionMode || !this.currentPieceInBeaconPath || !this.originalPiecePosition) return;
        
        // Move piece back to original position
        const position = this.hexGridManager.findHexagonByCoord(
            this.originalPiecePosition.q,
            this.originalPiecePosition.r,
            this.originalPiecePosition.s
        );
        
        if (position) {
            this.currentPieceInBeaconPath.moveTo(position);
        }
        
        // End beacon selection mode
        this.endBeaconSelectionMode();
    }
    
    // Method to end beacon selection mode
    public endBeaconSelectionMode(): void {
        if (!this.InBeaconSelectionMode) return;
        
        this.InBeaconSelectionMode = false;
        this.beaconPathHighlights = [];
        this.currentPieceInBeaconPath = null;
        this.originalPiecePosition = null;
        
        // Hide the tooltip
        this.tooltipManager.hideTooltip();
        
        // Resolve the promise if it exists
        if (this.beaconSelectionResolve) {
            this.beaconSelectionResolve();
            this.beaconSelectionResolve = null;
        }
    }

    // Handle beacon selection from click
    public handleBeaconSelection(mousePos: Point): boolean {
        if (!this.InBeaconSelectionMode || !this.currentPieceInBeaconPath) return false;
        
        // Check if click is on any beacon in the path
        for (const beaconCoord of this.beaconPathHighlights) {
            const gridHex = this.hexGridManager.findHexagonByCoord(
                beaconCoord.q, beaconCoord.r, beaconCoord.s
            );
            
            if (gridHex) {
                const dx = mousePos.x - gridHex.x;
                const dy = mousePos.y - gridHex.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance <= this.hexGridManager.getGridHexSize() * 1.2) {
                    // Move the piece to this beacon
                    this.currentPieceInBeaconPath.moveTo(gridHex);
                    
                    // End beacon selection mode
                    this.endBeaconSelectionMode();
                    return true;
                }
            }
        }
        
        return false;
    }
} 