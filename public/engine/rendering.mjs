/*
Rendering.js

Thie file converts the dicts of from physics.js to
actual things on the screen.

PIXI.Application must be instantiated seperately,
instead this file takes in the PIXI.Application. Also,
pixi.min.js _must_ have been called prior to this.
*/


//
// Globals of this file
//

const Graphics = new PIXI.Graphics();
const PALLETE = {
  'background': 0x1E252F,
  'foreground': 0x7AD585,
  'ball': 0xB786AD
}

export function getGraphicsObject () {
  return Graphics;
}





Graphics.beginFill(PALLETE.ball);
Graphics.drawRect(50, 50, 100, 100);
Graphics.endFill();

