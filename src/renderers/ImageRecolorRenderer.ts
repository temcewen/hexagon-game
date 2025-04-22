// TODO: possible optimization is to cache recolored images for reuse.
import { PlayerColor } from '../managers/PlayerManager.js';

export class ImageRecolorRenderer {
    /**
     * Recolors an image with the specified RGB multipliers
     * @param image The source image to recolor
     * @param red Red channel multiplier (0-1)
     * @param green Green channel multiplier (0-1)
     * @param blue Blue channel multiplier (0-1)
     * @param contrast A value between 0-1 that controls the contrast (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
     * @returns A canvas containing the recolored image
     */
    public static recolor(
        image: HTMLImageElement,
        red: number,
        green: number,
        blue: number,
        contrast: number = 5.0
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
                // Calculate brightness and adjust contrast
                const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
                const adjustedBrightness = this.adjustContrast(brightness, contrast);
                
                // Apply color multipliers to the contrast-adjusted brightness
                data[i] = adjustedBrightness * red;      // Red channel
                data[i + 1] = adjustedBrightness * green;  // Green channel
                data[i + 2] = adjustedBrightness * blue;   // Blue channel
            }
        }
        
        // Put the modified image data back
        tempCtx.putImageData(imageData, 0, 0);
        
        return tempCanvas;
    }

    /**
     * Adjusts the contrast of a pixel value
     * @param value The input pixel value (0-255)
     * @param contrast The contrast adjustment factor (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
     * @returns The contrast-adjusted value
     */
    private static adjustContrast(value: number, contrast: number): number {
        // Normalize the value to 0-1 range
        const normalized = value / 255;
        
        // Apply a more dramatic contrast curve using power function
        const factor = Math.pow(normalized - 0.5, contrast) * Math.pow(2, contrast - 1);
        const adjusted = factor + 0.5;
        
        // Convert back to 0-255 range and clamp
        return Math.max(0, Math.min(255, adjusted * 255));
    }

    /**
     * Recolors an image based on a player color
     * @param image The source image to recolor
     * @param playerColor The player color to apply
     * @param shading A value between 0-1 that controls the shading (0 = darker, 1 = lighter, default = 0.5)
     * @param contrast A value between 0-1 that controls the contrast (1.0 = no change, >1.0 = more contrast, <1.0 = less contrast)
     * @returns A canvas containing the recolored image
     */
    public static recolorWithPlayerColor(
        image: HTMLImageElement,
        playerColor: PlayerColor,
        shading: number = 0.5,
        contrast: number = 1.0
    ): HTMLCanvasElement {
        const rgbValues = this.getPlayerColorRgbValues(playerColor);
        // Adjust RGB values based on shading
        const shadingFactor = (shading * 2); // Convert 0-1 to 0-2 range for multiplication
        return this.recolor(
            image,
            rgbValues.red * shadingFactor,
            rgbValues.green * shadingFactor,
            rgbValues.blue * shadingFactor,
            contrast
        );
    }

    /**
     * Converts a player color name to RGB values
     * @param color The player color name
     * @returns An object with red, green, and blue values (0-1)
     */
    public static getPlayerColorRgbValues(color: PlayerColor): { red: number, green: number, blue: number } {
        switch (color) {
            case 'lightblue':
                return { red: 0.5, green: 0.7, blue: 1.2 };
            case 'lightgreen':
                return { red: 0.6, green: 1.4, blue: 0.6 };
            case 'pink':
                return { red: 1.6, green: 1.0, blue: 1.1 }; // Lighter pink
            case 'purple':
                return { red: 1.0, green: 0.8, blue: 1.2 };
            case 'yellow':
                return { red: 1.3, green: 0.9, blue: 0.5 }; // Light brown shade
            case 'darkorange':
                return { red: 1.4, green: 1.2, blue: 0.7 };
            default:
                return { red: 1.0, green: 1.0, blue: 1.0 }; // White as fallback
        }
    }
}
