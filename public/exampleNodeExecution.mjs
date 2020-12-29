/*
Example Node Execution
======================

As of now, anything involving PIXI (graphics)
cannot be run server-side via node. There is
probably a way to fix this by making it ignore
any calls to PIXI or importing PIXI, I don't
want to bother with it.

So, instead, this file is here to test out 
server-side execution of a non-graphics module.

In the future I would like to implement legitimate
testing so this is a useful litmus test.
*/

import * as sim from './engine/physics.mjs';

let myCirc = sim.generateCircle(50, 50, 10);
let myShape = sim.generateSegmentsArray([
    sim.generatePoint(0, 0),
    sim.generatePoint(100, 0),
    sim.generatePoint(100, 100),
    sim.generatePoint(25, 100),
    sim.generatePoint(0, 75)
  ]);

console.log(myShape);
