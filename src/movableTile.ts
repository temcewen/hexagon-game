import { GridHexagon, TileHexagon, MousePosition } from './types.js';

export abstract class MovableTile {
    protected canvas: HTMLCanvasElement;
    protected ctx: CanvasRenderingContext2D;
    protected hexSize: number;
    protected hexagons: TileHexagon[];
    protected selectedHexagon: TileHexagon | null;
    protected isDragging: boolean;
    protected dragOffsetX: number;
    protected dragOffsetY: number;
    protected dragStartX: number;
    protected dragStartY: number;
    protected blackHexagons: GridHexagon[] | null;
    protected static nextZIndex: number = 1;
    private static allTileManagers: MovableTile[] = [];
    // Very high z-index for dragging tiles
    private static readonly DRAG_Z_INDEX: number = 100000;

    constructor(canvas: HTMLCanvasElement, hexSize: number) {
        this.canvas = canvas;
        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Failed to get 2D context');
        }
        this.ctx = context;
        this.hexSize = hexSize;
        this.hexagons = [];
        this.selectedHexagon = null;
        this.isDragging = false;
        this.dragOffsetX = 0;
        this.dragOffsetY = 0;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.blackHexagons = null;

        MovableTile.allTileManagers.push(this);
    }

    protected abstract drawHexagon(x: number, y: number, isSelected: boolean): void;

    public createTiles(blackHexagons: GridHexagon[]): void {
        blackHexagons.forEach(hexagon => {
            this.hexagons.push({
                x: hexagon.x,
                y: hexagon.y,
                q: hexagon.q,
                r: hexagon.r,
                s: hexagon.s,
                zIndex: MovableTile.nextZIndex++
            });
        });
    }

    public draw(): void {
        this.hexagons.sort((a, b) => a.zIndex - b.zIndex);
        this.hexagons.forEach(hexagon => {
            this.drawHexagon(hexagon.x, hexagon.y, hexagon === this.selectedHexagon);
        });
    }

    public getHexagons(): TileHexagon[] {
        return this.hexagons;
    }

    public hasHexagon(hexagon: TileHexagon): boolean {
        return this.hexagons.includes(hexagon);
    }

    public getSelectedHexagon(): TileHexagon | null {
        return this.selectedHexagon;
    }

    public drawSingleHexagon(hexagon: TileHexagon, isSelected: boolean): void {
        this.drawHexagon(hexagon.x, hexagon.y, isSelected);
    }

    protected isPointInHexagon(x: number, y: number, hexX: number, hexY: number): boolean {
        const dx = x - hexX;
        const dy = y - hexY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const hitDetectionRadius = this.hexSize * 1.2;
        return distance <= hitDetectionRadius;
    }

    protected bringToFront(hexagon: TileHexagon): void {
        // When dragging, use the special drag z-index
        hexagon.zIndex = MovableTile.DRAG_Z_INDEX;
    }

    public setupEventListeners(blackHexagons?: GridHexagon[]): void {
        if (blackHexagons) {
            this.blackHexagons = blackHexagons;
        }
        if (!this.canvas.hasMouseDownHandler) {
            this.canvas.hasMouseDownHandler = true;
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        }
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    protected getMousePos(evt: MouseEvent): MousePosition {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    protected handleMouseDown(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        
        const allHexagons = MovableTile.allTileManagers.flatMap(manager => manager.getHexagons());
        
        allHexagons.sort((a, b) => b.zIndex - a.zIndex);
        
        for (const hexagon of allHexagons) {
            if (this.isPointInHexagon(mousePos.x, mousePos.y, hexagon.x, hexagon.y)) {
                const owningManager = MovableTile.allTileManagers.find(manager => 
                    manager.hasHexagon(hexagon)
                );
                
                if (owningManager) {
                    owningManager.startDragging(hexagon, mousePos);
                }
                break;
            }
        }
    }

    private startDragging(hexagon: TileHexagon, mousePos: MousePosition): void {
        this.isDragging = true;
        this.selectedHexagon = hexagon;
        this.dragOffsetX = mousePos.x - hexagon.x;
        this.dragOffsetY = mousePos.y - hexagon.y;
        this.dragStartX = hexagon.x;
        this.dragStartY = hexagon.y;
        // Save the original z-index before dragging
        hexagon.originalZIndex = hexagon.zIndex;
        this.bringToFront(hexagon);
    }

    protected handleMouseMove(e: MouseEvent): void {
        if (this.isDragging && this.selectedHexagon) {
            const mousePos = this.getMousePos(e);
            this.selectedHexagon.x = mousePos.x - this.dragOffsetX;
            this.selectedHexagon.y = mousePos.y - this.dragOffsetY;
        }
    }

    protected handleMouseUp(e: MouseEvent): void {
        if (!this.isDragging || !this.selectedHexagon || !this.blackHexagons) {
            return;
        }

        const mousePos = this.getMousePos(e);
        const targetX = mousePos.x - this.dragOffsetX;
        const targetY = mousePos.y - this.dragOffsetY;
        
        var foundClosest = false;
        let closestHexagon: GridHexagon;
        let minDistance = Infinity;
        
        this.blackHexagons.forEach(hexagon => {
            const dx = targetX - hexagon.x;
            const dy = targetY - hexagon.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < minDistance) {
                minDistance = distance;
                foundClosest = true;
                closestHexagon = hexagon;
            }
        });
        
        if (foundClosest && minDistance <= this.hexSize) {
            const tilesAtPosition = MovableTile.allTileManagers.flatMap(manager => 
                manager.getHexagons().filter(hex => 
                    hex.q === closestHexagon!.q && 
                    hex.r === closestHexagon!.r && 
                    hex.s === closestHexagon!.s &&
                    hex !== this.selectedHexagon  // Don't include the tile being dropped
                )
            );

            this.selectedHexagon.x = closestHexagon!.x;
            this.selectedHexagon.y = closestHexagon!.y;
            this.selectedHexagon.q = closestHexagon!.q;
            this.selectedHexagon.r = closestHexagon!.r;
            this.selectedHexagon.s = closestHexagon!.s;

            // Get new z-index based on the rules
            const newZIndex = this.determineZIndex(this.selectedHexagon, tilesAtPosition);
            this.selectedHexagon.zIndex = newZIndex;

            // Update the stack
            this.updateStackZIndices([...tilesAtPosition, this.selectedHexagon]);
        } else {
            this.selectedHexagon.x = this.dragStartX;
            this.selectedHexagon.y = this.dragStartY;
            // Restore the original z-index if dropped in an invalid location
            this.selectedHexagon.zIndex = this.selectedHexagon.originalZIndex || MovableTile.nextZIndex++;
        }

        this.isDragging = false;
        this.selectedHexagon = null;
    }

    /**
     * Determines the z-index for a tile being placed in a stack.
     * Override this method in subclasses to implement custom stacking rules.
     * @param placedTile The tile being placed
     * @param existingStack All tiles currently at the target position
     * @returns The z-index where the placed tile should go
     */
    protected determineZIndex(placedTile: TileHexagon, existingStack: TileHexagon[]): number {
        return MovableTile.nextZIndex++;
    }

    /**
     * Updates z-indices of tiles in a stack after a new tile is placed.
     * Override this in subclasses if you need custom stack reordering.
     * @param stack All tiles at a position, including the newly placed tile
     */
    protected updateStackZIndices(stack: TileHexagon[]): void {
        stack.sort((a, b) => a.zIndex - b.zIndex);
    }

    protected handleMouseLeave(): void {
        if (!this.isDragging || !this.selectedHexagon) {
            return;
        }

        this.selectedHexagon.x = this.dragStartX;
        this.selectedHexagon.y = this.dragStartY;
        this.isDragging = false;
        this.selectedHexagon = null;
    }
} 