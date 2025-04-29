import { PlayerManager, PlayerColor } from '../managers/PlayerManager.js';

export class PlayerSelectionDialog {
    private static instance: PlayerSelectionDialog | null = null;
    private dialogElement: HTMLDivElement | null = null;
    private overlayElement: HTMLDivElement | null = null;
    private resolveCallback: ((playerId: string) => void) | null = null;
    private playerManager: PlayerManager;
    
    private constructor() {
        this.playerManager = PlayerManager.getInstance();
    }
    
    public static getInstance(): PlayerSelectionDialog {
        if (!PlayerSelectionDialog.instance) {
            PlayerSelectionDialog.instance = new PlayerSelectionDialog();
        }
        return PlayerSelectionDialog.instance;
    }
    
    public initialize(): void {
        // Don't create the dialog element until it's needed
        // Just set up the player manager reference
    }
    
    private createDialogElement(): void {
        // Check if dialog already exists
        if (this.dialogElement) return;
        
        // Create overlay
        this.overlayElement = document.createElement('div');
        this.overlayElement.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            display: none;
        `;
        
        // Create dialog element
        this.dialogElement = document.createElement('div');
        this.dialogElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background-color: #222;
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0, 0, 0, 0.5);
            z-index: 1001;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            min-width: 300px;
        `;
        
        // Add title
        const title = document.createElement('h2');
        title.textContent = 'Select Player';
        title.style.marginTop = '0';
        title.style.marginBottom = '10px';
        this.dialogElement.appendChild(title);
        
        // Create a container for player buttons
        const buttonContainer = document.createElement('div');
        buttonContainer.style.cssText = `
            display: flex;
            gap: 10px;
            flex-wrap: wrap;
            justify-content: center;
        `;
        this.dialogElement.appendChild(buttonContainer);
        
        // Add to DOM
        document.body.appendChild(this.overlayElement);
        document.body.appendChild(this.dialogElement);
    }
    
    public show(): Promise<string> {
        // Create the dialog elements if they don't exist yet
        if (!this.dialogElement || !this.overlayElement) {
            this.createDialogElement();
        }
        
        return new Promise<string>((resolve) => {
            // Clear previous content
            const buttonContainer = this.dialogElement!.querySelector('div');
            if (buttonContainer) {
                buttonContainer.innerHTML = '';
                
                // Just use Player 1 and Player 2 directly
                const player1Id = this.playerManager.getPlayer1Id();
                const player2Id = this.playerManager.getPlayer2Id();
                
                // Get colors for each player
                const player1Color = this.playerManager.getPlayerColor(player1Id);
                const player2Color = this.playerManager.getPlayerColor(player2Id);
                
                // Create Player 1 button
                const button1 = document.createElement('button');
                button1.textContent = "Player 1";
                button1.style.cssText = `
                    padding: 10px 20px;
                    font-size: 16px;
                    border: none;
                    border-radius: 5px;
                    background-color: ${this.cssColorFromPlayerColor(player1Color)};
                    color: #000;
                    cursor: pointer;
                    font-weight: bold;
                `;
                
                button1.addEventListener('click', () => {
                    this.hide();
                    resolve(player1Id);
                });
                
                // Create Player 2 button
                const button2 = document.createElement('button');
                button2.textContent = "Player 2";
                button2.style.cssText = `
                    padding: 10px 20px;
                    font-size: 16px;
                    border: none;
                    border-radius: 5px;
                    background-color: ${this.cssColorFromPlayerColor(player2Color)};
                    color: #000;
                    cursor: pointer;
                    font-weight: bold;
                `;
                
                button2.addEventListener('click', () => {
                    this.hide();
                    resolve(player2Id);
                });
                
                // Add buttons to container
                buttonContainer.appendChild(button1);
                buttonContainer.appendChild(button2);
            }
            
            this.resolveCallback = resolve;
            
            // Show the dialog
            this.overlayElement!.style.display = 'block';
            this.dialogElement!.style.display = 'block';
        });
    }
    
    public hide(): void {
        if (this.dialogElement && this.overlayElement) {
            this.overlayElement.style.display = 'none';
            this.dialogElement.style.display = 'none';
        }
    }
    
    private cssColorFromPlayerColor(playerColor: PlayerColor): string {
        switch (playerColor) {
            case 'lightblue': return '#add8e6';
            case 'lightgreen': return '#90ee90';
            case 'pink': return '#ffc0cb';
            case 'purple': return '#dda0dd';
            case 'yellow': return '#ffff00';
            case 'darkorange': return '#ff8c00';
            default: return '#ffffff';
        }
    }
} 