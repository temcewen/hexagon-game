import BlackGrid from './blackGrid.js';
import { RedTile } from './RedTile.js';
import { BlueTile } from './BlueTile.js';
import { InteractionManager } from './InteractionManager.js';

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

    // Set desired logical canvas size (before DPI scaling)
    const logicalWidth = window.innerWidth * 0.8;
    const logicalHeight = window.innerHeight * 0.9;

    // Handle high DPI displays
    const dpr = window.devicePixelRatio || 1;
    
    // Set the canvas size accounting for device pixel ratio
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    
    // Scale the canvas CSS size
    canvas.style.width = `${logicalWidth}px`;
    canvas.style.height = `${logicalHeight}px`;
    
    // Scale the context to handle the device pixel ratio
    ctx.scale(dpr, dpr);
    
    // Enable image smoothing
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

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

    // Split hexagons into left and right halves based on x coordinate
    const centerX = logicalWidth / 2;
    const leftHexagons = allHexagons.filter(hex => hex.x < centerX);
    const rightHexagons = allHexagons.filter(hex => hex.x >= centerX);

    // Create individual red tiles on the left
    leftHexagons.forEach(hexagon => {
        const redTile = new RedTile(ctx, hexSize, hexagon);
        interactionManager.addTile(redTile);
    });

    // Create individual blue tiles on the right
    rightHexagons.forEach(hexagon => {
        const blueTile = new BlueTile(ctx, hexSize, hexagon);
        interactionManager.addTile(blueTile);
    });

    // Animation loop
    function animate(): void {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight);
        
        // Draw the black grid first
        blackGrid.draw();
        
        // Draw all tiles using the drag drop manager
        interactionManager.draw();
        
        requestAnimationFrame(animate);
    }

    // Start the animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', function() {
        // Update logical dimensions
        const logicalWidth = window.innerWidth * 0.8;
        const logicalHeight = window.innerHeight * 0.9;
        
        const dpr = window.devicePixelRatio || 1;
        
        // Update canvas size for new DPI
        canvas.width = logicalWidth * dpr;
        canvas.height = logicalHeight * dpr;
        
        // Update CSS size
        canvas.style.width = `${logicalWidth}px`;
        canvas.style.height = `${logicalHeight}px`;
        
        // Reset the scale transform
        ctx.scale(dpr, dpr);
        
        // Restore image smoothing settings
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Recalculate hex size based on new dimensions
        const baseHexSize = 50;
        const newHexSize = baseHexSize * (logicalWidth / 1920);

        // Recreate the black grid with new size
        blackGrid.updateHexSize(newHexSize);
        blackGrid.createGrid();
        const updatedHexagons = blackGrid.getHexagons();

        // Update drag drop manager with new hexagons
        interactionManager.setGridHexagons(updatedHexagons);

        // Update all existing tiles with new size and positions
        const centerX = logicalWidth / 2;
        const leftHexagons = updatedHexagons.filter(hex => hex.x < centerX);
        const rightHexagons = updatedHexagons.filter(hex => hex.x >= centerX);

        interactionManager.updateTileSizes(newHexSize, leftHexagons, rightHexagons);
    });

    // Log initial state
    debugLog('Initial setup complete', {
        logicalDimensions: { width: logicalWidth, height: logicalHeight },
        physicalDimensions: { width: canvas.width, height: canvas.height },
        devicePixelRatio: window.devicePixelRatio
    });
}); 