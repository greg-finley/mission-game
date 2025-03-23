const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
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
    // We'll load assets here later
}

function create() {
    // Create a green circle as our player
    this.player = this.add.circle(400, 300, 20, 0x00ff00);
    
    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();
    
    // Add some basic instructions
    this.add.text(10, 10, 'Use arrow keys to move', {
        fontSize: '18px',
        fill: '#fff'
    });
}

function update() {
    // Handle player movement
    const speed = 4;
    
    if (this.cursors.left.isDown) {
        this.player.x -= speed;
    }
    if (this.cursors.right.isDown) {
        this.player.x += speed;
    }
    if (this.cursors.up.isDown) {
        this.player.y -= speed;
    }
    if (this.cursors.down.isDown) {
        this.player.y += speed;
    }
} 
