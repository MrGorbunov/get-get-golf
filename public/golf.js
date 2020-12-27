import * as sim from './engine/physics.mjs';
import * as graphics from './engine/rendering.mjs';

const app = new PIXI.Application({
  width: 500,
  height: 500,
  antialias: true,
  resolution: 1
});

document.body.appendChild(app.view);
app.stage.addChild(graphics.getGraphicsObject());


let golfBall = sim.generateCircle(50, 50, 5);

let hipAndRadShape = sim.generateSegmentsArray([
  sim.generatePoint(10, 10),
  sim.generatePoint(10, 20),
  sim.generatePoint(0, 40)
]);

graphics.drawSegmentArray(hipAndRadShape);
graphics.drawCircle(golfBall);




PIXI.loader.load(setup);
var scale = 0.3;
var xPos = 0;


function setup () {
  // okie

  app.ticker.add((delta) => gameLoop(delta));
}

function gameLoop (delta) {
  scale *= 1.003;
  xPos += 0.3;
  app.stage.scale.set(scale, scale);
  app.stage.position.set(xPos, 0);
}
