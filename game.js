// Wait for the DOM to load completely before accessing elements
document.addEventListener('DOMContentLoaded', function() {
    // Get the canvas element
    const canvas = document.getElementById('gameCanvas');
    const ctx = canvas.getContext('2d');
    
    // Debug logging function
    function debugLog(message, data = null) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] ${message}`, data ? data : '');
    }
    
    // Hexagon dimensions
    const hexSize = 20;
    const hexHeight = Math.sqrt(3) * hexSize;
    const hexWidth = hexSize * 2;
    
    // Store all hexagons with z-index
    let hexagons = [];
    let nextZIndex = 1;
    
    // Dragging state
    let isDragging = false;
    let selectedHexagon = null;
    let dragOffsetX = 0;
    let dragOffsetY = 0;
    
    // Function to get correct mouse coordinates relative to canvas
    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (evt.clientX - rect.left) * scaleX,
            y: (evt.clientY - rect.top) * scaleY
        };
    }
    
    // Function to draw a single hexagon
    function drawHexagon(x, y, isSelected = false) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            // Start with 90 degree rotation (π/2)
            const angle = Math.PI / 2 + (2 * Math.PI / 6 * i);
            const hx = x + hexSize * Math.cos(angle);
            const hy = y + hexSize * Math.sin(angle);
            if (i === 0) {
                ctx.moveTo(hx, hy);
            } else {
                ctx.lineTo(hx, hy);
            }
        }
        ctx.closePath();
        ctx.fillStyle = isSelected ? '#444444' : 'black';
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        ctx.stroke();
    }
    
    // Check if a point is inside a hexagon
    function isPointInHexagon(x, y, hexX, hexY) {
        debugLog('Checking point in hexagon:', { point: {x, y}, hexagon: {x: hexX, y: hexY} });
        
        // Distance from point to hexagon center
        const dx = x - hexX;
        const dy = y - hexY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // More precise hit detection - reduced from 1.5 to 1.2 times hexSize
        const hitDetectionRadius = hexSize * 1.2;
        
        // Quick check using radius
        if (distance > hitDetectionRadius) {
            debugLog('Point outside quick radius check', { distance, hitDetectionRadius });
            return false;
        }
        
        debugLog('Point is inside hexagon!');
        return true;
    }
    
    // Function to bring a hexagon to the top of the stack
    function bringToFront(hexagon) {
        hexagon.zIndex = nextZIndex++;
        // Sort hexagons by z-index
        hexagons.sort((a, b) => a.zIndex - b.zIndex);
    }
    
    // Function to draw all hexagons
    function drawAllHexagons() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw hexagons in z-index order (lowest to highest)
        hexagons.forEach((hexagon, index) => {
            drawHexagon(hexagon.x, hexagon.y, hexagon === selectedHexagon);
            if (hexagon === selectedHexagon) {
                debugLog(`Drawing selected hexagon ${index}:`, hexagon);
            }
        });
    }
    
    // Function to create a hexagonal grid in the shape of a large hexagon
    function createHexGrid() {
        const gridRadius = 7; // 7 hexagons per side
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        
        // Adjust spacing factors - tightened spacing for smaller hexagons
        const horizontalSpacing = 0.87 * hexWidth;
        const verticalSpacing = 0.87 * hexHeight;
        
        debugLog('Creating hex grid with dimensions:', {
            canvasWidth: canvas.width,
            canvasHeight: canvas.height,
            centerX,
            centerY,
            horizontalSpacing,
            verticalSpacing
        });
        
        // Using cube coordinates for hexagonal grid
        for (let q = -gridRadius + 1; q < gridRadius; q++) {
            for (let r = -gridRadius + 1; r < gridRadius; r++) {
                const s = -q - r;
                
                // Check if the coordinate is within our large hexagon
                if (Math.max(Math.abs(q), Math.abs(r), Math.abs(s)) < gridRadius) {
                    // Convert cube coordinates to pixel position with adjusted spacing
                    const x = centerX + horizontalSpacing * (q + r/2);
                    const y = centerY + verticalSpacing * r;
                    
                    // Store the hexagon with initial z-index
                    hexagons.push({ x, y, q, r, s, zIndex: nextZIndex++ });
                }
            }
        }
        
        debugLog(`Created ${hexagons.length} hexagons`);
        drawAllHexagons();
    }
    
    // Mouse event handlers
    canvas.addEventListener('mousedown', function(e) {
        const mousePos = getMousePos(canvas, e);
        debugLog('Mouse down event:', mousePos);
        
        // Check if the click is on a hexagon, starting from the top of the stack
        for (let i = hexagons.length - 1; i >= 0; i--) {
            const hexagon = hexagons[i];
            if (isPointInHexagon(mousePos.x, mousePos.y, hexagon.x, hexagon.y)) {
                isDragging = true;
                selectedHexagon = hexagon;
                dragOffsetX = mousePos.x - hexagon.x;
                dragOffsetY = mousePos.y - hexagon.y;
                // Bring the selected hexagon to the front
                bringToFront(hexagon);
                debugLog('Started dragging hexagon:', {
                    hexagonPos: { x: hexagon.x, y: hexagon.y },
                    dragOffset: { x: dragOffsetX, y: dragOffsetY },
                    zIndex: hexagon.zIndex
                });
                drawAllHexagons(); // Redraw to show selected state
                break;
            }
        }
    });
    
    canvas.addEventListener('mousemove', function(e) {
        if (isDragging && selectedHexagon) {
            const mousePos = getMousePos(canvas, e);
            
            // Update the selected hexagon's position
            selectedHexagon.x = mousePos.x - dragOffsetX;
            selectedHexagon.y = mousePos.y - dragOffsetY;
            
            debugLog('Dragging hexagon:', {
                mousePos,
                newHexagonPos: { x: selectedHexagon.x, y: selectedHexagon.y }
            });
            
            // Redraw all hexagons
            drawAllHexagons();
        }
    });
    
    canvas.addEventListener('mouseup', function(e) {
        if (isDragging) {
            debugLog('Stopped dragging hexagon:', {
                finalPosition: { x: selectedHexagon.x, y: selectedHexagon.y },
                zIndex: selectedHexagon.zIndex
            });
        }
        isDragging = false;
        selectedHexagon = null;
        drawAllHexagons(); // Redraw to remove selected state
    });
    
    canvas.addEventListener('mouseleave', function() {
        if (isDragging) {
            debugLog('Mouse left canvas while dragging');
        }
        isDragging = false;
        selectedHexagon = null;
        drawAllHexagons(); // Redraw to remove selected state
    });
    
    // Set canvas size and prevent default touch actions
    canvas.width = window.innerWidth * 0.8;
    canvas.height = window.innerHeight * 0.8;
    canvas.style.touchAction = 'none'; // Prevent default touch actions
    
    // Draw the hexagonal grid
    debugLog('Initializing hex grid');
    createHexGrid();
    
    // Log initial state
    debugLog('Initial setup complete', {
        canvasDimensions: { width: canvas.width, height: canvas.height },
        hexagonCount: hexagons.length,
        nextZIndex: nextZIndex
    });
}); 