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

    // Set canvas size and prevent default touch actions
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    canvas.style.touchAction = 'none'; // Prevent default touch actions

    // Initialize game components
    const hexSize = 20;
    const blackGrid = new BlackGrid(canvas, hexSize);
    const redTiles = new RedTiles(canvas, hexSize);
    const blueTiles = new BlueTiles(canvas, hexSize);

    // Create the game grid
    blackGrid.createGrid();
    const allHexagons = blackGrid.getHexagons();
    
    // Split hexagons into left and right halves based on x coordinate
    const centerX = canvas.width / 2;
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
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
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
        canvas.width = window.innerWidth * 0.8;
        canvas.height = window.innerHeight * 0.8;
    });

    // Log initial state
    debugLog('Initial setup complete', {
        canvasDimensions: { width: canvas.width, height: canvas.height }
    });
}); 