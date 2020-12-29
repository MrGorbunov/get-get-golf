import * as SIM from './engine/physics.mjs';
import * as DRAW from './engine/rendering.mjs';

const app = new PIXI.Application({
  width: 500,
  height: 500,
  antialias: true,
  resolution: 1,
  backgroundColor: 0x1E252F
});



PIXI.loader.load(setup);

var golfBall_sim,
    levelBorder_sim;

var golfBall_graphic, 
    level_graphic,
    gameplayGraphics;


var mousePos = {x:1, y: 2};


function setup () {
  // Generate Primitives
  golfBall_sim = SIM.generateCircle(50, 50, 10);
  levelBorder_sim = SIM.generateSegmentsArray([
    SIM.generatePoint(0, 0),
    SIM.generatePoint(100, 0),
    SIM.generatePoint(100, 100),
    SIM.generatePoint(25, 100),
    SIM.generatePoint(0, 75)
  ]);

  level_graphic = new PIXI.Graphics();
  golfBall_graphic = new PIXI.Graphics();
  gameplayGraphics = new PIXI.Container();

  DRAW.drawDebugSegmentArray(level_graphic, levelBorder_sim, false);
  DRAW.drawDebugCircle(golfBall_graphic, golfBall_sim);

  gameplayGraphics.addChild(level_graphic);
  gameplayGraphics.addChild(golfBall_graphic);
  app.stage.addChild(gameplayGraphics);

  gameplayGraphics.scale.set(4, 4);
  gameplayGraphics.position.set(40, 40);

  gameplayGraphics.interactive = true;
  gameplayGraphics.buttonMode = true;
  gameplayGraphics.on('pointermove', event => recordMousePosition(event));

  document.body.appendChild(app.view);
  // app.ticker.add((delta) => gameLoop(delta));
  gameLoop(1);
}

function gameLoop (delta) {
  // if (mousePos.x < 0 || mousePos.x > app.view.width ||
  //     mousePos.y < 0 || mousePos.y > app.view.height)
  //       return;
  
  // let actualPosition = gameplayGraphics.toLocal(mousePos);
  // actualPosition.x -= 40;
  // actualPosition.y -= 40;
  // golfBall_sim.x = actualPosition.x;
  // golfBall_sim.y = actualPosition.y;
  
  // golfBall_graphic.position.set(actualPosition.x, actualPosition.y);

  var isCollision = false;
  levelBorder_sim.forEach((segment) => {
    if (SIM.isColliding(segment, golfBall_sim)) {
      console.log("Collision found between: ");
      console.log(segment);
      console.log(golfBall_sim);
      // console.log(segment);
      isCollision = true;
    }
  });

  // golfBall_graphic.visible = !isCollision;
}

function recordMousePosition (event) {
  mousePos = event.data.global;
}

