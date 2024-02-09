// Nathan Becker
// June 5, 2023
// Top Down dungeon crawler Javascript game
// WASD to move, space to attack
// Get 100 coins to win


function setup() {
  frameRate(60);
  createCanvas(800, 800);
}
// Keys
var moveLeft = false;
var moveRight = false;
var moveUp = false;
var moveDown = false;
var keySpace = false;
keyPressed = function() {
    if(keyCode === 68){            
        moveRight = true;
    }
    if(keyCode === 65){            
        moveLeft = true;
    }
    if(keyCode === 87){            
        moveUp = true;
    }
    if(keyCode === 83){            
        moveDown = true;
    }
    if(keyCode === 32){
        keySpace = true;
    }
    if(keyCode === 75){
        fadeAnimation = requestAnimationFrame(fadeToBlack);   
    }
};

keyReleased = function() {
    if(keyCode === 68){            
        moveRight = false;
    }
    if(keyCode === 65){            
        moveLeft = false;
    }
    if(keyCode === 87){            
        moveUp = false;
    }
    if(keyCode === 83){            
        moveDown = false;
    }
    if(keyCode === 32){
        keySpace = false;
    }
};
// Camera variable, added to every position of in game objects
var camX = 0;
var camY = 0;

// Screenshake variable, also added to every position, but only changes when screenshakeAnimation is called
var screenshakeX = 0;
var screenshakeY = 0;

// Timer to show the controls tooltip
var tooltipTimer = 180;

// Screenshake Animation variables
const screenshakeAmount = 60
var screenshakeTimer = screenshakeAmount;
var shakeAnimation;

// Fade out animation
var fadeAmount = 0;
var fadeAnimation;

var player;
var levelObjects = [];
var enemyObjects = [];
var itemObjects = [];
var bulletObjects = [];


// Level objects
var level = function(x1,y1, x2, y2){
    this.X1 = x1;
    this.Y1 = y1;
    this.X2 = x2;
    this.Y2 = y2;
};
level.prototype.draw = function(){
    // X2 AND Y2 MUST BE LARGER THAN X1 Y1
    fill(0, 0, 0);
    noStroke();
    // Because of how collision is implemented,
    rect(this.X1-camX,this.Y1-camY,this.X2-this.X1,this.Y2-this.Y1);
    if(this.X1 > this.X2 || this.Y1 > this.Y2){
        fill(255, 0, 0);
        text("POINT 1 IS GREAT THAN POINT 2, \nMAKE SURE X1<X2 and Y1<Y2\nCOLLISION WONT WORK", this.X1, this.Y1);
    }
};

// Collision with level functions
var collided = function(X, Y) {
    for(var i = 0; i < levelObjects.length; i++){
        if(X >= levelObjects[i].X1 && X <= levelObjects[i].X2 && Y >= levelObjects[i].Y1 && Y <= levelObjects[i].Y2){
            return true;
        }
    }
    return false;
};

var Player = function(startX, startY){
    this.x = startX;
    this.y = startY;
    this.health = 100;
  
    this.xVel = 0;
    this.yVel = 0;
    this.coins = 0;
  
    this.cooldown = 0;
  
    /* Items
      * 0 = nothing
      * 1 = launcher
    */
    this.item = 0;
}
Player.prototype.update = function(){
    if (moveRight){
          this.xVel += 0.5;
    }
    if (moveLeft){
        this.xVel -= 0.5;
    }
    if (moveDown){
        this.yVel += 0.5;
    }
    if (moveUp){
        this.yVel -= 0.5;
    }
    // Decays velocity over time, for smooth movement
    this.xVel *= 0.9;
    this.yVel *= 0.9;
    
    // Speed caps
    if(this.xVel > 20){ 
        this.xVel = 20;
    }
    if(this.xVel < -20){ 
        this.xVel = -20;
    }
    if(this.yVel > 20){ 
        this.yVel = 20;
    }
    if(this.yVel < -20){ 
        this.yVel = -20;
    }
    
  
    // Moves 1/100 of the x velocity 100 times so it will detect walls better even when player is moving fast
    for(var i = 0; i < abs(this.xVel); i += abs(this.xVel/100)){
        this.x += this.xVel * 0.01;
        if(collided(this.x,this.y)){
            this.x -= this.xVel * 0.01;
            this.xVel *= -1;
        }
    }
    
    for(var i = 0; i < abs(this.yVel); i += abs(this.yVel/100)){
        this.y += this.yVel * 0.01;
        if(collided(this.x,this.y)){
            this.y -= this.yVel * 0.01;
            this.yVel *= -1;
        }
    }
  
    camX = (this.x-width/2)+screenshakeX;
    camY = (this.y-height/2)+screenshakeY;
    
    // Locks camera above -1000, for the 'Treasure Room' area
    if(camY-screenshakeY<-1000){
      camY = -1000;
    }
  
    fill(255, 255, 255);
    stroke(0, 0, 0);
    strokeWeight(2);
    rect(this.x-5-camX,this.y-5-camY,10,10);
    
    this.drawItem();
  
    if(keySpace){
      this.attack();
      keySpace = false;
    }
  
    // Reduces attack cooldown back to 0
    if(this.cooldown > 0){
        this.cooldown--;
    }
  
    // Start the fade animation if the player is out of health
    // This animation also resets everything in the game
    if(this.health < 0){
        fadeAnimation = requestAnimationFrame(fadeToBlack);
        this.health = 0;
    }
    // Win condition
    if(this.coins >= 100){
      this.x = 5000;
      this.y = 5000;
    }
}
Player.prototype.attack = function(){
    // Unarmed attack
    if(this.item === 0){
        // Angle that the player is moving, in radians
        this.movementDirection = atan2(this.y, this.x);
        
        for(var i = 0; i < enemyObjects.length; i++){
            if(this.x > enemyObjects[i].x-24 && this.x < enemyObjects[i].x+24 && this.y > enemyObjects[i].y-24 && this.y < enemyObjects[i].y+24 && Math.abs(enemyObjects[i].direction-this.movementDirection) < 90 && this.cooldown === 0){
                enemyObjects[i].knockback(this.xVel, this.yVel, 25)
                this.cooldown = 5;
            }
        }
    }
    // Launcher
    if(this.item === 1 && this.cooldown === 0){
        this.direction = atan2(mouseY-height/2+camY-this.y+400, mouseX-width/2)
        bulletObjects.push(new Bullet(this.x,this.y,10, this.direction, 0, 50))
        this.cooldown = 5;
    }
}
Player.prototype.knockback = function(speedX, speedY, damage){
    this.xVel += speedX*5;
    this.yVel += speedY*5;
    this.cooldown = 10;
    this.health -= damage;
    
  
    screenshakeTimer = screenshakeAmount;
    shakeAnimation = requestAnimationFrame(screenshake);
}
Player.prototype.itemGet = function(type){
    if(type === 2){
      this.coins++;
    }else if(type === 3){
      this.health += 50;
      if(this.health > 100){
        this.health = 100;
      }
    }else{
      this.item = type;
    }
}
Player.prototype.drawItem = function(){
    if(this.item === 1){
      push();
      translate(this.x-camX, this.y-camY);
      fill(255, 0, 0);
      rotate(atan2(mouseY-height/2+camY-this.y+400, mouseX-width/2));
      rect(0, -5, 15, 10);
      pop();
    }
}



var Enemy = function(spawnX, spawnY, type){
    this.x = spawnX;
    this.y = spawnY;
    this.xVel = 0;
    this.yVel = 0;
    
    this.alpha = 255;
  
    // Cooldown on attack
    this.cooldown = 0;
  
    // Random number that is applied to speed so enemies of the same type don't stack
    this.randomNum = (Math.random()*2-1)/10
    
    // Easy Enemy
    if(type === 0){
      this.speed = 0.5+this.randomNum
      this.health = 100;
      this.colourR = 255;
      this.colourB = 0;
    }
    
    // Difficult Enemy
    if(type === 1){
      this.speed = 0.75+this.randomNum
      this.health = 150; 
      this.colourR = 127;
      this.colourB = 60;
    }
    
    // Very Easy Enemy
    if(type === 2){
      this.speed = 0.25+this.randomNum
      this.health = 50;
      this.colourR = 255;
      this.colourB = 255;
    }
    
    // Var for determining when the enemy should play the hurt animation
    this.hurt = false;
    
    // Var for starting the fade out animation when the enemy dies 
    this.dying = false;
  
    // Var for deleting this enemy, if true then the object gets deleted next time it's updated
    this.delete = false;
}
Enemy.prototype.update = function(){
    fill(this.colourR,0,this.colourB, this.alpha);
    stroke(0, 0, 0, this.alpha);
    strokeWeight(2);
    
    // Flickers when enemy can't hurt player after the player hits this enemy
    if(!this.hurt){
        rect(this.x-5-camX,this.y-camY-5,10,10);
    }else if(this.cooldown%2 === 0){
        rect(this.x-5-camX,this.y-camY-5,10,10);
    }
    
    // Reduces cooldown back to 0
    if(this.cooldown > 0){
        this.cooldown--;
    }
  
    // If the cooldown is 0, the enemy is no longer hurt and can attack again
    if(this.cooldown === 0){
        this.hurt = false;
    }
    
    this.direction = atan2(player.y-this.y,player.x-this.x);
    if(abs(player.x - this.x) < 200 && abs(player.y-this.y) < 200){
        // Only moves towards player if not dying
        if(!this.dying){
          this.xVel += cos(this.direction)*this.speed;
          this.yVel += sin(this.direction)*this.speed;
        }
        this.xVel *= 0.9;
        this.yVel *= 0.9;
    }
    
    
    // Speed caps
    if(this.xVel > 20){ 
        this.xVel = 20;
    }
    if(this.xVel < -20){ 
        this.xVel = -20;
    }
    if(this.yVel > 20){ 
        this.yVel = 20;
    }
    if(this.yVel < -20){ 
        this.yVel = -20;
    }
  
  // Moves 1/100 of the x velocity 100 times so it will detect walls even when moving fast
    for(var i = 0; i < abs(this.xVel); i += abs(this.xVel/100)){
        this.x += this.xVel * 0.01;
        if(collided(this.x,this.y)){
            this.x -= this.xVel * 0.01;
            this.xVel *= -1;
        }
    }
    for(var i = 0; i < abs(this.yVel); i += abs(this.yVel/100)){
        this.y += this.yVel * 0.01;
        if(collided(this.x,this.y)){
            this.y -= this.yVel * 0.01;
            this.yVel *= -1;
        }
    }
    // If close to player, hit player
    if(this.x > player.x-8 && this.x < player.x+8 && this.y > player.y-8 && this.y < player.y+8 && this.cooldown === 0 && !this.dying){
        player.knockback(this.xVel, this.yVel, 10+this.randomNum);
        this.cooldown = 15;
    }
    if(this.health <= 0){
      this.dying = true;
    }
    if(this.dying){
        this.alpha -= 10;
        if(this.alpha < 1){
            this.delete = true;
        }
    }
}
Enemy.prototype.knockback = function(speedX, speedY, damage){
    this.xVel += speedX*10;
    this.yVel += speedY*10;
    this.health -= damage;
    this.cooldown = 30;
    this.hurt = true;
}

var Item = function(startX,startY,type){
    this.x = startX;
    this.y = startY;
    this.type = type;
  
    // Var for determining if the item has been collected
    this.collected = false;
  
    // Var for deleting this item, if true then the object gets deleted next time it's updated
    this.delete = false;
  
    this.animation = 0;
}
Item.prototype.update = function(){
    if(!this.collected){
        if(this.type === 2){
          fill(255,255,50);
        }else if(this.type === 3){
          fill(100,255,100);
        }else{
          fill(100,100,255);
        }
        stroke(0, 0, 0);
        strokeWeight(2);
        rect(this.x-5-camX,this.y-5-camY,10,10);
        
        if(this.x > player.x-20 && this.x < player.x+20 && this.y > player.y-20 && this.y < player.y+20){
            this.collected = true
            player.itemGet(this.type);
        }
    }else if(this.animation < 10){
        this.animation += 1;
        fill(255,255,50);
        stroke(0, 0, 0);
        strokeWeight(2);
        rect(this.x-5-camX+(this.animation/2),this.y-5-camY+(this.animation/2),10-this.animation,10-this.animation);
    }else{
        this.delete = true;
    }
}



var Bullet = function(spawnX, spawnY, speed, direction, type, damage){
  this.x = spawnX;
  this.y = spawnY;
  this.delete = false;
  this.speedX = cos(direction)*speed;
  this.speedY = sin(direction)*speed;
  this.damage = damage;
};
Bullet.prototype.update = function(){
    rect(this.x-camX-1.5,this.y-camY-1.5,3,3)
    this.x += this.speedX;
    this.y += this.speedY;
    // If collided with a wall, delete the bullet and do nothing
    if (collided(this.x,this.y)){
        this.delete = true;
    }
    // Checks if the bullet is close to any enemy
    for(var i = 0; i < enemyObjects.length; i++){
        if(this.x >= enemyObjects[i].x-10 && this.x <= enemyObjects[i].x+10 && this.y >= enemyObjects[i].y-10 && this.y <= enemyObjects[i].y+10){
            enemyObjects[i].knockback(this.speedX/5,this.speedY/5, this.damage);
            this.delete = true;
        }
    }
};


// Screenshake
var screenshake = function(timestamp){
  
  screenshakeX = 0;
  screenshakeY = 0;
  
  // Picks a random direction
  this.shakeDirection = Math.random()*Math.PI*2-Math.PI;
  
  // Moves the camera in the random direction
  screenshakeX += cos(this.shakeDirection)*screenshakeTimer/4;
  screenshakeY += sin(this.shakeDirection)*screenshakeTimer/4;
  
  // Reduces the screenshake timer every time the animation is requested
  screenshakeTimer--;
  
  // Checks if the timer has reached 0, and cancels the animation
  if(screenshakeTimer <= 0){
      cancelAnimationFrame(shakeAnimation);
  }
  // Requests the next frame otherwise
  else{
      shakeAnimation = requestAnimationFrame(screenshake);
  }
}

// Fade animations
/* Using requestAnimationFrame, these functions change the 
   fadeAmount variable from 0 to 255 back to 0 over ~3 seconds.
   The fadeAmount variable is used to draw a rectangle at the end
   of the draw loop
*/
var fadeToBlack = function(timestamp){
    fadeAmount += 4.25;
  
    if(fadeAmount >= 255){
      // Cancel this animation
      cancelAnimationFrame(fadeAnimation)
      // Reset everything
      resetGame();
      // Start the fade in animation
      fadeAnimation = requestAnimationFrame(fadeIn)
    }else{
      // Otherwise continue fading out
      fadeAnimation = requestAnimationFrame(fadeToBlack);
    }
}
var fadeIn = function(timestamp){
    fadeAmount -= 4.25;
  if(fadeAmount <= 0){
      // Cancel the animation
      cancelAnimationFrame(fadeAnimation)
      // Set fade Amount to 0 if it isn't already
      fadeAmount = 0;
    }else{
      // Otherwise continue fading in
      fadeAnimation = requestAnimationFrame(fadeIn);
    }
}


// Reset or initialize game
var resetGame = function(){
    player = new Player(200,200);
    
    // Variables
    camX = 0;
    camY = 0;
    screenshakeX = 0;
    screenshakeY = 0;

    screenshakeTimer = screenshakeAmount;
    
    cancelAnimationFrame(shakeAnimation)
    
    levelObjects = [];
    enemyObjects = [];
    itemObjects = [];
    bulletObjects = [];
    
    
    // Building Level
    
    // First Room Walls
    // Top Outer Wall
    levelObjects.push(new level(-200,-200,600,-150))
    // Left Outer Wall
    levelObjects.push(new level(-200,-150,-150,600))
    // Bottom Outer Walls
    levelObjects.push(new level(-150,550,150,600))
    levelObjects.push(new level(250,550,600,600))
    // Right Outer Walls
    levelObjects.push(new level(550,-150,600,150))
    levelObjects.push(new level(550,250,600,550))
    // Inner Walls
    levelObjects.push(new level(-25,150,25,550))
    
    // Bottom Hallway
    levelObjects.push(new level(100,600,150,1000))
    levelObjects.push(new level(250,600,300,900))
    levelObjects.push(new level(150,750,200,800))
    levelObjects.push(new level(100,1000,800,1050))
    levelObjects.push(new level(250,900,800,950))
    
    // Bottom Room 1
    // Left Outer Walls
    levelObjects.push(new level(800,550,850,950))
    levelObjects.push(new level(800,1000,850,1450))
    // Top Walls
    levelObjects.push(new level(850,550,1450,600))
    // Right Walls
    levelObjects.push(new level(1450,550,1500,950))
    levelObjects.push(new level(1500,900,1550,1100))
    levelObjects.push(new level(1450,1050,1500,1450))
    // Bottom Walls
    levelObjects.push(new level(850,1400,1450,1450))
    // Inner Walls
    levelObjects.push(new level(950,875,1000,1075))
    
    // Right Hallway
    levelObjects.push(new level(600,100,1100,150))
    levelObjects.push(new level(600,250,1400,300))
    
    // Obstacles in Right Hallway
    levelObjects.push(new level(850,150,900,210))
    levelObjects.push(new level(950,190,1000,250))
    
    // Right Room 'Tower'
    // Left Wall
    levelObjects.push(new level(1050,-600,1100,100))
    // Right Wall
    levelObjects.push(new level(1350,-600,1400,250))  
    // Inner Walls
    levelObjects.push(new level(1100,-50,1200,0))
    levelObjects.push(new level(1250,-50,1350,0))
    levelObjects.push(new level(1150,-150,1300,-100))
    levelObjects.push(new level(1100,-250,1325,-200))
    levelObjects.push(new level(1100,-350,1200,-300))
    levelObjects.push(new level(1250,-350,1350,-300))
    levelObjects.push(new level(1150,-450,1300,-400))
    levelObjects.push(new level(1125,-550,1350,-500))
    
    // Right Room 'Treasure Room'
    // Bottom Walls
    levelObjects.push(new level(1000,-650,1100,-600))
    levelObjects.push(new level(1350,-650,1450,-600))
    // Left Wall
    levelObjects.push(new level(1000,-1000,1050,-650))
    // Right Wall
    levelObjects.push(new level(1400,-1000,1450,-650))
    // Top Wall
    levelObjects.push(new level(1050,-1000,1400,-950))
    
    // Items
    // Coins (Total coins: 100)
    // Coins in first room
    for(var i = 0; i < 3; i++){
      itemObjects.push(new Item(-125+35*i,525,2))
      itemObjects.push(new Item(-90,150+50*i,2))
      itemObjects.push(new Item(175+i*25,500,2))
      itemObjects.push(new Item(175+i*25,525,2))
    }
    itemObjects.push(new Item(450,-125,2))
    itemObjects.push(new Item(500,-125,2))
    itemObjects.push(new Item(500,-75,2))
    
    // Row of coins in right hallway
    for(var i = 0; i < 6; i++){
      itemObjects.push(new Item(550+i*50,200,2))
    }
    // Rows of coins in bottom hallway
    for(var i = 0; i < 8; i++){
      itemObjects.push(new Item(200,550+i*25,2))
      itemObjects.push(new Item(275+i*50,975,2))
    }
    // Cluster of coins at the end of the first bottom hallway
    itemObjects.push(new Item(900,950,2))
    for(var i = 0; i < 3; i++){
      itemObjects.push(new Item(875+i*25,975,2))
    }
    itemObjects.push(new Item(900,1000,2))
    
    // Random coins in bottom room
    for(var i = 0; i < 20; i++){
      itemObjects.push(new Item(1050+Math.floor(Math.random()*400),700+Math.floor(Math.random()*550),2));
    }
    
    // Coins in bottom room
    itemObjects.push(new Item(1462.5,962.5,2))
    itemObjects.push(new Item(1462.5,1000,2))
    itemObjects.push(new Item(1462.5,1037.5,2))
    itemObjects.push(new Item(1487.5,981.25,2))
    itemObjects.push(new Item(1487.5,1018.75,2))
    
    // Coins in right room 'Tower'
    for(var i = 0; i < 3; i++){
      itemObjects.push(new Item(1150+i*75,200-i*75,2))
      itemObjects.push(new Item(1150+i*75,-75,2))
      itemObjects.push(new Item(1150+i*75,-175,2))
      itemObjects.push(new Item(1150+i*75,-275,2))
      itemObjects.push(new Item(1150+i*75,-375,2))
      itemObjects.push(new Item(1150+i*75,-475,2))
      itemObjects.push(new Item(1150+i*75,-575,2))
    }
    // Coins in right room 'Treasure Room'
    for(var i = 0; i < 5; i++){
      itemObjects.push(new Item(1125+i*50,-875,2))
      itemObjects.push(new Item(1125+i*50,-775,2))
    }
    itemObjects.push(new Item(1175,-825,2))
    itemObjects.push(new Item(1275,-825,2))
    
    // Weapons
    // Launcher
    itemObjects.push(new Item(1225,-825,1))
    
    // Health Packs
    itemObjects.push(new Item(-100,-100,3))
    itemObjects.push(new Item(1225,-925,3))
    itemObjects.push(new Item(1437.5,1000,3))  
  
    // Enemies
    // First Room Enemies
    enemyObjects.push(new Enemy(-107.5,475,0))
    enemyObjects.push(new Enemy(-67.5,475,0))
    enemyObjects.push(new Enemy(400,-125,2))
    enemyObjects.push(new Enemy(450,-75,2))
    enemyObjects.push(new Enemy(500,-25,2))
    // Bottom Hallway Enemies
    enemyObjects.push(new Enemy(175,825,0))
    enemyObjects.push(new Enemy(700,965,1))
    enemyObjects.push(new Enemy(700,985,1))
    // Bottom Room Enemies
    enemyObjects.push(new Enemy(1300,750,0))
    enemyObjects.push(new Enemy(1300,1250,0))
    enemyObjects.push(new Enemy(1250,1000,0))
    enemyObjects.push(new Enemy(1350,875,1))
    enemyObjects.push(new Enemy(1350,1125,1))
    // Right Room 'Tower' Enemies
    enemyObjects.push(new Enemy(1187.5,-575,2))
    enemyObjects.push(new Enemy(1262.5,-475,2))
    enemyObjects.push(new Enemy(1187.5,-375,2))
    enemyObjects.push(new Enemy(1262.5,-275,2))
    enemyObjects.push(new Enemy(1187.5,-175,2))
    enemyObjects.push(new Enemy(1262.5,-75,2))
    
  
}


// Reset game also initializes all game variables, so it is called once before the draw function
resetGame();



function draw() {
  background(255,255,255);
  // Updating Sprites
  player.update();
  
  // Levels
  for(var i = 0; i < levelObjects.length; i++){
            levelObjects[i].draw();
        }
  // Enemies
  for(var i = 0; i < enemyObjects.length; i++){
            enemyObjects[i].update();
    
            // Deletes objects from list
            if(enemyObjects[i].delete){
                enemyObjects.splice(i,1);
                // i is decreased because splice shifts everything back 1 index (index 5 become 4 etc.)
                i--;
              }
        }
  // Items
  for(var i = 0; i < itemObjects.length; i++){
            itemObjects[i].update();
    
            // Deletes objects from list
            if(itemObjects[i].delete){
                itemObjects.splice(i,1);
                // i is decreased because splice shifts everything back 1 index (index 5 become 4 etc.)
                i--;
              }
        }
  // Bullets
  for(var i = 0; i < bulletObjects.length; i++){
            bulletObjects[i].update();
    
            // Deletes objects from list
            if(bulletObjects[i].delete){
                bulletObjects.splice(i,1);
                // i is decreased because splice shifts everything back 1 index (index 5 become 4 etc.)
                i--;
              }
        }
  
  
  
  // User Interface
  textAlign(LEFT)
  textSize(12);
  fill(0,0,0,200);
  strokeWeight(3);
  rect(1,1,201,80);
  fill(255,255,255);
  text("Health",80,10);
  text("Coins",40,50);
  text("Item",120,50);
  text("Get all 100 coins to win",10,75);
  // Healthbar
  fill(255,0,0);
  noStroke();
  rect(1,10,200,30);
  fill(0,255,0);
  rect(1,10,player.health*2,30);
  // Coins
  text(player.coins+"/100",40,60);
  // Item
  if(player.item === 0){
    text("No item",120,60);
  }else if(player.item === 1){
    text("Launcher",120,60);
  }
  
  // Controls tooltip
  if(tooltipTimer > 0){
    textSize(50)
    textAlign(CENTER)
    text("WASD to move",width/2,height/2-50)
    text("Space to attack",width/2,height/2)
    text("(While moving towards an enemy)",width/2,height/2+50)
    tooltipTimer--;
  }
  
  // Win message
  textSize(50)
  fill(0,0,0)
  textAlign(CENTER)
  text("You Win!",5000-camX,4900-camY)
  textSize(12)
  text("Press k to restart",5000-camX,5100-camY)
  
  
  // Draw fade animation
  fill(50,0,0,fadeAmount);
  rect(0,0,width,height);
}
