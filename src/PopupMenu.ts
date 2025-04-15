import { Point } from './Tile.js';

export interface PopupMenuItem {
    text?: string;
    imageUrl?: string;
    callback: () => void;
}

export class PopupMenu {
    private static instance: PopupMenu | null = null;
    private element: HTMLDivElement;
    private items: PopupMenuItem[] = [];
    private isVisible: boolean = false;

    private constructor() {
        this.element = document.createElement('div');
        this.element.style.position = 'fixed';
        this.element.style.backgroundColor = 'white';
        this.element.style.border = '1px solid #ccc';
        this.element.style.borderRadius = '4px';
        this.element.style.boxShadow = '0 2px 5px rgba(0,0,0,0.2)';
        this.element.style.padding = '4px 0';
        this.element.style.zIndex = '1000';
        this.element.style.display = 'none';
        
        document.body.appendChild(this.element);
        
        // Close menu when clicking outside
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.element.contains(e.target as Node)) {
                this.hide();
            }
        });
    }

    public static getInstance(): PopupMenu {
        if (!PopupMenu.instance) {
            PopupMenu.instance = new PopupMenu();
        }
        return PopupMenu.instance;
    }

    public show(position: Point, items: PopupMenuItem[]): void {
        this.items = items;
        this.element.innerHTML = '';
        
        // Create menu items
        items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = 'pointer';
            menuItem.style.whiteSpace = 'nowrap';
            menuItem.style.fontFamily = 'Arial, sans-serif';
            
            // Handle hover effect
            menuItem.addEventListener('mouseenter', () => {
                menuItem.style.backgroundColor = '#f0f0f0';
            });
            menuItem.addEventListener('mouseleave', () => {
                menuItem.style.backgroundColor = 'transparent';
            });
            
            // Add image if provided
            if (item.imageUrl) {
                const img = document.createElement('img');
                img.src = item.imageUrl;
                img.style.width = '16px';
                img.style.height = '16px';
                img.style.marginRight = '8px';
                img.style.verticalAlign = 'middle';
                menuItem.appendChild(img);
            }
            
            // Add text
            const text = document.createElement('span');
            text.textContent = item.text || `Option ${index + 1}`;
            menuItem.appendChild(text);
            
            // Add click handler
            menuItem.addEventListener('click', () => {
                item.callback();
                this.hide();
            });
            
            this.element.appendChild(menuItem);
        });
        
        // Show menu
        this.element.style.display = 'block';
        this.isVisible = true;
        
        // Position menu
        const rect = this.element.getBoundingClientRect();
        let x = position.x;
        let y = position.y;
        
        // Adjust position if menu would go off screen
        if (x + rect.width > window.innerWidth) {
            x = window.innerWidth - rect.width;
        }
        if (y + rect.height > window.innerHeight) {
            y = window.innerHeight - rect.height;
        }
        
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
    }

    public hide(): void {
        this.element.style.display = 'none';
        this.isVisible = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }
} 