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

// Track doors and their interaction zones
let doors = [];
let currentDoor = null;

// Add game dimensions
const GAME_WIDTH = 1600;  // Fixed game width
const GAME_HEIGHT = 400;
const WALL_WIDTH = 20;
let rightWall = null;
let doorsPassed = 0;

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

        // Check if we're touching a door when we're near one
        if (currentDoor && touchX > edgeSize && touchX < screenWidth - edgeSize) {
            showDoorMessage();
            return;
        }

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
    // Create a mission background with left wall
    const backgroundCanvas = document.createElement('canvas');
    const bgCtx = backgroundCanvas.getContext('2d');
    backgroundCanvas.width = GAME_WIDTH;
    backgroundCanvas.height = GAME_HEIGHT;

    // Draw sky
    bgCtx.fillStyle = '#87CEEB';
    bgCtx.fillRect(0, 0, backgroundCanvas.width, backgroundCanvas.height);

    // Draw ground
    bgCtx.fillStyle = '#8B4513';
    bgCtx.fillRect(0, backgroundCanvas.height - 50, backgroundCanvas.width, 50);

    // Draw left wall
    bgCtx.fillStyle = '#8B4513';
    bgCtx.fillRect(0, 0, WALL_WIDTH, backgroundCanvas.height);

    // Draw mission arches starting after the left wall
    bgCtx.fillStyle = '#DEB887';
    const archWidth = 80;   // Slightly smaller arches
    const doorWidth = 50;   // Door width
    const spacing = 30;     // Reduced spacing
    const totalWidth = GAME_WIDTH - (2 * WALL_WIDTH);
    const setWidth = (archWidth * 2 + doorWidth + spacing * 3);  // Width of one set
    
    // Calculate positions for alternating windows and doors
    for (let i = 0; i < 5; i++) {  // 5 sets of window-door-window
        const setStart = WALL_WIDTH + (i * setWidth);
        
        // First window
        const window1X = setStart + spacing;
        bgCtx.fillRect(window1X, 100, archWidth, 200);
        bgCtx.beginPath();
        bgCtx.arc(window1X + archWidth/2, 100, archWidth/2, Math.PI, 0);
        bgCtx.fill();

        // Door
        const doorX = window1X + archWidth + spacing;
        bgCtx.fillStyle = '#C19A6B';  // Door frame color
        bgCtx.fillRect(doorX - doorWidth/2, backgroundCanvas.height - 200, doorWidth, 200);
        bgCtx.fillStyle = '#8B4513';  // Door color
        bgCtx.fillRect(doorX - (doorWidth/2 - 5), backgroundCanvas.height - 195, doorWidth - 10, 190);
        
        // Add door number above the door
        bgCtx.fillStyle = '#000000';  // Black text
        bgCtx.font = '24px Arial';
        bgCtx.textAlign = 'center';
        bgCtx.fillText((i + 1).toString(), doorX, backgroundCanvas.height - 220);
        
        bgCtx.fillStyle = '#DEB887';  // Back to arch color

        // Second window
        const window2X = doorX + doorWidth/2 + spacing;
        bgCtx.fillRect(window2X, 100, archWidth, 200);
        bgCtx.beginPath();
        bgCtx.arc(window2X + archWidth/2, 100, archWidth/2, Math.PI, 0);
        bgCtx.fill();
    }

    this.textures.addCanvas('background', backgroundCanvas);

    // Create the friar sprites with direction-specific faces
    const friarStandingRight = [
        '     HHH     ',  // Head
        '    HHHHH    ',
        '    FFFFF    ',  // Face
        '    FEFEF    ',  // Eyes (centered)
        '     FMF     ',  // Mouth (centered)
        '    BBBBB    ',  // Neck/shoulders
        '   BBBBBBB   ',  // Upper robe
        '  BBBBBBBBB  ',
        ' BBBBBBBBBBB ',
        ' BBBBTBTBBBB ',  // Rope belt (T)
        ' BBBBBBBBBBB ',
        '  BBBBBBBBB  ',  // Lower robe
        '  BBBBBBBBB  ',
        '   BBBBBBB   ',
        '    BB BB    ',  // Feet together
        '    SS SS    '   // Sandals together
    ];

    const friarStandingLeft = [
        '     HHH     ',  // Head
        '    HHHHH    ',
        '    FFFFF    ',  // Face
        '    FEFEF    ',  // Eyes (centered)
        '     FMF     ',  // Mouth (centered)
        '    BBBBB    ',  // Neck/shoulders
        '   BBBBBBB   ',  // Upper robe
        '  BBBBBBBBB  ',
        ' BBBBBBBBBBB ',
        ' BBBBTBTBBBB ',  // Rope belt (T)
        ' BBBBBBBBBBB ',
        '  BBBBBBBBB  ',  // Lower robe
        '  BBBBBBBBB  ',
        '   BBBBBBB   ',
        '    BB BB    ',  // Feet together
        '    SS SS    '   // Sandals together
    ];

    const friarWalkingRight = [
        '     HHH     ',  // Head
        '    HHHHH    ',
        '    FFFFF    ',  // Face
        '    FEFEF    ',  // Eyes (centered)
        '     FMF     ',  // Mouth (centered)
        '    BBBBB    ',  // Neck/shoulders
        '   BBBBBBB   ',  // Upper robe
        '  BBBBBBBBB  ',
        ' BBBBBBBBBBB ',
        ' BBBBTBTBBBB ',  // Rope belt (T)
        ' BBBBBBBBBBB ',
        '  BBBBBBBBB  ',  // Lower robe
        '  BBBBBBBBB  ',
        '   BBBBBBB   ',
        '     BB  BB  ',  // Right foot forward
        '     SS  SS  '   // Right sandal forward
    ];

    const friarWalkingLeft = [
        '     HHH     ',  // Head
        '    HHHHH    ',
        '    FFFFF    ',  // Face
        '    FEFEF    ',  // Eyes (centered)
        '     FMF     ',  // Mouth (centered)
        '    BBBBB    ',  // Neck/shoulders
        '   BBBBBBB   ',  // Upper robe
        '  BBBBBBBBB  ',
        ' BBBBBBBBBBB ',
        ' BBBBTBTBBBB ',  // Rope belt (T)
        ' BBBBBBBBBBB ',
        '  BBBBBBBBB  ',  // Lower robe
        '  BBBBBBBBB  ',
        '   BBBBBBB   ',
        '  BB  BB     ',  // Left foot forward
        '  SS  SS     '   // Left sandal forward
    ];

    const colors = {
        'B': '#4a3728', // Brown robe
        'T': '#8b7355', // Rope belt
        'H': '#2c2c2c', // Hair/tonsure
        'F': '#e8c4a0', // Face color
        'E': '#2c2c2c', // Eyes
        'M': '#4a3728', // Mouth
        'S': '#8b7355'  // Sandals
    };

    // Create all four frames for animation
    const frames = {
        'stand-right': friarStandingRight,
        'stand-left': friarStandingLeft,
        'walk-right': friarWalkingRight,
        'walk-left': friarWalkingLeft
    };

    Object.entries(frames).forEach(([name, sprite]) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 13;
        canvas.height = 16;

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        sprite.forEach((row, y) => {
            row.split('').forEach((pixel, x) => {
                if (pixel !== ' ') {
                    ctx.fillStyle = colors[pixel];
                    ctx.fillRect(x, y, 1, 1);
                }
            });
        });

        this.textures.addCanvas(`friar-${name}`, canvas);
    });
}

function showDoorMessage() {
    // Remove any existing message
    if (this.doorMessage) {
        this.doorMessage.destroy();
    }

    // Show the message
    this.doorMessage = this.add.text(
        this.cameras.main.centerX,
        this.cameras.main.centerY - 50,
        'You tapped the door!',
        {
            fontSize: '24px',
            fill: '#fff',
            backgroundColor: '#000',
            padding: { x: 20, y: 10 }
        }
    );
    this.doorMessage.setOrigin(0.5);
    this.doorMessage.setScrollFactor(0);

    // Remove the message after 2 seconds
    this.time.delayedCall(2000, () => {
        if (this.doorMessage) {
            this.doorMessage.destroy();
            this.doorMessage = null;
        }
    });
}

function create() {
    // Create static background (no scrolling)
    this.background = this.add.image(0, 0, 'background');
    this.background.setOrigin(0, 0);

    // Set up world bounds with left wall
    this.physics.world.setBounds(WALL_WIDTH, 0, GAME_WIDTH - WALL_WIDTH, GAME_HEIGHT);

    // Create ground platform
    const ground = this.add.rectangle(0, this.cameras.main.height - 50, GAME_WIDTH, 50);
    this.physics.add.existing(ground, true);

    // Create left wall with proper collision
    const leftWall = this.add.rectangle(WALL_WIDTH/2, GAME_HEIGHT/2, WALL_WIDTH, GAME_HEIGHT);
    this.physics.add.existing(leftWall, true);

    // Create door interaction zones
    doors = [];
    const archWidth = 80;   // Match the preload values
    const doorWidth = 50;
    const spacing = 30;
    const setWidth = (archWidth * 2 + doorWidth + spacing * 3);
    
    for (let i = 0; i < 5; i++) {
        const setStart = WALL_WIDTH + (i * setWidth);
        const doorX = setStart + spacing + archWidth + spacing + doorWidth/2;
        
        const doorZone = this.add.rectangle(doorX, this.cameras.main.height - 100, 60, 200, 0xffff00, 0);
        this.physics.add.existing(doorZone, true);
        doorZone.doorNumber = i + 1;
        doors.push(doorZone);

        // Add glow effect
        const glow = this.add.rectangle(doorX, this.cameras.main.height - 100, 70, 210, 0xffff00, 0);
        glow.setStrokeStyle(6, 0xffff00, 1);
        glow.setVisible(false);
        doorZone.glowEffect = glow;
    }

    // Wait a short moment to ensure texture is loaded
    this.time.delayedCall(100, () => {
        // Create the friar sprite with physics
        this.player = this.physics.add.sprite(
            100,
            this.cameras.main.height - 100,
            'friar-stand-right'
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
        this.physics.add.collider(this.player, leftWall);  // Add collision with left wall

        // Enable input
        this.cursors = this.input.keyboard.createCursorKeys();

        // Set up camera to follow player
        this.cameras.main.startFollow(this.player);
        this.cameras.main.setBounds(0, 0, 1600, 400);

        // Add overlap detection with door zones
        doors.forEach(door => {
            this.physics.add.overlap(this.player, door, () => {
                currentDoor = door;
                door.glowEffect.setVisible(true);
            });
        });
    });

    // Set up mobile controls
    setupMobileControls();

    // Add touch instructions
    const instructions = this.add.text(10, 10,
        'Touch edges to move, tap door to enter',
        {
            fontSize: '18px',
            fill: '#000',
            backgroundColor: '#fff',
            padding: { x: 10, y: 5 }
        }
    );
    instructions.setScrollFactor(0);

    // Add keyboard interaction for doors
    this.input.keyboard.on('keydown-SPACE', () => {
        if (currentDoor) {
            showDoorMessage.call(this);
        }
    });
}

function update() {
    if (!this.player) return;
    
    const speed = 200;
    
    // Combine keyboard and touch input
    const moveLeft = this.cursors.left.isDown || moveState.left;
    const moveRight = this.cursors.right.isDown || moveState.right;
    
    if (moveLeft) {
        this.player.setVelocityX(-speed);
        this.player.setTexture(Math.floor(Date.now() / 150) % 2 === 0 ? 'friar-walk-left' : 'friar-stand-left');
    } else if (moveRight) {
        this.player.setVelocityX(speed);
        this.player.setTexture(Math.floor(Date.now() / 150) % 2 === 0 ? 'friar-walk-right' : 'friar-stand-right');
    } else {
        this.player.setVelocityX(0);
        const currentTexture = this.player.texture.key;
        const isLookingLeft = currentTexture.includes('left');
        this.player.setTexture(`friar-stand-${isLookingLeft ? 'left' : 'right'}`);
    }

    // Update door glow effects and check for passed doors
    let nearDoor = false;
    doors.forEach(door => {
        if (this.physics.overlap(this.player, door)) {
            nearDoor = true;
            currentDoor = door;
            door.glowEffect.setVisible(true);
            door.glowEffect.x = door.x;
            door.glowEffect.y = door.y;

            // Check if we've passed this door
            if (this.player.x > door.x && door.doorNumber > doorsPassed) {
                doorsPassed = door.doorNumber;
                
                // If we've passed the fifth door and haven't created the right wall yet
                if (doorsPassed === 5 && !rightWall) {
                    // Create right wall at the last door's position plus some space
                    const wallX = door.x + 200;
                    rightWall = this.add.rectangle(wallX, 200, WALL_WIDTH, 400, 0x8B4513);
                    this.physics.add.existing(rightWall, true);
                    
                    // Update world bounds
                    this.physics.world.setBounds(WALL_WIDTH, 0, wallX + WALL_WIDTH/2, 400);
                }
            }
        } else {
            door.glowEffect.setVisible(false);
        }
    });

    if (!nearDoor) {
        currentDoor = null;
    }
} 
