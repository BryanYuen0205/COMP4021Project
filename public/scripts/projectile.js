import Sprite from './sprite.js';


// This function defines the Projectile module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
const Projectile = function(ctx, x, y, gameArea) {
    // For now, want to implement projectile as an orb, and not worry about 
    // directional animation. Below we set up the animation.
    const projectileSequence =  {x: 0, y: 0, width: 20, height: 20, count: 2, timing: 100, loop: true};
    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(projectileSequence)
    .setScale(2)
    .setShadowScale({ x: 0.75, y: 0.2 })
    .useSheet("./images/projectile.png");
    
    // Declaring variables for use
    let speed = 200;
    
    // speedUp and slowDown functions to control projectile speeds.
    const speedUp = function(up) {
        speed += up;
    };

    // This function slows down the player.
    const slowDown = function(down) {
        speed -= down;
    };
    return{
        getXY: sprite.getXY,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update:sprite.update,
        speedUp: speedUp,
        slowDown: slowDown
    }
}
export default Projectile;