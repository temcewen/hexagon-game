
// TODO: possible optimization is to cache recolored images for reuse.
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
}
