import { Point, HexCoord, Piece } from '../Piece.js';
import { TooltipManager } from './TooltipManager.js';

export interface ForcedSelectionOptions {
    selectionMessage: string;
    highlightColor: string;
    onSelection: (selectedTile: HexCoord) => void | Promise<void>;
    onCancel?: () => void | Promise<void>;
    allowCancel?: boolean;
    timeout?: number;
}

export class ForcedSelectionManager {
    private static instance: ForcedSelectionManager;
    private inSelectionMode: boolean = false;
    private highlightedTiles: HexCoord[] = [];
    private currentOptions?: ForcedSelectionOptions;
    private tooltipManager: TooltipManager;
    private timeoutId?: number;
    private piece?: Piece;
    private selectionResolve: ((value: void | PromiseLike<void>) => void) | null = null;

    private constructor(tooltipManager: TooltipManager) {
        this.tooltipManager = tooltipManager;
    }

    public static getInstance(tooltipManager?: TooltipManager): ForcedSelectionManager {
        if (!ForcedSelectionManager.instance) {
            if (!tooltipManager) {
                throw new Error('TooltipManager must be provided when creating ForcedSelectionManager instance');
            }
            ForcedSelectionManager.instance = new ForcedSelectionManager(tooltipManager);
        }
        return ForcedSelectionManager.instance;
    }

    public isInSelectionMode(): boolean {
        return this.inSelectionMode;
    }

    public getHighlightedTiles(): HexCoord[] {
        return this.highlightedTiles;
    }

    public getCurrentOptions(): ForcedSelectionOptions | undefined {
        return this.currentOptions;
    }

    public async startForcedSelection(
        piece: Piece,
        tiles: HexCoord[],
        options: ForcedSelectionOptions
    ): Promise<void> {
        if (this.inSelectionMode) {
            console.warn('Already in forced selection mode');
            return;
        }

        return new Promise<void>((resolve, reject) => {
            this.inSelectionMode = true;
            this.highlightedTiles = tiles;
            this.currentOptions = options;
            this.piece = piece;

            // Store resolve callback to be called when selection is made
            this.selectionResolve = resolve;

            // Show instruction tooltip
            this.tooltipManager.showTooltip(
                options.allowCancel 
                    ? `${options.selectionMessage} (Press ESC to cancel)`
                    : options.selectionMessage
            );

            // Set up ESC key listener if cancellation is allowed
            if (options.allowCancel) {
                const handleKeyDown = (e: KeyboardEvent) => {
                    if (e.key === 'Escape' && this.inSelectionMode) {
                        this.cancelSelection();
                        document.removeEventListener('keydown', handleKeyDown);
                        resolve(); // Resolve when cancelled
                    }
                };
                document.addEventListener('keydown', handleKeyDown);
            }

            // Set up timeout if specified
            if (options.timeout) {
                this.timeoutId = setTimeout(() => {
                    console.warn('Forced selection timed out');
                    if (options.allowCancel) {
                        this.cancelSelection();
                        resolve(); // Resolve when timed out
                    }
                }, options.timeout);
            }
        });
    }

    public async handleClick(mousePos: Point, getHexCoordAtPoint: (point: Point) => HexCoord | null): Promise<void> {
        if (!this.inSelectionMode || !this.currentOptions) return;

        const clickedHex = getHexCoordAtPoint(mousePos);
        if (!clickedHex) return;

        // Check if clicked hex is in highlighted tiles
        const isValidSelection = this.highlightedTiles.some(tile => 
            tile.q === clickedHex.q && 
            tile.r === clickedHex.r && 
            tile.s === clickedHex.s
        );

        if (isValidSelection) {
            await this.completeSelection(clickedHex);
        }
    }

    private async completeSelection(selectedTile: HexCoord): Promise<void> {
        if (!this.currentOptions) return;

        // Clear timeout if it exists
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Execute selection callback
        await this.currentOptions.onSelection(selectedTile);

        this.endSelectionMode();

        // Resolve the promise when selection is made
        if (this.selectionResolve) {
            this.selectionResolve();
            this.selectionResolve = null;
        }
    }

    private async cancelSelection(): Promise<void> {
        if (!this.currentOptions?.allowCancel) return;

        // Clear timeout if it exists
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }

        // Execute cancel callback if it exists
        if (this.currentOptions.onCancel) {
            await this.currentOptions.onCancel();
        }

        this.endSelectionMode();

        // Resolve the promise when selection is cancelled
        if (this.selectionResolve) {
            this.selectionResolve();
            this.selectionResolve = null;
        }
    }

    private endSelectionMode(): void {
        this.inSelectionMode = false;
        this.highlightedTiles = [];
        this.currentOptions = undefined;
        this.piece = undefined;
        this.tooltipManager.hideTooltip();
    }
} 