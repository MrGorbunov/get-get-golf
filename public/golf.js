// Aliases & App initialization
let Application = PIXI.Application,
    Loader = PIXI.loader,
    LoaderResources = PIXI.loader.resources,
    Sprite = PIXI.Sprite;

const app = new PIXI.Application({
  width: 640, 
  height: 427,
  antialias: true,
  transparent: false,
  resolution: 1
});
document.body.appendChild(app.view);


// Keyboard function
function keyboard(value) {
  let key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.key === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.key === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);
  
  window.addEventListener(
    "keydown", downListener, false
  );
  window.addEventListener(
    "keyup", upListener, false
  );
  
  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener("keydown", downListener);
    window.removeEventListener("keyup", upListener);
  };
  
  return key;
}

let velocityX = 0;
let velocityY = 0;

let upKeyPress = keyboard('ArrowUp');
let downKeyPress = keyboard('ArrowDown');
upKeyPress.press = () => { velocityY -= 1;  }
upKeyPress.release = () => { velocityY += 1; }
downKeyPress.press = () => { velocityY += 1; }
downKeyPress.release = () => { velocityY -= 1; }

let leftKeyPress = keyboard('ArrowLeft');
let rightKeyPress = keyboard('ArrowRight');
leftKeyPress.press = () => { velocityX -= 1; }
leftKeyPress.release = () => { velocityX += 1; }
rightKeyPress.press = () => { velocityX += 1; }
rightKeyPress.release = () => { velocityX -= 1; }


// Pre-load all images
Loader
  .add([
    "img/paris-bg.jpg",
    "img/panda.png"
  ])
  .load(setup);
let pandaSprite, bgSprite;



// Setup call
function setup () {
  pandaSprite = new Sprite(LoaderResources["img/panda.png"].texture);
  bgSprite = new Sprite(LoaderResources["img/paris-bg.jpg"].texture);

  app.stage.addChild(bgSprite);
  app.stage.addChild(pandaSprite);

  pandaSprite.x = app.view.width / 2 - pandaSprite.width / 2;
  pandaSprite.y = app.view.height / 2 - pandaSprite.height / 2;
  // I can also use pivot
  // pivot = image origin (affects translateion)
  // anchor = rotation center (no change to translation)
  // pandaSprite.anchor.set(0.5, 0.5);
  // pandaSprite.rotation = 3.14159 / 2;



  // Put this at the end of setup so that it's guarnateed that setup finished
  app.ticker.add((delta) => gameLoop(delta));
}

// Loop
const SPEED = 5;

function gameLoop (delta) {
  let actualVelX = velocityX;
  let actualVelY = velocityY;

  if (velocityX && velocityY) {
    // Divide by sqrt(2) so that speed (Vx^2 + Vy^2 = 1)
    actualVelX /= 1.41;
    actualVelY /= 1.41;
  }

  pandaSprite.x += actualVelX * SPEED;
  pandaSprite.y += actualVelY * SPEED;

  // Making sure everything stays on screen
  if (velocityX) {
    let maxX = app.view.width - pandaSprite.width;
    if (pandaSprite.x < 0) pandaSprite.x = 0;
    else if (pandaSprite.x > maxX) pandaSprite.x = maxX;
  }

  if (velocityY) {
    let maxY = app.view.height - pandaSprite.height;
    if (pandaSprite.y < 0) pandaSprite.y = 0;
    else if (pandaSprite.y > maxY) pandaSprite.y = maxY;
  }

}
