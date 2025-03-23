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
            gravity: { y: 300 },  // Add gravity
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
    right: false
};

function setupMobileControls() {
    // Create invisible touch zones for left and right sides of the screen
    const touchZone = document.createElement('div');
    touchZone.style.position = 'fixed';
    touchZone.style.top = '0';
    touchZone.style.left = '0';
    touchZone.style.width = '100%';
    touchZone.style.height = '100%';
    touchZone.style.zIndex = '1000';
    document.body.appendChild(touchZone);

    touchZone.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.touches[0];
        const screenWidth = window.innerWidth;
        const touchX = touch.clientX;
        const edgeSize = screenWidth * 0.2; // 20% of screen width

        if (touchX < edgeSize) {
            moveState.left = true;
            moveState.right = false;
        } else if (touchX > screenWidth - edgeSize) {
            moveState.right = true;
            moveState.left = false;
        } else {
            moveState.left = false;
            moveState.right = false;
        }
    });

    touchZone.addEventListener('touchend', (e) => {
        e.preventDefault();
        moveState.left = false;
        moveState.right = false;
    });

    touchZone.addEventListener('touchcancel', (e) => {
        e.preventDefault();
        moveState.left = false;
        moveState.right = false;
    });
}

function preload() {
    // Create a simple mission background
    const backgroundCanvas = document.createElement('canvas');
    const bgCtx = backgroundCanvas.getContext('2d');
    backgroundCanvas.width = 1600;  // Wide background for scrolling
    backgroundCanvas.height = 400;

    // Draw sky
    bgCtx.fillStyle = '#87CEEB';
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    // Draw ground
    bgCtx.fillStyle = '#8B4513';
    bgCtx.fillRect(0, backgroundCanvas.height - 50, backgroundCanvas.width, 50);

    // Draw some mission arches
    bgCtx.fillStyle = '#DEB887';
    for (let x = 100; x < backgroundCanvas.width; x += 200) {
        // Draw arch
        bgCtx.fillRect(x, 100, 100, 200);
        bgCtx.beginPath();
        bgCtx.arc(x + 50, 100, 50, Math.PI, 0);
        bgCtx.fill();
    }

    this.textures.addCanvas('background', backgroundCanvas);

    // Create the friar sprite
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

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 13;
    canvas.height = 16;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const colors = {
        'B': '#4a3728', // Brown robe
        'T': '#8b7355', // Rope belt
        'H': '#2c2c2c', // Hair/tonsure
        'F': '#e8c4a0', // Face color
        'E': '#2c2c2c', // Eyes
        'M': '#4a3728', // Mouth
        'S': '#8b7355'  // Sandals
    };

    friarData.forEach((row, y) => {
        row.split('').forEach((pixel, x) => {
            if (pixel !== ' ') {
                ctx.fillStyle = colors[pixel];
                ctx.fillRect(x, y, 1, 1);
            }
        });
    });

    const base64 = canvas.toDataURL('image/png');
    const key = 'friar';
    
    if (this.textures.exists(key)) {
        this.textures.remove(key);
    }
    
    const image = new Image();
    image.src = base64;
    
    image.onload = () => {
        this.textures.addImage(key, image);
    };
}

function create() {
    // Create scrolling background
    this.background = this.add.tileSprite(0, 0, 1600, 400, 'background');
    this.background.setOrigin(0, 0);
    this.background.setScrollFactor(0);

    // Set up world bounds
    this.physics.world.setBounds(0, 0, 1600, 400);

    // Create ground platform
    const ground = this.add.rectangle(0, this.cameras.main.height - 50, 1600, 50);
    this.physics.add.existing(ground, true);

    // Wait a short moment to ensure texture is loaded
    this.time.delayedCall(100, () => {
        // Create the friar sprite with physics
        this.player = this.physics.add.sprite(
            100,  // Start more to the left
            this.cameras.main.height - 100,  // Just above ground
            'friar'
        );
        
        // Scale the sprite to be more visible
        const scaleFactor = Math.min(
            this.cameras.main.width / 100,
            this.cameras.main.height / 100
        );
        this.player.setScale(scaleFactor);
        
        // Set up physics properties
        this.player.setCollideWorldBounds(true);
        this.physics.add.collider(this.player, ground);
        
        // Enable input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Set up camera to follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 1600, 400);
    });

    // Set up mobile controls
    setupMobileControls();

    // Add touch instructions
    const instructions = this.add.text(10, 10,
        'Touch edges of screen to move',
        {
            fontSize: '18px',
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 10, y: 5 }
        }
    );
    instructions.setScrollFactor(0);
}

function update() {
    if (!this.player) return;
    
    const speed = 200;
    
    // Combine keyboard and touch input
    const moveLeft = this.cursors.left.isDown || moveState.left;
    const moveRight = this.cursors.right.isDown || moveState.right;
    
    if (moveLeft) {
        this.player.setVelocityX(-speed);
        this.player.setFlipX(true);
        this.background.tilePositionX -= 2;  // Scroll background
    } else if (moveRight) {
        this.player.setVelocityX(speed);
        this.player.setFlipX(false);
        this.background.tilePositionX += 2;  // Scroll background
    } else {
        this.player.setVelocityX(0);
    }
} 
