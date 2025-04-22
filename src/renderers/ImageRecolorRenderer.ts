// TODO: possible optimization is to cache recolored images for reuse.
import { PlayerColor } from '../managers/PlayerManager.js';

export class ImageRecolorRenderer {
    /**
     * Recolors an image with the specified RGB multipliers
     * @param image The source image to recolor
     * @param red Red channel multiplier (0-1)
     * @param green Green channel multiplier (0-1)
     * @param blue Blue channel multiplier (0-1)
     * @returns A canvas containing the recolored image
     */
    public static recolor(
        image: HTMLImageElement,
        red: number,
        green: number,
        blue: number
    ): HTMLCanvasElement {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = image.width;
        tempCanvas.height = image.height;
        const tempCtx = tempCanvas.getContext('2d')!;
        
        // Draw original image
        tempCtx.drawImage(image, 0, 0);
        
        // Get image data and recolor it
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            if (data[i + 3] > 0) { // If pixel is not fully transparent
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                data[i] = brightness * red;      // Red channel
                data[i + 1] = brightness * green;  // Green channel
                data[i + 2] = brightness * blue;   // Blue channel
            }
        }
        
        // Put the modified image data back
        tempCtx.putImageData(imageData, 0, 0);
        
        return tempCanvas;
    }

    /**
     * Recolors an image based on a player color
     * @param image The source image to recolor
     * @param playerColor The player color to apply
     * @returns A canvas containing the recolored image
     */
    public static recolorWithPlayerColor(
        image: HTMLImageElement,
        playerColor: PlayerColor
    ): HTMLCanvasElement {
        const rgbValues = this.getPlayerColorRgbValues(playerColor);
        return this.recolor(image, rgbValues.red, rgbValues.green, rgbValues.blue);
    }

    /**
     * Converts a player color name to RGB values
     * @param color The player color name
     * @returns An object with red, green, and blue values (0-1)
     */
    public static getPlayerColorRgbValues(color: PlayerColor): { red: number, green: number, blue: number } {
        switch (color) {
            case 'lightblue':
                return { red: 0.6, green: 0.8, blue: 1.0 };
            case 'lightgreen':
                return { red: 0.6, green: 1.0, blue: 0.6 };
            case 'pink':
                return { red: 1.0, green: 0.8, blue: 0.9 }; // Lighter pink
            case 'purple':
                return { red: 0.8, green: 0.6, blue: 1.0 };
            case 'yellow':
                return { red: 1.0, green: 1.0, blue: 0.6 };
            case 'darkorange':
                return { red: 1.0, green: 0.7, blue: 0.4 };
            default:
                return { red: 1.0, green: 1.0, blue: 1.0 }; // White as fallback
        }
    }
}
