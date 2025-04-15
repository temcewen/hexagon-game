import { GridHexagon } from './types.js';
import { Point, Tile } from './Tile.js';
import { RedTile } from './RedTile.js';
import { InteractionType } from './InteractionType.js';

export class InteractionManager {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private tiles: Tile[];
    private selectedTile: Tile | null;
    private isDragging: boolean;
    private dragOffset: Point;
    private dragStartPos: Point;
    private gridHexagons: GridHexagon[];
    private mouseDownTime: number;
    private mouseDownPos: Point;
    private readonly CLICK_THRESHOLD_MS: number = 200; // Max time for a click
    private readonly CLICK_DISTANCE_THRESHOLD: number = 5; // Max distance for a click

    constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.tiles = [];
        this.selectedTile = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.dragStartPos = { x: 0, y: 0 };
        this.gridHexagons = [];
        this.mouseDownTime = 0;
        this.mouseDownPos = { x: 0, y: 0 };

        this.setupEventListeners();
    }

    public addTile(tile: Tile): void {
        this.tiles.push(tile);
    }

    public setGridHexagons(hexagons: GridHexagon[]): void {
        this.gridHexagons = hexagons;
    }

    private setupEventListeners(): void {
        this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }

    private getMousePos(evt: MouseEvent): Point {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        // Calculate the scale between CSS pixels and canvas logical pixels
        const scaleX = (this.canvas.width / dpr) / rect.width;
        const scaleY = (this.canvas.height / dpr) / rect.height;

        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }

    private handleMouseDown(e: MouseEvent): void {
        const mousePos = this.getMousePos(e);
        this.mouseDownTime = Date.now();
        this.mouseDownPos = mousePos;
        
        // Sort tiles by z-index in descending order to check top tiles first
        const sortedTiles = [...this.tiles].sort((a, b) => b.zIndex - a.zIndex);
        
        for (const tile of sortedTiles) {
            if (tile.containsPoint(mousePos)) {
                this.selectedTile = tile;
                // Don't set isDragging immediately - wait to see if it's a click or drag
                this.dragOffset = {
                    x: mousePos.x - tile.x,
                    y: mousePos.y - tile.y
                };
                this.dragStartPos = {
                    x: tile.x,
                    y: tile.y
                };
                break;
            }
        }
    }

    private handleMouseMove(e: MouseEvent): void {
        if (!this.selectedTile) return;

        const mousePos = this.getMousePos(e);
        const dx = mousePos.x - this.mouseDownPos.x;
        const dy = mousePos.y - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // If we've moved beyond the threshold, it's a drag
        if (!this.isDragging && distance > this.CLICK_DISTANCE_THRESHOLD && this.selectedTile.isMovable()) {
            this.isDragging = true;
            // Store original z-index and set a very high z-index during drag
            this.selectedTile.originalZIndex = this.selectedTile.zIndex;
            this.selectedTile.zIndex = 99999; // Extremely high z-index during drag
            console.log('Interaction type:', InteractionType.DRAG);
        }

        if (this.isDragging) {
            this.selectedTile.x = mousePos.x - this.dragOffset.x;
            this.selectedTile.y = mousePos.y - this.dragOffset.y;
        }
    }

    private handleMouseUp(e: MouseEvent): void {
        if (!this.selectedTile) return;

        const mousePos = this.getMousePos(e);
        const timeDiff = Date.now() - this.mouseDownTime;
        const dx = mousePos.x - this.mouseDownPos.x;
        const dy = mousePos.y - this.mouseDownPos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (!this.isDragging && timeDiff < this.CLICK_THRESHOLD_MS && distance <= this.CLICK_DISTANCE_THRESHOLD) {
            // It's a click!
            console.log('Interaction type:', InteractionType.CLICK);
            if (this.selectedTile.handleClick) {
                this.selectedTile.handleClick(mousePos);
            }
        } else if (this.isDragging) {
            // Handle drag end
            const targetX = mousePos.x - this.dragOffset.x;
            const targetY = mousePos.y - this.dragOffset.y;

            // Find closest grid hexagon
            let closestHexagon: GridHexagon | null = null;
            let minDistance = Infinity;

            for (const hexagon of this.gridHexagons) {
                const dx = targetX - hexagon.x;
                const dy = targetY - hexagon.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestHexagon = hexagon;
                }
            }

            if (closestHexagon && minDistance <= this.selectedTile.getHexSize()) {
                // Find other tiles at this position
                const tilesAtPosition = this.tiles.filter(tile => 
                    tile !== this.selectedTile &&
                    tile.q === closestHexagon!.q &&
                    tile.r === closestHexagon!.r &&
                    tile.s === closestHexagon!.s
                );

                // Move tile to new position
                this.selectedTile.moveTo(closestHexagon);

                // Restore original z-index before recalculating new z-index
                if (this.selectedTile.originalZIndex !== undefined) {
                    this.selectedTile.zIndex = this.selectedTile.originalZIndex;
                    this.selectedTile.originalZIndex = undefined;
                }

                // Update z-index based on tile's stacking rules
                this.selectedTile.zIndex = this.selectedTile.determineZIndex(tilesAtPosition);
            } else {
                // Return to starting position if not dropped on a valid hexagon
                this.selectedTile.x = this.dragStartPos.x;
                this.selectedTile.y = this.dragStartPos.y;
            }
        }

        this.isDragging = false;
        this.selectedTile = null;
    }

    private handleMouseLeave(): void {
        if (this.isDragging && this.selectedTile) {
            // Return to starting position
            this.selectedTile.x = this.dragStartPos.x;
            this.selectedTile.y = this.dragStartPos.y;
            this.isDragging = false;
            this.selectedTile = null;
        }
    }

    public draw(): void {
        // Sort tiles by z-index
        const sortedTiles = [...this.tiles].sort((a, b) => a.zIndex - b.zIndex);
        
        // Draw each tile
        sortedTiles.forEach(tile => {
            tile.draw(tile === this.selectedTile);
        });
    }

    public updateTileSizes(newHexSize: number, leftHexagons: GridHexagon[], rightHexagons: GridHexagon[]): void {
        // Store existing tiles
        const existingTiles = [...this.tiles];
        
        // Clear current tiles
        this.tiles = [];
        
        // Combine all hexagons for position matching
        const allHexagons = [...leftHexagons, ...rightHexagons];
        
        // Recreate tiles with new sizes and positions
        existingTiles.forEach(tile => {
            const isRedTile = tile instanceof RedTile;
            
            // Find the corresponding hexagon position from all hexagons
            const hexagon = allHexagons.find(h => h.q === tile.q && h.r === tile.r && h.s === tile.s);
            if (hexagon) {
                // Update tile with new position and size
                tile.updateSize(newHexSize, isRedTile ? 0.8 : 0.6);
                tile.moveTo(hexagon);
                this.tiles.push(tile);
            }
        });
    }
} 