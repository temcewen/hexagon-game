import BlackGrid from './blackGrid.js';
import RedTiles from './redTiles.js';
import BlueTiles from './blueTiles.js';

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
    const blackGrid = new BlackGrid(canvas, hexSize);
    const redTiles = new RedTiles(canvas, hexSize);
    const blueTiles = new BlueTiles(canvas, hexSize);

    // Create the game grid
    blackGrid.createGrid();
    const allHexagons = blackGrid.getHexagons();
    
    // Split hexagons into left and right halves based on x coordinate
    const centerX = logicalWidth / 2; // Use logical width for calculations
    const leftHexagons = allHexagons.filter(hex => hex.x < centerX);
    const rightHexagons = allHexagons.filter(hex => hex.x >= centerX);

    // Create red tiles on the left and blue tiles on the right
    redTiles.createTiles(leftHexagons);
    blueTiles.createTiles(rightHexagons);
    
    // Set up event listeners with reference to black hexagons
    redTiles.setupEventListeners(blackGrid.getHexagons());
    blueTiles.setupEventListeners(blackGrid.getHexagons());

    // Animation loop
    function animate(): void {
        ctx.clearRect(0, 0, logicalWidth, logicalHeight); // Use logical dimensions
        
        // Draw the black grid first
        blackGrid.draw();
        
        // Get all tiles and sort them by z-index
        const allTiles = [
            ...redTiles.getHexagons(),
            ...blueTiles.getHexagons()
        ].sort((a, b) => a.zIndex - b.zIndex);

        // Draw tiles in z-index order
        allTiles.forEach(tile => {
            if (redTiles.hasHexagon(tile)) {
                redTiles.drawSingleHexagon(tile, tile === redTiles.getSelectedHexagon());
            } else {
                blueTiles.drawSingleHexagon(tile, tile === blueTiles.getSelectedHexagon());
            }
        });
        
        requestAnimationFrame(animate);
    }

    // Start the animation loop
    animate();

    // Handle window resize
    window.addEventListener('resize', function() {
        // Update logical dimensions
        const logicalWidth = window.innerWidth * 0.8;
        const logicalHeight = window.innerHeight * 0.9; // Match the new height ratio
        
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
    });

    // Log initial state
    debugLog('Initial setup complete', {
        logicalDimensions: { width: logicalWidth, height: logicalHeight },
        physicalDimensions: { width: canvas.width, height: canvas.height },
        devicePixelRatio: window.devicePixelRatio
    });
}); 