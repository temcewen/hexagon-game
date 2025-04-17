import { Point } from './Piece.js';

export interface PopupMenuItem {
    text?: string;
    imageUrl?: string;
    callback: () => void;
    disabled?: boolean;
    disabledReason?: string;
}

export interface PopupMenuOptions {
    modal?: boolean;
    forceKeepOpen?: boolean;
    previewElement?: HTMLElement;
    previewSpacing?: number; // Optional spacing between menu and preview
}

export class PopupMenu {
    private static instance: PopupMenu | null = null;
    private element: HTMLDivElement;
    private modalOverlay: HTMLDivElement;
    private items: PopupMenuItem[] = [];
    private isVisible: boolean = false;
    private forceKeepOpen: boolean = false;
    private currentPreviewElement: HTMLElement | null = null;
    private currentPreviewSpacing: number = 10; // Default spacing
    private currentMenuPosition: Point = { x: 0, y: 0 }; // Store the requested position

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

        // Create menu element
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
                // Also check if the click is on the preview element
                if (!this.currentPreviewElement || !this.currentPreviewElement.contains(e.target as Node)) {
                    this.hide();
                }
            }
        });

        // Handle resizing
        window.addEventListener('resize', () => {
            if (this.isVisible) {
                this.positionMenuAndPreview(this.currentMenuPosition);
            }
        });
    }

    public static getInstance(): PopupMenu {
        if (!PopupMenu.instance) {
            PopupMenu.instance = new PopupMenu();
        }
        return PopupMenu.instance;
    }

    private positionMenuAndPreview(position: Point): void {
        // Ensure menu element is temporarily visible to measure dimensions if needed
        const wasHidden = this.element.style.display === 'none';
        if (wasHidden) {
            this.element.style.visibility = 'hidden';
            this.element.style.display = 'block';
        }

        const menuRect = this.element.getBoundingClientRect();
        let menuX = position.x;
        let menuY = position.y;

        // Adjust menu position if it would go off screen
        if (menuX + menuRect.width > window.innerWidth) {
            menuX = window.innerWidth - menuRect.width - 5;
        }
        if (menuY + menuRect.height > window.innerHeight) {
            menuY = window.innerHeight - menuRect.height - 5;
        }
        if (menuX < 0) menuX = 5;
        if (menuY < 0) menuY = 5;

        this.element.style.left = `${menuX}px`;
        this.element.style.top = `${menuY}px`;

        // Position preview element if it exists
        if (this.currentPreviewElement) {
            const previewRect = this.currentPreviewElement.getBoundingClientRect();
            
            // Center the preview above the menu with additional offset
            let previewX = menuX + (menuRect.width / 2) - (previewRect.width / 2) - 40; // Slight left offset
            let previewY = menuY - previewRect.height - this.currentPreviewSpacing - 60; // Higher placement

            // Adjust preview position if it would go off screen
            if (previewY < 0) {
                // If not enough space above, place it below the menu
                previewY = menuY + menuRect.height + this.currentPreviewSpacing;
            }

            // Ensure preview stays within screen bounds
            if (previewX < 5) previewX = 5;
            if (previewX + previewRect.width > window.innerWidth - 5) {
                previewX = window.innerWidth - previewRect.width - 5;
            }
            if (previewY + previewRect.height > window.innerHeight - 5) {
                previewY = window.innerHeight - previewRect.height - 5;
            }

            // Apply the position
            this.currentPreviewElement.style.left = `${previewX}px`;
            this.currentPreviewElement.style.top = `${previewY}px`;
            this.currentPreviewElement.style.display = 'block';
        }

        // Restore original display state if menu was hidden for measurement
        if (wasHidden) {
            this.element.style.display = 'none';
            this.element.style.visibility = 'visible';
        }
    }

    public show(position: Point, items: PopupMenuItem[], options: PopupMenuOptions = {}): void {
        this.currentMenuPosition = position; // Store the requested position
        this.items = items;
        this.element.innerHTML = ''; // Clear previous items
        this.forceKeepOpen = options.forceKeepOpen || false;
        this.currentPreviewSpacing = options.previewSpacing ?? 10;

        // Handle preview element
        if (this.currentPreviewElement && this.currentPreviewElement.parentNode) {
            this.currentPreviewElement.parentNode.removeChild(this.currentPreviewElement); // Clean up previous preview if any
        }
        this.currentPreviewElement = options.previewElement || null;
        if (this.currentPreviewElement) {
            this.currentPreviewElement.style.position = 'fixed';
            this.currentPreviewElement.style.zIndex = '1001'; // Above menu and overlay
            this.currentPreviewElement.style.display = 'none'; // Initially hidden until positioned
            document.body.appendChild(this.currentPreviewElement);
        }

        // Show/hide modal overlay
        this.modalOverlay.style.display = options.modal ? 'block' : 'none';

        // Create menu items
        items.forEach((item, index) => {
            const menuItem = document.createElement('div');
            menuItem.style.padding = '8px 16px';
            menuItem.style.cursor = item.disabled ? 'not-allowed' : 'pointer';
            menuItem.style.whiteSpace = 'nowrap';
            menuItem.style.fontFamily = 'Arial, sans-serif';
            menuItem.style.color = item.disabled ? '#999' : 'inherit';
            menuItem.title = item.disabled ? (item.disabledReason || '') : ''; // Add tooltip for disabled reason

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
            menuItem.addEventListener('click', (event) => {
                event.stopPropagation(); // Prevent triggering the outside click listener
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

        // Show menu and position it (along with preview)
        this.element.style.display = 'block';
        this.isVisible = true;
        this.positionMenuAndPreview(this.currentMenuPosition); // Position after adding items and making visible
    }

    public hide(): void {
        this.element.style.display = 'none';
        this.modalOverlay.style.display = 'none';
        // Remove preview element from DOM
        if (this.currentPreviewElement && this.currentPreviewElement.parentNode) {
            this.currentPreviewElement.parentNode.removeChild(this.currentPreviewElement);
        }
        this.currentPreviewElement = null;
        this.isVisible = false;
        this.forceKeepOpen = false;
    }

    public isMenuVisible(): boolean {
        return this.isVisible;
    }
} 