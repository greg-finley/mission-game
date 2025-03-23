const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    // Wait a short moment to ensure texture is loaded
    this.time.delayedCall(100, () => {
        // Create the friar sprite
        this.player = this.add.sprite(400, 300, 'friar');
        
        // Scale the sprite to be more visible
        this.player.setScale(5);
        
        // Enable input only after sprite is created
        this.cursors = this.input.keyboard.createCursorKeys();
    });
    
    // Add some basic instructions
    this.add.text(10, 10, 'Use arrow keys to move', {
        fontSize: '18px',
        fill: '#fff'
    });
}

function update() {
    // Only move if player exists
    if (!this.player) return;
    
    // Handle player movement
    const speed = 4;
    
    if (this.cursors.left.isDown) {
        this.player.x -= speed;
        this.player.setFlipX(true);
    }
    if (this.cursors.right.isDown) {
        this.player.x += speed;
        this.player.setFlipX(false);
    }
    if (this.cursors.up.isDown) {
        this.player.y -= speed;
    }
    if (this.cursors.down.isDown) {
        this.player.y += speed;
    }
} 
