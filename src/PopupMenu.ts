import { Point } from './Piece.js';

export interface PopupMenuItem {
    text?: string;
    imageUrl?: string;
    callback: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

export class PopupMenu {
    private static instance: PopupMenu | null = null;
    private element: HTMLDivElement;
    private modalOverlay: HTMLDivElement;
    private items: PopupMenuItem[] = [];
    private isVisible: boolean = false;
    private forceKeepOpen: boolean = false;

    private constructor() {
        // Create modal overlay
        this.modalOverlay = document.createElement('div');
        this.modalOverlay.style.position = 'fixed';
        this.modalOverlay.style.top = '0';
        this.modalOverlay.style.left = '0';
        this.modalOverlay.style.width = '100%';
        this.modalOverlay.style.height = '100%';
        this.modalOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        this.modalOverlay.style.display = 'none';
        this.modalOverlay.style.zIndex = '999';
        document.body.appendChild(this.modalOverlay);

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
        
        // Close menu when clicking outside, unless forceKeepOpen is true
        document.addEventListener('mousedown', (e) => {
            if (this.isVisible && !this.element.contains(e.target as Node) && !this.forceKeepOpen) {
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

    public show(position: Point, items: PopupMenuItem[], options: { modal?: boolean, forceKeepOpen?: boolean } = {}): void {
        this.items = items;
        this.element.innerHTML = '';
        this.forceKeepOpen = options.forceKeepOpen || false;
        
        // Show/hide modal overlay
        if (options.modal) {
            this.modalOverlay.style.display = 'block';
        } else {
            this.modalOverlay.style.display = 'none';
        }
        
        // Create menu items
        items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = item.disabled ? 'not-allowed' : 'pointer';
            menuItem.style.whiteSpace = 'nowrap';
            menuItem.style.fontFamily = 'Arial, sans-serif';
            menuItem.style.color = item.disabled ? '#999' : 'inherit';
            
            // Handle hover effect
            menuItem.addEventListener('mouseenter', () => {
                if (!item.disabled) {
                    menuItem.style.backgroundColor = '#f0f0f0';
                }
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
                if (item.disabled) {
                    img.style.opacity = '0.5';
                }
                menuItem.appendChild(img);
            }
            
            // Add text
            const text = document.createElement('span');
            text.textContent = item.text || `Option ${index + 1}`;
            menuItem.appendChild(text);
            
            // Add click handler
            menuItem.addEventListener('click', () => {
                if (item.disabled) {
                    if (!item.disabledReason || item.disabledReason.trim() === '') {
                        console.error('Disabled menu item must have a non-empty disabledReason');
                        return;
                    }
                    window.alert(item.disabledReason);
                    return;
                }
                item.callback();
                if (!this.forceKeepOpen) {
                    this.hide();
                }
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
        this.modalOverlay.style.display = 'none';
        this.isVisible = false;
        this.forceKeepOpen = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }
} 