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



/*
Construct a circle, and draw it to the screen.
*/

