// Searches HTML document for element of canvas
var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth-12;
canvas.height = window.innerHeight-10;
canvas.height = window.innerWidth/1.6-10;
//canvas.width = 900;
//canvas.height = 700;

var moving = false;
var c = canvas.getContext('2d');
var t = 0;
var dt = .05;
var mass = 10;
var spring = 0.3; // Objects spring from one another, not rigid collission

var keysDown = { 37:false, 38:false, 39:false, 40:false};
var cannonX = 50; var cannonY = canvas.height-50;
var cannonR = 80; var cannonTheta = Math.PI/4;
var cannonBall = new Circle(1,1,1,1,1,"red");//Dummy
gameState = "play"

var circleArray = [];
var badCircleArray = [];
var pocketArray = [];
var circleArrayColors = ["Blue","Red","Yellow","Green","Purple","Orange","Brown","Gold"];

// GAME SETTINGS
var numBalls = 0;

var level = 0;

// indexed by level
var ballNumArray = [6,2,10,0,0,3,1,3,6,20,5,15];

// GAME SETTINGS
window.addEventListener("keydown", onKeyDown, false);
window.addEventListener("keyup", onKeyUp, false);

window.addEventListener("keypress", buttonpress, false);

var keyW = false;
var keyA = false;
var keyS = false;
var keyD = false;
var keyUp = false;
var keyDown = false;
var keyRight = false;
var keyLeft = false;

function onKeyDown(event) {
  var keyCode = event.keyCode;
  //console.log(keyCode+" pressed")

  switch (keyCode) {
    case 68: //d
      keyD = true;
      break;
    case 83: //s
      keyS = true;
      break;
    case 65: //a
      keyA = true;
      break;
    case 87: //w
      keyW = true;
      break;

    case 37: // left
      keyLeft = true;
      break;
    case 38: // up
      keyUp = true;
      break;
    case 39: // right
      keyRight = true;
      break;
    case 40: // down
      keyDown = true;
      break;
  }
}

function onKeyUp(event) {
  var keyCode = event.keyCode;
  //console.log(keyCode+" unpressed")

  switch (keyCode) {
    case 68: //d
      keyD = false;
      break;
    case 83: //s
      keyS = false;
      break;
    case 65: //a
      keyA = false;
      break;
    case 87: //w
      keyW = false;
      break;

    case 37: // left
      keyLeft = false;
      break;
    case 38: // up
      keyUp = false;
      break;
    case 39: // right
      keyRight = false;
      break;
    case 40: // down
      keyDown = false;
      break;
  }
}

// Detects directional key input
// Used for CONTINUOUS key pushes
function processInput(currentFrameTime){
  if(keyUp) { // UP
    cannonR += 2;
    if(cannonR>150){cannonR=150;}
  } // UP
  if(keyDown) { // DOWN
    cannonR -= 2;
    if(cannonR<0){cannonR=0;}
  } // DOWN
  if(keyLeft) { cannonTheta+=Math.PI/64; } // Left
  if(keyRight) { cannonTheta-=Math.PI/64; } // Right

  if (keyUp||keyDown||keyLeft||keyRight||keyS||keyW||keyD||keyA) {
    initializeCannonball();
  }

  if(keyS) {      // "S"
    cannonY += 5;
    if(cannonY>canvas.height-30){cannonY=canvas.height-30;}
  }if(keyW) {     // "W"
    cannonY -= 5;
    if(cannonY<30){cannonY=30;}
  }if(keyA) {      // "A"
    cannonX -= 5;
    if(cannonX<30){cannonX=30;}
  }if(keyD) {     // "D"
    cannonX += 5;
    if(cannonX>canvas.width/4){cannonX=canvas.width/4;}
  }
}
// Only for SINGLE Button Presses
function buttonpress(e){
  var keyCode = e.keyCode;
  //console.log("You pressed " + keyCode);

  if(keyCode == 108){ // "L"
    gameState = "win";
  }
  if(keyCode == 32){ // SPACE
    // Fires cannon bal
    moving = true;
  }
  if(keyCode == 13){ // ENTER
    // Restart the game when enter is pressed
    moving = true;
    if ( gameState != "play" ){
      gameState = "play";
      initialize();
      animate();
    }else{
      initialize();
    }
  }
};


// Functions starting with capital letter indicate objects
function Circle( x, y, dx, dy, radius, color, is8ball){
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.radius = radius;
  this.color = color;
  this.mass = radius*radius;
  this.is8ball = is8ball;
  if(is8ball){this.color="Black"}
  // this acts as a method called draw
  this.draw = function( ){
    c.fillStyle = this.color;
    c.beginPath();
    c.arc( this.x, this.y, this.radius, 0, Math.PI*2, false);
    c.stroke();
    c.fill();
  }
  this.updatePlayer = function(){
    if (this.x+this.radius > canvas.width || this.x-this.radius < 0){
      this.dx = -this.dx;
    }if (this.y+this.radius > canvas.height || this.y-this.radius < 0){
      this.dy = -this.dy;
    }
    // Update position based on velocity
    this.x += this.dx;
    this.y += this.dy;

    // Hitting other circles
    for( var i = 0; i < circleArray.length; i++){

      yDist = (circleArray[i].y-this.y);
      xDist = (circleArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);
      massSum = this.mass + circleArray[i].mass;

      minDist = (circleArray[i].radius + this.radius)*1.1;
      if (dist < minDist) {
        angle = Math.atan2(yDist, xDist);
        targetX = this.x + Math.cos(angle) * minDist;
        targetY = this.y + Math.sin(angle) * minDist;
        ax = (targetX - circleArray[i].x) * spring;
        ay = (targetY - circleArray[i].y) * spring;
        this.dx -= ax * (circleArray[i].mass)/massSum;
        this.dy -= ay * (circleArray[i].mass)/massSum;
        circleArray[i].dx += ax * (this.mass)/massSum;
        circleArray[i].dy += ay * (this.mass)/massSum;
      }
    }

    // Check if pocket is hit with cueball, in which case you lose
    for( var i = 0; i < pocketArray.length; i++){
      yDist = (pocketArray[i].y-this.y);
      xDist = (pocketArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);

      if ( dist < this.radius + pocketArray[i].radius ){
        // YOU LOSE
        gameState = "lose";
      }
    }

    // Friction
    this.dy = this.dy*0.996;
    this.dx = this.dx*0.996;

    this.draw();
  }
  this.updateNoMoving = function(){
    this.draw();
  }
  this.update = function(){
    if (this.x+this.radius > canvas.width || this.x-this.radius < 0){
      this.dx = -this.dx;
    }if (this.y+this.radius > canvas.height || this.y-this.radius < 0){
      this.dy = -this.dy;
    }

    // Check if pocket is hit with other ball, in which case the ball is removed
    for( var i = 0; i < pocketArray.length; i++){
      yDist = (pocketArray[i].y-this.y);
      xDist = (pocketArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);

      // Executes whena ball goes into a pocket
      if ( dist < this.radius + pocketArray[i].radius ){
        index = circleArray.indexOf(this);
        if (this.is8ball){ // You lose if the 8ball goes in
          gameState = "lose";
        }else if( index > -1 ){ // Otherwise the ball just disappears
          circleArray.splice(index,1);
          wonTheGame = true; // Set to false if any non-8balls are left
          for (var i = 0; i < circleArray.length; i++){
            if( !circleArray[i].is8ball ){
                wonTheGame = false;
            }
          }if(wonTheGame){gameState="win";}
        }

      }
    }

    // Hitting other circles
    for( var i = 0; i < circleArray.length; i++){
      if(i==circleArray.indexOf(this)){continue;}// No colliding with yoursel

      yDist = (circleArray[i].y-this.y);
      xDist = (circleArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);
      massSum = this.mass + circleArray[i].mass;

      minDist = (circleArray[i].radius + this.radius)*1.1;
      if (dist < minDist) {
        angle = Math.atan2(yDist, xDist);
        targetX = this.x + Math.cos(angle) * minDist;
        targetY = this.y + Math.sin(angle) * minDist;
        ax = (targetX - circleArray[i].x) * spring;
        ay = (targetY - circleArray[i].y) * spring;
        this.dx -= ax * (circleArray[i].mass)/massSum;
        this.dy -= ay * (circleArray[i].mass)/massSum;
        circleArray[i].dx += ax * (this.mass)/massSum;
        circleArray[i].dy += ay * (this.mass)/massSum;
      }
    }

    // Update position based on velocity
    this.x += this.dx;
    this.y += this.dy;
    this.draw();
  }
}

function drawCannon( ){
  c.strokeStyle="#FF00FF";
  c.lineWidth=15;
  // Thick Line (Barrel)
  c.beginPath();
  c.moveTo(cannonX,cannonY);
  c.lineTo(cannonX+cannonR*Math.cos(cannonTheta),cannonY-cannonR*Math.sin(cannonTheta));
  c.stroke();
  c.strokeStyle="#000000";

  // Base of Cannon (Circle)
  c.fillStyle = "#FF00FF";
  c.beginPath();
  c.arc( cannonX, cannonY, 15, 0, Math.PI*2, false);
  c.stroke();
  c.fill();

  c.lineWidth=1;
}

function drawMenu(){
  c.font="12px Georgia";
  c.fillStyle = "#FFFFFF";
  c.fillText("LEVEL " + (level+1), 10, 30);
  c.fillText("Time : " + Math.round(t), 10, 50);
  c.fillText("Arrow keys move the cannon ", 10, 70);
  c.fillText("Space will fire the cannon ", 10, 82);
  c.fillText("Enter key to restart game ", 10, 94);
}

function drawPoolTable(){
  // Draws the green field
  c.fillStyle = "#0a6c03";
    //c.clearRect( 0, 0, innerWidth, innerHeight);
  c.fillRect( 0, 0, innerWidth, innerHeight);

  // Draws the white line across the field
  c.strokeStyle="#FFFFFF";
  c.lineWidth=10;
  // Thick Line (Barrel)
  c.beginPath();
  c.moveTo(canvas.width/4,canvas.height);
  c.lineTo(canvas.width/4,0);
  c.stroke();
  c.strokeStyle="#000000";

  c.lineWidth=3;
}

function animate(){
  if( t>60 ){
    gameState = "lose";
  }

  if( gameState === "play" ){
    t += dt;


    drawPoolTable();

    requestAnimationFrame(animate);

    for( var i = 0; i < pocketArray.length; i++){
      pocketArray[i].updateNoMoving();
    }
    for( var i = 0; i < circleArray.length; i++){
      circleArray[i].update();
    }
    if (moving){cannonBall.updatePlayer();}

    drawMenu();

    drawCannon();
    processInput();
  }
  else if ( gameState === "lose" ){
    // Create gradient
    var gradient=c.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop("0","red");
    gradient.addColorStop("0.5","grey");
    gradient.addColorStop("1.0","yellow");
    // Fill with gradient
    c.fillStyle=gradient;

    c.font="90px Georgia";
    //c.fillStyle = "#FFFFFF";
    c.fillText("YOU LOSE", canvas.width/2-canvas.width*0.2, canvas.height/2-canvas.height*0.1);
    c.font="60px Georgia";
    c.fillText("Press enter to restart the current level.", canvas.width/2-500, canvas.height/2+12);
  }
  else if ( gameState === "win" ){
    // Create gradient
    var gradient=c.createLinearGradient(0,0,canvas.width,0);
    gradient.addColorStop("0","magenta");
    gradient.addColorStop("0.5","white");
    gradient.addColorStop("1.0","red");
    // Fill with gradient
    c.fillStyle=gradient;

    c.font="90px Georgia";
    //c.fillStyle = "#FFFFFF";
    c.fillText("YOU WIN", canvas.width/2-canvas.width*0.2, canvas.height/2-canvas.height*0.1);
    c.font="60px Georgia";
    c.fillText("Press enter to move to the next level.", canvas.width/2-500, canvas.height/2+12);
    level += 1;
  }
}

function initializeCannonball(){
  var radius = 15;
  x = cannonX;
  y = cannonY;
  dx = 0.1*cannonR*Math.cos(cannonTheta);
  dy = -0.1*cannonR*Math.sin(cannonTheta);
  cannonBall = new Circle( x, y, dx, dy, radius, "#FFFFFF")
  moving = false;
}



// Code that runs the game and calls the Functions
function initialize(){
  numBalls = ballNumArray[level];

  t = 0;
  circleArray = [];

  // circleArray.push( new Circle( x, y, dx, dy, radius, color, is8ball) );
  radius = 20;
  x = canvas.width/2; y = canvas.height/2;
  dx = 0; dy = 0;
  switch (level) {
    case 0:
      circleArray.push( new Circle( canvas.width/2, canvas.height/2, dx, dy, radius, circleArrayColors[0], false) );
      break;
    case 1:
      circleArray.push( new Circle( x+50, y, dx, dy, radius, circleArrayColors[0], false) );
      circleArray.push( new Circle( x, y, dx, dy, radius, circleArrayColors[0], true) );
      break;
    case 2:
      break;
  }

  // // Fill bouncing ball array
  // for (var i = 1; i < 10; i++){
  //   var radius = Math.random()*30 + 5;
  //   // Prevents circles getting stuck in sides
  //   var x = Math.random() * (innerWidth-radius*2) + radius;
  //   var y = Math.random() * (innerHeight-radius*2) + radius;
  //   var dx = (Math.random()-0.5) * 3;
  //   var dy = (Math.random()-0.5) * 3;
  //   is8ball = false;
  //   color = "Teal"
  //   if (i<circleArrayColors.length){var color = circleArrayColors[i]}
  //   circleArray.push( new Circle( x, y, dx, dy, radius, color, is8ball) );
  // }
  // // Fill bad ball array (you lose if one goes in the pocket)
  // for (var i = 1; i < 2; i++){
  //   var radius = Math.random()*30 + 5;
  //   // Prevents circles getting stuck in sides
  //   var x = Math.random() * (innerWidth-radius*2) + radius;
  //   var y = Math.random() * (innerHeight-radius*2) + radius;
  //   var dx = (Math.random()-0.5) * 3;
  //   var dy = (Math.random()-0.5) * 3;
  //   is8ball = true;
  //   circleArray.push( new Circle( x, y, dx, dy, radius, "Black", is8ball) );
  // }
  // Fill pocket array
  radius = 35;
  dx = 0;
  dy = 0;
  pocketArray.push( new Circle( canvas.width-10,   canvas.height, dx, dy, radius, "grey") );
  pocketArray.push( new Circle( canvas.width/2,    canvas.height, dx, dy, radius, "grey") );
  pocketArray.push( new Circle( 0+10,              canvas.height, dx, dy, radius, "grey") );
  pocketArray.push( new Circle( canvas.width-10,   0, dx, dy, radius, "grey") );
  pocketArray.push( new Circle( canvas.width/2,    0, dx, dy, radius, "grey") );
  pocketArray.push( new Circle( 0+10,              0, dx, dy, radius, "grey") );
  // Done filling pocket array

  initializeCannonball();

}

initialize();
animate(); // Animate is the main function that keeps everything going
