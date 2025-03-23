const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'body',
        width: '100%',
        height: '100%'
    },
    pixelArt: true,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    },
    scene: {
        preload: preload,
        create: create,
        update: update
    }
};

const game = new Phaser.Game(config);

// Track movement state for mobile controls
let moveState = {
    left: false,
    right: false,
    up: false,
    down: false
};

function setupMobileControls() {
    // Only show mobile controls on touch devices
    if ('ontouchstart' in window) {
        const controls = document.getElementById('mobile-controls');
        controls.style.display = 'flex';

        const buttons = {
            left: document.getElementById('btn-left'),
            right: document.getElementById('btn-right'),
            up: document.getElementById('btn-up'),
            down: document.getElementById('btn-down')
        };

        // Helper function to handle button events
        const handleButton = (direction, isDown) => {
            moveState[direction] = isDown;
        };

        // Set up touch events for each button
        Object.entries(buttons).forEach(([direction, button]) => {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleButton(direction, true);
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleButton(direction, false);
            });

            // Handle touch cancel
            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                handleButton(direction, false);
            });
        });
    }
}

function preload() {
    // Create a more detailed 8-bit friar sprite
    const friarData = [
        '     HHH     ',  // Head
        '    HHHHH    ',
        '    FFFFF    ',  // Face
        '    FEFEF    ',  // Eyes
        '     FMF     ',  // Mouth
        '    BBBBB    ',  // Neck/shoulders
        '   BBBBBBB   ',  // Upper robe
        '  BBBBBBBBB  ',
        ' BBBBBBBBBBB ',
        ' BBBBTBTBBBB ',  // Rope belt (T)
        ' BBBBBBBBBBB ',
        '  BBBBBBBBB  ',  // Lower robe
        '  BBBBBBBBB  ',
        '   BBBBBBB   ',
        '   BB B BB   ',  // Feet
        '   SS S SS   '   // Sandals
    ];

    // Convert the ASCII art to a pixel data URL
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 13;
    canvas.height = 16;

    // Clear the canvas first
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Color palette
    const colors = {
        'B': '#4a3728', // Brown robe
        'T': '#8b7355', // Rope belt
        'H': '#2c2c2c', // Hair/tonsure
        'F': '#e8c4a0', // Face color
        'E': '#2c2c2c', // Eyes
        'M': '#4a3728', // Mouth
        'S': '#8b7355'  // Sandals
    };

    // Draw the friar
    friarData.forEach((row, y) => {
        row.split('').forEach((pixel, x) => {
            if (pixel !== ' ') {
                ctx.fillStyle = colors[pixel];
                ctx.fillRect(x, y, 1, 1);
            }
        });
    });

    // Force the texture to update
    const base64 = canvas.toDataURL('image/png');
    const key = 'friar';
    
    // Remove any existing texture with this key
    if (this.textures.exists(key)) {
        this.textures.remove(key);
    }
    
    // Create a new image and add it to the texture manager
    const image = new Image();
    image.src = base64;
    
    image.onload = () => {
        this.textures.addImage(key, image);
    };
}

function create() {
    // Set up mobile controls
    setupMobileControls();

    // Wait a short moment to ensure texture is loaded
    this.time.delayedCall(100, () => {
        // Create the friar sprite
        this.player = this.add.sprite(
            this.cameras.main.centerX,
            this.cameras.main.centerY,
            'friar'
        );
        
        // Scale the sprite to be more visible but consider screen size
        const scaleFactor = Math.min(
            this.cameras.main.width / 100,
            this.cameras.main.height / 100
        );
        this.player.setScale(scaleFactor);
        
        // Enable input only after sprite is created
        this.cursors = this.input.keyboard.createCursorKeys();
    });
    
    // Add some basic instructions - position relative to screen size
    const instructions = this.add.text(10, 10,
        'Use arrow keys or on-screen buttons to move',
        {
            fontSize: '18px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 10, y: 5 }
        }
    );
    instructions.setScrollFactor(0);
}

function update() {
    // Only move if player exists
    if (!this.player) return;
    
    // Handle player movement
    const speed = 4;
    
    // Combine keyboard and touch input
    const moveLeft = this.cursors.left.isDown || moveState.left;
    const moveRight = this.cursors.right.isDown || moveState.right;
    const moveUp = this.cursors.up.isDown || moveState.up;
    const moveDown = this.cursors.down.isDown || moveState.down;
    
    if (moveLeft) {
        this.player.x -= speed;
        this.player.setFlipX(true);
    }
    if (moveRight) {
        this.player.x += speed;
        this.player.setFlipX(false);
    }
    if (moveUp) {
        this.player.y -= speed;
    }
    if (moveDown) {
        this.player.y += speed;
    }

    // Keep player within bounds
    this.player.x = Phaser.Math.Clamp(
        this.player.x,
        this.player.width / 2,
        this.cameras.main.width - this.player.width / 2
    );
    this.player.y = Phaser.Math.Clamp(
        this.player.y,
        this.player.height / 2,
        this.cameras.main.height - this.player.height / 2
    );
} 
