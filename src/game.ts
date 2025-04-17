import BlackGrid from './blackGrid.js';
import { RedPiece } from './Pieces/RedPiece.js';
import { BluePiece } from './Pieces/BluePiece.js';
import { Transponder } from './Pieces/Transponder.js';
import { InteractionManager } from './InteractionManager.js';
import { Piece } from './Piece.js';

// Wait for the DOM to load completely before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    if (!canvas) {
        throw new Error('Canvas element not found');
    }
    
    const context = canvas.getContext('2d');
    if (!context) {
        throw new Error('Failed to get 2D context');
    }
    const ctx = context; // Store in a non-null variable
    
    // Debug logging function
    function debugLog(message: string, data: any = null): void {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data ? data : '');
    }

    // Function to update canvas dimensions
    function updateCanvasDimensions(): { width: number, height: number } {
        const container = canvas.parentElement!;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Set canvas size accounting for device pixel ratio
        const dpr = window.devicePixelRatio || 1;
        canvas.width = containerWidth * dpr;
        canvas.height = containerHeight * dpr;

        // Scale the context to handle the device pixel ratio
        ctx.scale(dpr, dpr);

        // Enable image smoothing
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        return {
            width: containerWidth,
            height: containerHeight
        };
    }

    // Initial canvas setup
    const { width: logicalWidth, height: logicalHeight } = updateCanvasDimensions();
    canvas.style.touchAction = 'none'; // Prevent default touch actions

    // Initialize game components with scaled hex size
    const baseHexSize = 50;
    const hexSize = baseHexSize * (logicalWidth / 1920); // Scale based on logical width
    
    // Create the black grid
    const blackGrid = new BlackGrid(canvas, hexSize);
    blackGrid.createGrid();
    const allHexagons = blackGrid.getHexagons();
    
    // Create drag and drop manager
    const interactionManager = new InteractionManager(canvas, ctx);
    interactionManager.setGridHexagons(allHexagons);

    // Set up the interaction manager reference in Piece class
    Piece.setInteractionManager(interactionManager);

    // Find specific hexagons for initial piece placement
    const initialRedHex = allHexagons.find(hex => hex.q === -6 && hex.r === 0);
    const initialBlueHex = allHexagons.find(hex => hex.q === 6 && hex.r === 0);
    const initialTransponderHex = allHexagons.find(hex => hex.q === 0 && hex.r === -6);

    if (initialRedHex) {
        const redPiece = new RedPiece(ctx, hexSize, initialRedHex);
        interactionManager.addPiece(redPiece);
    }

    if (initialBlueHex) {
        const bluePiece = new BluePiece(ctx, hexSize, initialBlueHex);
        interactionManager.addPiece(bluePiece);
    }

    if (initialTransponderHex) {
        const transponder = new Transponder(ctx, hexSize, initialTransponderHex);
        interactionManager.addPiece(transponder);
    }

    // Animation loop
    function animate(): void {
        const { width: currentWidth, height: currentHeight } = updateCanvasDimensions();
        ctx.clearRect(0, 0, currentWidth, currentHeight);
        
        // Draw the black grid first
        blackGrid.draw();
        
        // Draw all pieces using the drag drop manager
        interactionManager.draw();
        
        // Draw coordinates last so they appear on top
        blackGrid.drawCoordinates();
        
        requestAnimationFrame(animate);
    }

    // Start the animation loop
    animate();

    // Handle coordinate toggle
    const showCoordinatesCheckbox = document.getElementById('showCoordinates') as HTMLInputElement;
    showCoordinatesCheckbox.addEventListener('change', function() {
        blackGrid.setShowCoordinates(this.checked);
    });

    // Handle window resize
    window.addEventListener('resize', function() {
        const { width: logicalWidth } = updateCanvasDimensions();
        
        // Recalculate hex size based on new dimensions
        const baseHexSize = 50;
        const newHexSize = baseHexSize * (logicalWidth / 1920);

        // Recreate the black grid with new size
        blackGrid.updateHexSize(newHexSize);
        blackGrid.createGrid();
        const updatedHexagons = blackGrid.getHexagons();

        // Update drag drop manager with new hexagons
        interactionManager.setGridHexagons(updatedHexagons);

        // Update all existing pieces with new size, finding their positions in the updated grid
        interactionManager.updatePieceSizes(newHexSize, updatedHexagons);
    });

    // Log initial state
    debugLog('Initial setup complete', {
        logicalDimensions: { width: logicalWidth, height: logicalHeight },
        physicalDimensions: { width: canvas.width, height: canvas.height },
        devicePixelRatio: window.devicePixelRatio
    });
}); 