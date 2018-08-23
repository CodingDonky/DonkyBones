// Searches HTML document for element of canvas
var canvas = document.querySelector('canvas');

canvas.width = window.innerWidth-12;
canvas.height = window.innerHeight-10;
//canvas.width = 900;
//canvas.height = 700;

var moving = false;
var c = canvas.getContext('2d');
var t = 0;
var dt = .05;
var mass = 10;
var g = 9.81;
var spring = 0.3; // Objects spring from one another, not rigid collission

var keysDown = { 37:false, 38:false, 39:false, 40:false};
var cannonX = 50; var cannonY = canvas.height-50;
var cannonR = 80; var cannonTheta = Math.PI/4;
var cannonBall = new Circle(1,1,1,1,1,"red");//Dummy
gameState = "play"

var circleArray = [];
var blackHoleArray = [];
var targetArray = [];
var starArray = [];

// GAME SETTINGS
var numBalls = 0;
var numBlackHoles = 0;
var numTargets = 1;

var ballsIntercollide = true;
var level = 0;

// indexed by level
var ballNumArray =      [5,15,55,0,0,3,1,3,6,20,5,15];
var blackHoleNumArray = [0, 0, 0,1,1,1,2,1,1, 1,2, 2];
var targetNumArray =    [1, 1, 1,2,1,2,1,1,1, 2,1, 2];

// GAME SETTINGS

window.addEventListener("keydown", function(e) {
  if(e.keyCode>=37 && e.keyCode<=40) { keysDown[e.keyCode] = true; }
});
window.addEventListener("keyup", function(e) {
  if(e.keyCode>=37 && e.keyCode<=40) { keysDown[e.keyCode] = false; }
});
window.addEventListener("keypress", buttonpress, false);


// Detects directional key inpur
function processInput(currentFrameTime){
  if(keysDown[38]) {
    cannonR += 2;
    if(cannonR>150){cannonR=150;}
  } // Up
  else if(keysDown[40]) { cannonR -= 2; } // Down
  else if(keysDown[37]) { cannonTheta+=Math.PI/64; } // Left
  else if(keysDown[39]) { cannonTheta-=Math.PI/64; } // Right
  if (keysDown[37]||keysDown[38]||keysDown[39]||keysDown[40]) {
    initializeCannonball();
  }
}

function buttonpress(e){
  var keyCode = e.keyCode;
  console.log("You pressed " + keyCode);
  if(keyCode == 108){ // "L"
    // Rotate the game map when space is pressed
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
function Circle( x, y, dx, dy, radius, color){
  this.x = x;
  this.y = y;
  this.dx = dx;
  this.dy = dy;
  this.radius = radius;
  this.color = color;
  this.mass = radius*radius;
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

    // Down Gravity
    // this.dy += g*dt;

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

    // Circle Gravity from blackHoles
    for( var i = 0; i < blackHoleArray.length; i++){
      yDist = (blackHoleArray[i].y-this.y);
      xDist = (blackHoleArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);
      forceGravity = 100000/(dist*dist);
      forceGravityX = Math.sign(xDist)*forceGravity;
      forceGravityY = Math.sign(yDist)*forceGravity;

      this.dx += forceGravityX*dt;
      this.dy += forceGravityY*dt;

      if ( dist < this.radius + blackHoleArray[i].radius ){
        // YOU LOSE
        gameState = "lose";
      }
    }

    // Check if target is hit, in which case you win
    for( var i = 0; i < targetArray.length; i++){
      yDist = (targetArray[i].y-this.y);
      xDist = (targetArray[i].x-this.x);
      dist = Math.sqrt(xDist*xDist+yDist*yDist);

      if ( dist < this.radius + targetArray[i].radius ){
        // YOU LOSE
        gameState = "win";
      }
    }

    // Friction
    this.dy = this.dy*0.996;
    this.dx = this.dx*0.999;

    this.draw();
  }
  this.update = function(){
    if (this.x+this.radius > canvas.width || this.x-this.radius < 0){
      this.dx = -this.dx;
    }if (this.y+this.radius > canvas.height || this.y-this.radius < 0){
      this.dy = -this.dy;
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
  c.fillStyle = "#000000";
  //c.clearRect( 0, 0, innerWidth, innerHeight);
  c.fillRect( 0, 0, innerWidth, innerHeight);
  c.fillStyle = "#FFFFFF";
  c.fillText("LEVEL " + (level+1), 10, 20);
  c.fillText("Time : " + Math.round(t), 10, 40);
  c.fillText("Arrow keys move the cannon ", 10, 60);
  c.fillText("Space will fire the cannon ", 10, 72);
  c.fillText("Enter key to restart game ", 10, 84);
}

function animate(){
  if( t>60 ){
    gameState = "lose";
  }

  if( gameState === "play" ){
    t += dt;

    requestAnimationFrame(animate);
    drawMenu();


    // Draw all objects (Except for cannon)
    for( var i = 0; i < starArray.length; i++){
      starArray[i].update();
    }
    for( var i = 0; i < targetArray.length; i++){
      targetArray[i].update();
    }
    for( var i = 0; i < circleArray.length; i++){
      circleArray[i].update();
    }
    for( var i = 0; i < blackHoleArray.length; i++){
      blackHoleArray[i].update();
    }
    if (moving){cannonBall.updatePlayer();}

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
  cannonBall = new Circle( x, y, dx, dy, radius, "#7df9ff") // formerly blue
  moving = false;
}



// Code that runs the game and calls the Functions
function initialize(){
  numBalls = ballNumArray[level];
  numBlackHoles = blackHoleNumArray[level];
  numTargets = targetNumArray[level];

  t = 0;
  circleArray = [];
  blackHoleArray = [];
  targetArray = [];
  starArray = [];

  // Fill bouncing ball array
  for (var i = 1; i < numBalls+1; i++){
    var radius = Math.random()*30 + 5;
    // Prevents circles getting stuck in sides
    var x = Math.random() * (innerWidth-radius*2) + radius;
    var y = Math.random() * (innerHeight-radius*2) + radius;
    var dx = (Math.random()-0.5) * 3;
    var dy = (Math.random()-0.5) * 3;
    circleArray.push( new Circle( x, y, dx, dy, radius, "#f4a460") );
  }
  // Fill black hole array
  for (var i = 1; i < numBlackHoles+1; i++){
    var radius = 10;
    // Prevents circles getting stuck in sides
    var x = Math.random() * (innerWidth-radius*2) + radius;
    var y = Math.random() * (innerHeight-radius*2) + radius;
    var dx = (Math.random()-0.5) * 0;
    var dy = (Math.random()-0.5) * 0;
    blackHoleArray.push( new Circle( x, y, dx, dy, radius, "red") );
  }
  // Fill target array
  for (var i = 1; i < numTargets+1; i++){
    var radius = 5;
    // Prevents circles getting stuck in sides
    var x = Math.random() * (innerWidth-radius*2) + radius;
    var y = Math.random() * (innerHeight-radius*2) + radius;
    var dx = 0;
    var dy = 0;
    targetArray.push( new Circle( x, y, dx, dy, radius, "yellow") );
  }
  numStars = Math.round(69 + Math.random()*420);
  // Fill stars array
  for (var i = 1; i < numStars; i++){
    var radius = Math.random()*3;
    // Prevents circles getting stuck in sides
    var x = Math.random() * (innerWidth-radius*2) + radius;
    var y = Math.random() * (innerHeight-radius*2) + radius;
    var dx = 0;
    var dy = 0;
    starArray.push( new Circle( x, y, dx, dy, radius, "white") );
  }
  initializeCannonball();

}

initialize();
animate(); // Animate is the main function that keeps everything going
