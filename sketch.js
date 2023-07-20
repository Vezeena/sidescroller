/*

The Game Project 7.1 - Platforms, Enemies

Week 20

*/
let gameStart;

let gameCharX;
let gameCharY;
let floorPosY;
let scrollPos;
let gameCharWorldX;

let isLeft;
let isRight;
let isFalling;
let isPlummeting;
let onPlatform;

let canyons;
let collectables;
let platforms;
let obstacles;

let mountains;
let clouds;
let stars;
let treesX;
let signpostX;

let colours;

let gameScore;
let scoreCookie;
let flagpole;
let lives;

let enemies;

let jumpSound;
let fallingSound;
let gameOverSound;
let flagpoleSound;
let winGameSound;
let winGamePlayed;
let cookieSound;
let backgroundSound;
let monsterSound;

function preload() {
  soundFormats("mp3", "wav");

  //load sounds here
  jumpSound = loadSound("assets/jump.wav");
  jumpSound.setVolume(0.5);

  fallingSound = loadSound("assets/falling.wav");
  fallingSound.setVolume(0.2);

  gameOverSound = loadSound("assets/gameOver.wav");
  gameOverSound.setVolume(0.4);

  flagpoleSound = loadSound("assets/flagpole.wav");
  flagpoleSound.setVolume(0.1);

  winGameSound = loadSound("assets/winGame.wav");
  winGameSound.setVolume(0.4);

  cookieSound = loadSound("assets/cookie.wav");
  cookieSound.setVolume(0.4);

  backgroundSound = loadSound("assets/background.wav");
  backgroundSound.setVolume(0.3);

  monsterSound = loadSound("assets/monster.wav");
  monsterSound.setVolume(0.2);
}

function setup() {
  createCanvas(1024, 635);
  floorPosY = (height * 3) / 4;

  // in setup to keep pattern randomised only once per playthrough
  stars = [];
  for (let i = 0; i < 100; i++) {
    stars.push({
      posX: random() * 3 * width,
      posY: random() * floorPosY,
      size: random() / 2,
    });
  }

  // start lives
  lives = 3;

  // set start gamestate  - in setup for first time only
  gameStart = false;
  startGame();
}

function draw() {
  // fill sky with sky colour
  background(colours.sky);

  // stars, made to scroll at a slower rate than the game scroll, for a nicer
  // effect
  push();
  translate(scrollPos / 4, 0);
  for (let i = 0; i < stars.length; i++) {
    drawStar(stars[i]);
  }
  pop();

  // draw main body of floor
  noStroke();
  fill(colours.floor);
  rect(0, floorPosY, width, height - floorPosY);
  // small ledge atop floor
  fill(colours.floorTop);
  rect(0, floorPosY, width, 5);

  push();
  translate(scrollPos / 2, 0);
  // clouds behind the mountains, made to scroll at a slower rate than game scroll,
  // for a nicer effect
  for (let i = 0; i < clouds.length; i++) {
    if (!clouds[i].inFront) {
      drawCloud(clouds[i]);
    }
  }
  pop();

  push();
  translate(scrollPos, 0);

  // clouds in front of the mountains
  for (let i = 0; i < clouds.length; i++) {
    if (clouds[i].inFront) {
      drawCloud(clouds[i]);
    }
  }

  // mountains
  drawMountains();

  // trees
  drawTrees();

  // platforms
  for (let i = 0; i < platforms.length; i++) {
    platforms[i].draw();
  }

  //obstacles
  for (let i = 0; i < obstacles.length; i++) {
    obstacles[i].draw();
  }

  // canyons
  for (let i = 0; i < canyons.length; i++) {
    drawCanyon(canyons[i]);
    checkCanyon(canyons[i]);
  }

  // start signpost
  drawSignPost();

  // collectables
  for (let i = 0; i < collectables.length; i++) {
    if (!collectables[i].isFound) {
      drawCollectable(collectables[i]);
      checkCollectable(collectables[i]);
    }
  }

  // flagpole
  drawFlagpole();

  // enemies
  for (let i = 0; i < enemies.length; i++) {
    enemies[i].draw();
    const isContact = enemies[i].checkContact(gameCharWorldX, gameCharY);
    if (isContact) {
      if (lives > 0) {
        monsterSound.play();
        lives -= 1;
        startGame();
        break;
      }
    }
  }

  pop();

  // if statement to make character disappear at the end
  if (!flagpole.inUfo) {
    drawGameChar();
  }

  // game score
  drawScore();

  // lives
  checkCanyonDeath();
  drawLives();

  // begin screen
  if (!gameStart) {
    drawTextScreen("Press space to start. W, A, S, D, or arrow keys to move.");
    return;
  }

  // end screens
  if (lives < 1) {
    drawTextScreen("Game over. Press space to restart.");
    if (!gameOverSound.isPlaying()) {
      backgroundSound.stop();
      gameOverSound.play();
    }
    return;
  }

  if (flagpole.isReached && flagpole.inUfo) {
    drawWinScreen();
    if (!winGamePlayed) {
      winGameSound.play();
      winGamePlayed = true;
    }
    return;
  }

  //--------------------------
  // Game Character Logic
  //--------------------------

  // make character plummet when over canyon
  if (isPlummeting) {
    gameCharY += 5;
  }

  // scroll right when walking left
  if (isLeft && !flagpole.isReached && gameCharWorldX > signpostX) {
    const oldGameCharX = gameCharX;
    const oldScrollPos = scrollPos;
    if (gameCharX > width * 0.2) {
      gameCharX -= 5;
    } else {
      scrollPos += 5;
    }

    let inObstacle = false;
    for (let i = 0; i < obstacles.length; i++) {
      if (obstacles[i].checkXContact(gameCharX - scrollPos, gameCharY)) {
        inObstacle = true;
        break;
      }
    }
    if (inObstacle) {
      gameCharX = oldGameCharX;
      scrollPos = oldScrollPos;
    }
  }

  // scroll left when walking right
  if (isRight && !flagpole.isReached) {
    const oldGameCharX = gameCharX;
    const oldScrollPos = scrollPos;
    if (gameCharX < width * 0.8) {
      gameCharX += 5;
    } else {
      scrollPos -= 5; // negative for moving against the background
    }

    let inObstacle = false;
    for (let i = 0; i < obstacles.length; i++) {
      if (obstacles[i].checkXContact(gameCharWorldX, gameCharY)) {
        inObstacle = true;
        break;
      }
    }
    if (inObstacle) {
      gameCharX = oldGameCharX;
      scrollPos = oldScrollPos;
    }
  }

  // update real position of gameChar for collision detection
  gameCharWorldX = gameCharX - scrollPos;

  // jumping with platforms logic
  isFalling = false;

  if (gameCharY < floorPosY) {
    let isContact = false;
    onPlatform = false;
    for (let i = 0; i < platforms.length; i++) {
      if (platforms[i].checkContact(gameCharWorldX, gameCharY)) {
        isContact = true;
        onPlatform = true;
        gameCharY = platforms[i].y;
        break;
      }
    }
    for (let i = 0; i < obstacles.length; i++) {
      if (obstacles[i].checkYContact(gameCharWorldX, gameCharY)) {
        isContact = true;
        gameCharY = obstacles[i].y;
        break;
      }
    }
    if (!isContact) {
      isFalling = true;
      gameCharY += 3;
    }
  }

  // check flagpole
  // make game character float into ufo if true
  if (flagpole.isReached == false) {
    checkFlagpole();
  } else {
    gameCharY -= 6;
    if (!flagpoleSound.isPlaying()) {
      backgroundSound.setVolume(0.1);
      flagpoleSound.play();
    }
  }

  // check ufo is reached
  if (
    gameCharY <= flagpole.posY + 25 &&
    gameCharWorldX >= flagpole.posX - 50 &&
    gameCharWorldX <= flagpole.posX + 50
  ) {
    flagpole.inUfo = true;
    flagpoleSound.stop();
  }
}

// ---------------------
// General Functions
// ---------------------

function startGame() {
  gameCharX = width / 4;
  gameCharY = floorPosY;

  // signpost x position
  signpostX = 40;

  // black and white for frequent and easier use with
  // lerpColor and as a palette
  colours = {
    sky: color(12, 4, 61),
    character: color(168, 255, 125),
    black: color(0, 0, 0),
    white: color(255, 255, 255),
    floor: color(206, 102, 192),
    floorTop: color(241, 176, 242),
    canyonEdge: color(173, 77, 164),
  };

  // set game score
  gameScore = 0;
  scoreCookie = {
    posX: 30,
    posY: 55,
    size: 0.5,
  };

  // end marker (ufo)
  flagpole = {
    posX: 3900,
    size: 0.7,
    posY: height - floorPosY,
    isReached: false,
    inUfo: false,
  };

  // boolean variables to control the movement of the game character
  isLeft = false;
  isRight = false;
  isFalling = false;
  isPlummeting = false;
  onPlatform = false;

  // variable to stop win game sound playing more than once per playthrough
  winGamePlayed = false;

  // play background sound
  backgroundSound.setVolume(0.3);
  if (gameStart && !backgroundSound.isPlaying()) {
    backgroundSound.loop();
  }

  // variable to control the background scrolling
  scrollPos = 0;

  // variable to store the real position of the gameChar in the game
  // world. Needed for collision detection
  gameCharWorldX = gameCharX - scrollPos;

  // // enemies
  enemies = [];

  enemies.push(new Enemy(1350, floorPosY - 30, 250));
  enemies.push(new Enemy(1000, floorPosY - 30, 300));

  enemies.push(new Enemy(2215, floorPosY - 30, 175));
  enemies.push(new Enemy(2175, floorPosY - 255, 150));

  enemies.push(new Enemy(3560, floorPosY - 30, 200));

  // pink platforms
  platforms = [];

  platforms.push(createPlatform(475, floorPosY - 75, 100));
  platforms.push(createPlatform(575, floorPosY - 125, 100));

  platforms.push(createPlatform(1200, floorPosY - 75, 100));

  platforms.push(createPlatform(2200, floorPosY - 75, 100));
  platforms.push(createPlatform(2200, floorPosY - 150, 100));
  platforms.push(createPlatform(2200, floorPosY - 225, 100));
  platforms.push(createPlatform(2200, floorPosY - 300, 100));

  platforms.push(createPlatform(3510, floorPosY - 110, 75));
  platforms.push(createPlatform(3620, floorPosY - 60, 75));

  // green obstacles
  obstacles = [];

  obstacles.push(createObstacle(2935, floorPosY - 55, 50));
  obstacles.push(createObstacle(3060, floorPosY - 75, 70));
  obstacles.push(createObstacle(3195, floorPosY - 130, 60));
  obstacles.push(createObstacle(3320, floorPosY - 95, 55));
  obstacles.push(createObstacle(3425, floorPosY - 158, 45));

  // initialise arrays of scenery objects.
  treesX = [0, 420, 500, 750, 1450, 1700, 2100, 2300, 2500, 2900];

  // size property: values > 1 increase size, values < 1 decrease,
  // with 1 being original size
  // inFront property: dictates whether in front of mountains or not
  clouds = [
    {
      posX: 300,
      posY: 300,
      size: 0.7,
      inFront: true,
    },
    {
      posX: 150,
      posY: 375,
      size: 0.5,
      inFront: false,
    },
    {
      posX: 700,
      posY: 125,
      size: 0.25,
      inFront: false,
    },
    {
      posX: 1150,
      posY: 350,
      size: 0.2,
      inFront: false,
    },
    {
      posX: 1450,
      posY: 200,
      size: 0.8,
      inFront: false,
    },
    {
      posX: 1950,
      posY: 350,
      size: 0.2,
      inFront: true,
    },
    {
      posX: 2150,
      posY: 100,
      size: 0.6,
      inFront: true,
    },
    {
      posX: 3050,
      posY: 275,
      size: 0.45,
      inFront: true,
    },
  ];

  mountains = [
    {
      posX: 150,
      width: 250,
      height: 225,
    },
    {
      posX: 400,
      width: 130,
      height: 200,
    },
    {
      posX: 1050,
      width: 200,
      height: 200,
    },
    {
      posX: 1750,
      width: 180,
      height: 300,
    },
    {
      posX: 2170,
      width: 205,
      height: 175,
    },
    {
      posX: 3100,
      width: 250,
      height: 225,
    },
  ];

  canyons = [
    {
      posX: 600,
      width: 175,
    },
    {
      posX: 850,
      width: 90,
    },
    {
      posX: 1500,
      width: 110,
    },
    {
      posX: 1950,
      width: 100,
    },
    {
      posX: 2400,
      width: 80,
    },
    {
      posX: 2750,
      width: 120,
    },
    {
      posX: 3130,
      width: 68,
    },
  ];

  // size property: values > 1 increase size, values < 1 decrease,
  // with 1 being original size
  collectables = [
    {
      posX: 410,
      posY: floorPosY - 40,
      size: 0.35,
      isFound: false,
    },

    {
      posX: 750,
      posY: floorPosY - 175,
      size: 0.5,
      isFound: false,
    },
    {
      posX: 800,
      posY: floorPosY - 26,
      size: 0.35,
      isFound: false,
    },
    {
      posX: 1025,
      posY: floorPosY - 113,
      size: 0.5,
      isFound: false,
    },
    {
      posX: 1355,
      posY: floorPosY - 93,
      size: 0.5,
      isFound: false,
    },
    {
      posX: 1850,
      posY: floorPosY - 84,
      size: 0.45,
      isFound: false,
    },
    // cookie atop ladder
    {
      posX: 2250,
      posY: floorPosY - 350,
      size: 0.7,
      isFound: false,
    },
    {
      posX: 2450,
      posY: floorPosY - 146,
      size: 0.35,
      isFound: false,
    },
    {
      posX: 2805,
      posY: floorPosY - 91,
      size: 0.4,
      isFound: false,
    },
    // cookie between obstacles
    {
      posX: 3290,
      posY: floorPosY - 25,
      size: 0.2,
      isFound: false,
    },
    // cookie atop final obstacle
    {
      posX: 3447,
      posY: floorPosY - 185,
      size: 0.6,
      isFound: false,
    },
    {
      posX: 3547,
      posY: floorPosY - 35,
      size: 0.25,
      isFound: false,
    },
  ];
}

// ---------------------
// Keyboard Functions
// ---------------------

function keyPressed() {
  // Game start screen
  if (!gameStart) {
    if (keyCode == 32) {
      gameStart = true;
      startGame();
    }
    return;
  }

  // Game over screen
  if (flagpole.inUfo || lives < 1) {
    if (keyCode == 32) {
      gameOverSound.stop();
      startGame();
      lives = 3;
    }
    return;
  }

  if (keyCode == 65 || keyCode == 37) {
    isLeft = true;
  }

  if (keyCode == 68 || keyCode == 39) {
    isRight = true;
  }

  if (
    (keyCode == 87 || keyCode == 32 || keyCode == 38) &&
    !isFalling &&
    !isPlummeting
  ) {
    gameCharY -= 100;
    jumpSound.play();
  }

  if ((keyCode == 40 || keyCode == 83) && onPlatform) {
    gameCharY += 10;
    isFalling = true;
  }
}

function keyReleased() {
  if (keyCode == 65 || keyCode == 37) {
    isLeft = false;
  }

  if (keyCode == 68 || keyCode == 39) {
    isRight = false;
  }
}

// ---------------------
// Draw Functions
// ---------------------

// function to draw the mountains
function drawMountains() {
  // mountains
  for (let i = 0; i < mountains.length; i++) {
    // front face of mountain
    fill(230, 104, 53);
    triangle(
      mountains[i].posX - mountains[i].width / 2,
      floorPosY,
      mountains[i].posX + mountains[i].width / 2,
      floorPosY,
      mountains[i].posX,
      floorPosY - mountains[i].height
    );
    // side face of mountain
    fill(154, 57, 20);
    triangle(
      mountains[i].posX + mountains[i].width / 2,
      floorPosY,
      mountains[i].posX + mountains[i].width,
      floorPosY,
      mountains[i].posX,
      floorPosY - mountains[i].height
    );
  }
}

// function to draw the trees
function drawTrees() {
  // trees
  for (let i = 0; i < treesX.length; i++) {
    // left tree trunk and left branches
    fill(99, 89, 53);
    rect(treesX[i] - 10, floorPosY - 150, 20, 150);
    stroke(99, 89, 53);
    strokeWeight(5);
    line(treesX[i] - 3, floorPosY - 100, treesX[i] - 28, floorPosY - 110);
    line(treesX[i] - 3, floorPosY - 82, treesX[i] - 35, floorPosY - 102);
    // right tree trunk, right branches and corresponding leaves
    noStroke();
    fill(70, 179, 8);
    ellipse(treesX[i] + 30, floorPosY - 124, 45, 45);
    stroke(99, 89, 53);
    strokeWeight(5);
    fill(99, 89, 53);
    line(treesX[i] + 8, floorPosY - 119, treesX[i] + 20, floorPosY - 144);
    fill(142, 118, 92);
    line(treesX[i] + 8, floorPosY - 99, treesX[i] + 20, floorPosY - 119);
    noStroke();
    fill(142, 118, 92);
    rect(treesX[i] - 3, floorPosY - 150, 13, 150);
    // top of tree leaves
    fill(16, 176, 6);
    ellipse(treesX[i] - 33, floorPosY - 115, 50, 52);

    fill(74, 182, 11);
    ellipse(treesX[i] - 30, floorPosY - 112, 46, 50);

    fill(88, 212, 12);
    ellipse(treesX[i] + 30, floorPosY - 142, 42, 42);
    ellipse(treesX[i] - 35, floorPosY - 154, 40, 42);

    fill(0, 155, 0);
    ellipse(treesX[i], floorPosY - 174, 65, 75); // anchor point
    fill(45, 126, 6);
    ellipse(treesX[i] - 20, floorPosY - 134, 42, 42);
  }
}

// function to draw the canyons
function drawCanyon(t_canyon) {
  fill(colours.canyonEdge);
  rect(t_canyon.posX - 15, floorPosY, t_canyon.width, height - floorPosY);

  fill(50, 4, 90);
  rect(t_canyon.posX, floorPosY, t_canyon.width, height - floorPosY); // main body of canyon & anchor point
  fill(147, 56, 35);
  rect(t_canyon.posX, floorPosY * 1.175, t_canyon.width, height);
  fill(195, 74, 43, 200);
  rect(t_canyon.posX, floorPosY * 1.2, t_canyon.width, height);
  stroke(195, 74, 43);
  strokeWeight(1.5);
  fill(0, 0, 0, 0);
  ellipse(
    map(55, 0, 100, t_canyon.posX, t_canyon.posX + t_canyon.width),
    floorPosY + 50,
    10,
    10
  );
  ellipse(
    map(75, 0, 100, t_canyon.posX, t_canyon.posX + t_canyon.width),
    floorPosY + 30,
    13,
    13
  );
  ellipse(
    map(20, 0, 100, t_canyon.posX, t_canyon.posX + t_canyon.width),
    floorPosY + 15,
    10,
    10
  );
  noStroke();
}

// function to draw the collectables
function drawCollectable(t_collectable) {
  stroke(152, 101, 58);
  strokeWeight(t_collectable.size * 2);
  fill(192, 136, 77);
  ellipse(
    t_collectable.posX, // anchor point
    t_collectable.posY,
    t_collectable.size * 63,
    t_collectable.size * 63
  );
  noStroke();
  //chocolate chips
  fill(218, 167, 101);
  ellipse(
    t_collectable.posX - 3 * t_collectable.size,
    t_collectable.posY,
    t_collectable.size * 55,
    t_collectable.size * 55
  );
  fill(113, 77, 55);
  ellipse(
    t_collectable.posX - 8 * t_collectable.size,
    t_collectable.posY + 20 * t_collectable.size,
    t_collectable.size * 9,
    t_collectable.size * 11
  );
  ellipse(
    t_collectable.posX + 7 * t_collectable.size,
    t_collectable.posY + 8 * t_collectable.size,
    t_collectable.size * 15,
    t_collectable.size * 14
  );
  ellipse(
    t_collectable.posX + 17 * t_collectable.size,
    t_collectable.posY - 10 * t_collectable.size,
    t_collectable.size * 10,
    t_collectable.size * 12
  );
  ellipse(
    t_collectable.posX - 3 * t_collectable.size,
    t_collectable.posY - 3 * t_collectable.size,
    t_collectable.size * 5,
    t_collectable.size * 5
  );
  ellipse(
    t_collectable.posX - 20 * t_collectable.size,
    t_collectable.posY + 12 * t_collectable.size,
    t_collectable.size * 7,
    t_collectable.size * 5
  );
  ellipse(
    t_collectable.posX - 13 * t_collectable.size,
    t_collectable.posY - 15 * t_collectable.size,
    t_collectable.size * 7,
    t_collectable.size * 7
  );
  noFill();
  noStroke();
}

// function to draw the stars
function drawStar(star) {
  // star shape
  fill(252, 234, 69);
  noStroke();
  beginShape();
  vertex(star.posX + -10 * star.size, star.posY + 10 * star.size);
  vertex(star.posX + 0 * star.size, star.posY + 35 * star.size);
  vertex(star.posX + 10 * star.size, star.posY + 10 * star.size);
  vertex(star.posX + 35 * star.size, star.posY + 0 * star.size);
  vertex(star.posX + 10 * star.size, star.posY + -8 * star.size);
  vertex(star.posX + 0 * star.size, star.posY + -35 * star.size);
  vertex(star.posX + -10 * star.size, star.posY + -8 * star.size);
  vertex(star.posX + -35 * star.size, star.posY + 0 * star.size);
  endShape();
}

// clouds both in front and behind mountains
function drawCloud(cloud) {
  // centre of cloud ellipse & anchor point
  fill(255, 227, 208);
  ellipse(cloud.posX, cloud.posY - 60 * cloud.size, 120 * cloud.size);
  // sides of cloud
  ellipse(
    cloud.posX - 95 * cloud.size,
    cloud.posY - 40 * cloud.size,
    80 * cloud.size
  );
  ellipse(
    cloud.posX - 50 * cloud.size,
    cloud.posY - 50 * cloud.size,
    100 * cloud.size
  );
  ellipse(
    cloud.posX + 55 * cloud.size,
    cloud.posY - 37.5 * cloud.size,
    75 * cloud.size
  );
}

// function to draw the game character
function drawGameChar() {
  // draw the game character
  if (isLeft && isFalling) {
    // add your jumping-left code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX, gameCharY - 23, 10, 12); // minus y to look 'floating'
    ellipse(gameCharX + 16, gameCharY - 23, 10, 12);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 40, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 10, gameCharY - 57, 8, 8);
    ellipse(gameCharX + 10, gameCharY - 57, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX + 13, gameCharY - 62, 5, 5);
    ellipse(gameCharX - 8, gameCharY - 62, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX - 15, gameCharY - 38, 9, 9);
    ellipse(gameCharX - 17, gameCharY - 36, 0.5, 0.5);

    ellipse(gameCharX + 6, gameCharY - 38, 9, 9);
    ellipse(gameCharX + 4, gameCharY - 36, 0.5, 0.5);

    // mouth
    fill(242, 111, 170);
    strokeWeight(0.35);

    arc(gameCharX - 5, gameCharY - 36, 5, 4, 0, PI, CHORD);

    // reset stroke weight
    strokeWeight(1);
  } else if (isRight && isFalling) {
    // add your jumping-right code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 16, gameCharY - 23, 10, 12);
    ellipse(gameCharX, gameCharY - 23, 10, 12);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 40, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX + 10, gameCharY - 57, 8, 8);
    ellipse(gameCharX - 10, gameCharY - 57, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX - 13, gameCharY - 62, 5, 5);
    ellipse(gameCharX + 8, gameCharY - 62, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX + 15, gameCharY - 38, 9, 9);
    ellipse(gameCharX + 17, gameCharY - 36, 0.5, 0.5);

    ellipse(gameCharX - 6, gameCharY - 38, 9, 9);
    ellipse(gameCharX - 4, gameCharY - 36, 0.5, 0.5);

    // mouth
    fill(242, 111, 170);
    strokeWeight(0.35);

    arc(gameCharX + 5, gameCharY - 36, 5, 4, 0, PI, CHORD);

    // reset stroke weight
    strokeWeight(1);
  } else if (isLeft) {
    // add your walking left code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX, gameCharY - 12, 12, 10);
    ellipse(gameCharX + 16, gameCharY - 12, 12, 10);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 27, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX + 8, gameCharY - 45, 8, 8);
    ellipse(gameCharX - 10, gameCharY - 45, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX - 7, gameCharY - 53, 5, 5);
    ellipse(gameCharX + 11, gameCharY - 53, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX + 6, gameCharY - 28, 9, 9);
    ellipse(gameCharX + 4, gameCharY - 28, 0.5, 0.5);

    ellipse(gameCharX - 15, gameCharY - 28, 9, 9);
    ellipse(gameCharX - 17, gameCharY - 28, 0.5, 0.5);

    // mouth
    noFill();
    beginShape();
    curveVertex(gameCharX - 7, gameCharY - 26);
    curveVertex(gameCharX - 7, gameCharY - 25);
    curveVertex(gameCharX - 5, gameCharY - 24.5);
    curveVertex(gameCharX - 3, gameCharY - 25);
    curveVertex(gameCharX - 3, gameCharY - 26);
    endShape();
    noStroke();

    // reset stroke weight
    strokeWeight(1);
  } else if (isRight) {
    // add your walking right code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 16, gameCharY - 12, 12, 10);
    ellipse(gameCharX, gameCharY - 12, 12, 10);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 27, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 8, gameCharY - 45, 8, 8);
    ellipse(gameCharX + 10, gameCharY - 45, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX + 7, gameCharY - 53, 5, 5);
    ellipse(gameCharX - 11, gameCharY - 53, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX - 6, gameCharY - 28, 9, 9);
    ellipse(gameCharX - 4, gameCharY - 28, 0.5, 0.5);

    ellipse(gameCharX + 15, gameCharY - 28, 9, 9);
    ellipse(gameCharX + 17, gameCharY - 28, 0.5, 0.5);

    // mouth
    noFill();
    beginShape();
    curveVertex(gameCharX + 7, gameCharY - 26);
    curveVertex(gameCharX + 7, gameCharY - 25);
    curveVertex(gameCharX + 5, gameCharY - 24.5);
    curveVertex(gameCharX + 3, gameCharY - 25);
    curveVertex(gameCharX + 3, gameCharY - 26);
    endShape();
    noStroke();

    // reset stroke weight
    strokeWeight(1);
  } else if (isFalling || isPlummeting) {
    // add your jumping facing forwards code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 10, gameCharY - 23, 10, 12);
    ellipse(gameCharX + 10, gameCharY - 23, 10, 12);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 40, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX + 10, gameCharY - 57, 8, 8);
    ellipse(gameCharX - 10, gameCharY - 57, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX - 12, gameCharY - 62, 5, 5);
    ellipse(gameCharX + 12, gameCharY - 62, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX + 12, gameCharY - 38, 9, 9);
    ellipse(gameCharX + 12, gameCharY - 36, 0.5, 0.5);

    ellipse(gameCharX - 12, gameCharY - 38, 9, 9);
    ellipse(gameCharX - 12, gameCharY - 36, 0.5, 0.5);

    // mouth
    fill(242, 111, 170);
    strokeWeight(0.35);

    arc(gameCharX, gameCharY - 36, 6, 5, 0, PI, CHORD);

    // reset stroke weight
    strokeWeight(1);
  } else {
    // add your standing front facing code
    fill(colours.character);
    strokeWeight(0.5);
    stroke(17, 55, 0);

    // legs
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX - 12, gameCharY - 14, 12, 10);
    ellipse(gameCharX + 12, gameCharY - 14, 12, 10);

    // body
    fill(colours.character);
    ellipse(gameCharX, gameCharY - 27, 42, 33);

    // antennae
    fill(lerpColor(colours.character, colours.black, 0.15));
    ellipse(gameCharX + 10, gameCharY - 47, 8, 8);
    ellipse(gameCharX - 10, gameCharY - 47, 8, 8);

    fill(lerpColor(colours.character, colours.white, 0.15));
    ellipse(gameCharX - 12, gameCharY - 55, 5, 5);
    ellipse(gameCharX + 12, gameCharY - 55, 5, 5);

    // eyes
    fill(colours.white);
    stroke(colours.black);
    ellipse(gameCharX + 12, gameCharY - 28, 9, 9);
    ellipse(gameCharX + 12, gameCharY - 28, 0.5, 0.5);

    ellipse(gameCharX - 12, gameCharY - 28, 9, 9);
    ellipse(gameCharX - 12, gameCharY - 28, 0.5, 0.5);

    // mouth
    noFill();
    beginShape();
    curveVertex(gameCharX - 2, gameCharY - 26);
    curveVertex(gameCharX - 2, gameCharY - 25);
    curveVertex(gameCharX, gameCharY - 24.5);
    curveVertex(gameCharX + 2, gameCharY - 25);
    curveVertex(gameCharX + 2, gameCharY - 26);
    endShape();
    noStroke();

    // reset stroke weight
    strokeWeight(1);
  }
}

// function to draw the end marker (ufo)
function drawFlagpole() {
  push();

  noStroke();
  // top
  fill(197, 193, 214);
  ellipse(
    flagpole.posX,
    flagpole.posY - 30,
    flagpole.size * 75,
    flagpole.size * 75
  );
  fill(0, 0, 0);
  ellipse(
    flagpole.posX,
    flagpole.posY - 40,
    flagpole.size * 5,
    flagpole.size * 5
  );
  ellipse(
    flagpole.posX + 10,
    flagpole.posY - 39,
    flagpole.size * 5,
    flagpole.size * 5
  );
  ellipse(
    flagpole.posX - 10,
    flagpole.posY - 39,
    flagpole.size * 5,
    flagpole.size * 5
  );

  // body
  fill(154, 156, 171);
  ellipse(
    flagpole.posX,
    flagpole.posY,
    flagpole.size * 150,
    flagpole.size * 100
  );

  // detail
  fill(126, 122, 156);
  ellipse(
    flagpole.posX,
    flagpole.posY + 1,
    flagpole.size * 135,
    flagpole.size * 85
  );
  fill(154, 156, 171);
  ellipse(
    flagpole.posX,
    flagpole.posY + 2,
    flagpole.size * 120,
    flagpole.size * 70
  );
  fill(137, 132, 163);
  ellipse(
    flagpole.posX,
    flagpole.posY + 3,
    flagpole.size * 105,
    flagpole.size * 55
  );
  // innermost yellow ring
  fill(255, 255, 0);
  ellipse(
    flagpole.posX,
    flagpole.posY + 4,
    flagpole.size * 90,
    flagpole.size * 40
  );

  if (flagpole.isReached) {
    // beam
    fill(255, 255, 0, 100);
    triangle(
      flagpole.posX,
      flagpole.posY - 10,
      flagpole.posX - 100,
      floorPosY,
      flagpole.posX + 100,
      floorPosY
    );
  } else {
    fill(255, 255, 0, 100);
    triangle(
      flagpole.posX,
      flagpole.posY - 10,
      flagpole.posX - 15,
      floorPosY,
      flagpole.posX + 15,
      floorPosY
    );
  }

  pop();
}

// function to draw the score
function drawScore() {
  // stroke for improved readability with stars
  fill(255, 235, 221);
  strokeWeight(8);
  stroke(colours.sky);
  textSize(30);
  textAlign(LEFT, CENTER);
  text(gameScore, scoreCookie.posX + 25, scoreCookie.posY + 2);
  noFill();
  noStroke();
  drawCollectable(scoreCookie);
}

// function to draw lives
function drawLives() {
  fill(lerpColor(colours.character, colours.black, 0.1));
  for (let i = 0; i < lives; i++) {
    const x = 23 + i * 27;
    const y = 18;
    // life 1
    ellipse(x, y, 12, 12);
    ellipse(x + 8, y, 12, 12);
    triangle(x + 4, y + 12, x - 6, y + 2, x + 14, y + 2);
  }
}

// function to draw end screen
function drawTextScreen(endText) {
  fill(12, 4, 61, 200);
  rect(0, 0, width, height);
  fill(255, 227, 208);
  textSize(35);
  textAlign(CENTER, CENTER);
  text(endText, width / 2, height / 2);
  noFill();
}

// function to draw win screen
function drawWinScreen() {
  let endText;
  if (gameScore == 12) {
    endText = "You got all the cookies! Press space to play again.";
  } else if (gameScore >= 10) {
    endText = "You got almost all the cookies! Press space to play again.";
  } else {
    endText = "You didn't get enough cookies. Press space to try again.";
  }
  drawTextScreen(endText);
}

// function to draw start signpost
function drawSignPost() {
  // top layer of sign
  fill(colours.floorTop);
  rect(signpostX - 40, floorPosY - 115, 107, 5);
  // backing of sign
  fill(colours.canyonEdge);
  // back body
  rect(signpostX - 40, floorPosY - 110, 107, 60);
  // back post
  rect(signpostX, floorPosY - 60, 27, 60);

  // main area
  fill(colours.floor);
  // main body
  rect(signpostX - 40, floorPosY - 110, 100, 60);
  // main post
  rect(signpostX, floorPosY - 60, 20, 60);

  // text
  fill(colours.floorTop);
  textSize(15);
  text("12 Cookies", signpostX - 28, floorPosY - 90);
  fill(colours.canyonEdge);
  textSize(40);
  text("☛", signpostX - 3, floorPosY - 67);

  noFill();
}

// function to create the platforms
function createPlatform(x, y, length) {
  return {
    x: x,
    y: y,
    length: length,
    draw: function () {
      fill(colours.floorTop);
      rect(this.x, this.y, this.length, 22);
      fill(colours.floor);
      rect(this.x, this.y + 4, this.length, 18);
    },
    checkContact: function (gcX, gcY) {
      if (gcX + 15 > this.x && gcX - 15 < this.x + this.length) {
        const d = this.y - gcY;
        if (d >= 0 && d < 5) {
          return true;
        }
      }
      return false;
    },
  };
}

// function to create the obstacles
function createObstacle(x, y, length) {
  return {
    x: x,
    y: y,
    length: length,
    draw: function () {
      fill(lerpColor(colours.character, colours.black, 0.15));
      rect(this.x, this.y - 5, this.length, floorPosY - this.y);
      fill(lerpColor(colours.character, colours.black, 0.25));
      rect(this.x, this.y, this.length, floorPosY - this.y);
    },
    checkYContact: function (gcX, gcY) {
      if (gcX + 10 > this.x && gcX - 10 < this.x + this.length) {
        const d = this.y - gcY;
        if (d >= 0 && d < 5) {
          return true;
        }
      }
      return false;
    },
    checkXContact: function (gcX, gcY) {
      return gcX >= this.x && gcX <= this.x + this.length && gcY > this.y;
    },
  };
}

// // function for enemies
function Enemy(x, y, range) {
  this.x = x;
  this.y = y;
  this.range = range;

  this.currentX = x;
  this.inc = 1;

  this.update = function () {
    this.currentX += this.inc;

    if (this.currentX >= this.x + this.range) {
      this.inc = -1;
    } else if (this.currentX < this.x) {
      this.inc = 1;
    }
  };

  this.draw = function () {
    this.update();

    strokeWeight(0.5);
    stroke(17, 55, 0);

    // left arm
    fill(112, 106, 106);
    triangle(
      this.currentX - 15,
      this.y + 15,
      this.currentX - 5,
      this.y + 15,
      this.currentX - 10,
      this.y + 50
    );

    // detail on left arm
    line(this.currentX - 13, this.y + 27, this.currentX - 7, this.y + 27);
    line(this.currentX - 12, this.y + 35, this.currentX - 8, this.y + 35);
    line(this.currentX - 11, this.y + 43, this.currentX - 9, this.y + 43);

    // lines and joint connecting right hand and right arm
    strokeWeight(1);

    line(this.currentX - 11, this.y + 50, this.currentX - 15, this.y + 55);
    line(this.currentX - 10, this.y + 50, this.currentX - 6, this.y + 55);
    strokeWeight(0.5);

    ellipse(this.currentX - 10, this.y + 50, 5, 5);

    // hands on left arm
    triangle(
      this.currentX - 17,
      this.y + 55,
      this.currentX - 11,
      this.y + 55,
      this.currentX - 11,
      this.y + 63
    );

    triangle(
      this.currentX - 3,
      this.y + 55,
      this.currentX - 9,
      this.y + 55,
      this.currentX - 9,
      this.y + 63
    );

    // right arm
    triangle(
      this.currentX + 15,
      this.y + 15,
      this.currentX + 5,
      this.y + 15,
      this.currentX + 10,
      this.y + 50
    );

    // detail on left arm
    line(this.currentX + 13, this.y + 27, this.currentX + 7, this.y + 27);
    line(this.currentX + 12, this.y + 35, this.currentX + 8, this.y + 35);
    line(this.currentX + 11, this.y + 43, this.currentX + 9, this.y + 43);

    // lines and joint connecting right hand and right arm
    strokeWeight(1);

    line(this.currentX + 10, this.y + 50, this.currentX + 14, this.y + 55);
    line(this.currentX + 9, this.y + 50, this.currentX + 5, this.y + 55);
    strokeWeight(0.5);

    ellipse(this.currentX + 10, this.y + 50, 5, 5);

    // hands on right arm
    triangle(
      this.currentX + 17,
      this.y + 55,
      this.currentX + 11,
      this.y + 55,
      this.currentX + 11,
      this.y + 63
    );

    triangle(
      this.currentX + 3,
      this.y + 55,
      this.currentX + 9,
      this.y + 55,
      this.currentX + 9,
      this.y + 63
    );

    // body
    fill(255, 229, 34);
    ellipse(this.currentX, this.y, 50, 50);

    // eyelid
    fill(140, 141, 143);
    ellipse(this.currentX, this.y - 9, 14, 22);

    // eye
    fill(colours.white);
    ellipse(this.currentX, this.y - 8, 14, 14);

    // eyeball
    fill(colours.black);
    rect(this.currentX + 2, this.y - 9, 3, 3);

    // mouth
    fill(colours.white);
    beginShape();
    vertex(this.currentX - 20, this.y + 3);
    vertex(this.currentX, this.y + 8);
    vertex(this.currentX + 20, this.y + 3);
    vertex(this.currentX, this.y + 20);
    vertex(this.currentX - 20, this.y + 3);
    endShape();

    fill(colours.black);
    triangle(
      this.currentX - 20,
      this.y + 3,
      this.currentX - 15,
      this.y + 7,
      this.currentX - 15,
      this.y + 4
    );
    triangle(
      this.currentX + 20,
      this.y + 3,
      this.currentX + 15,
      this.y + 7,
      this.currentX + 15,
      this.y + 4
    );

    strokeWeight(1);

    line(this.currentX, this.y + 10, this.currentX, this.y + 15);
    line(this.currentX - 3, this.y + 11, this.currentX - 3, this.y + 13);
    line(this.currentX + 3, this.y + 11, this.currentX + 3, this.y + 13);
    strokeWeight(0.5);
  };

  this.checkContact = function (gcX, gcY) {
    return dist(gcX, gcY - 30, this.currentX, this.y) < 40;
  };
}

// ---------------------
// Check Functions
// ---------------------

// function to check character is over a canyon
function checkCanyon(t_canyon) {
  if (
    gameCharWorldX > t_canyon.posX &&
    gameCharWorldX < t_canyon.posX + t_canyon.width &&
    gameCharY >= floorPosY
  ) {
    isPlummeting = true;
  }
}

// function to check character has collected an item
function checkCollectable(t_collectable) {
  if (
    dist(
      gameCharWorldX,
      gameCharY - 27, //centre of character
      t_collectable.posX,
      t_collectable.posY
    ) <
    t_collectable.size * 31.5 + // half size of cookie
      21 // half size of character's width
  ) {
    t_collectable.isFound = true;
    gameScore += 1;
    cookieSound.play();
  }
}

// function to check character has reached flagpole
function checkFlagpole() {
  const d = abs(gameCharWorldX - flagpole.posX);

  if (d < 5) {
    flagpole.isReached = true;
  }
}

// function to check if the player has died when falling in the canyon
function checkCanyonDeath() {
  const below = gameCharY >= height;

  if (below && lives > 0) {
    lives -= 1;
    fallingSound.play();
    backgroundSound.stop();
    startGame();
  }
}
