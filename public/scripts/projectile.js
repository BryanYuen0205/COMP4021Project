import Sprite from './sprite.js';


// This function defines the Projectile module.
// - `ctx` - A canvas context for drawing
// - `x` - The initial x position of the player
// - `y` - The initial y position of the player
// - `gameArea` - The bounding box of the game area
// - `direction` - direction of movement for projectile 
//      - 0=left, 1=down, 2=right, 3=up
const Projectile = function(ctx, x, y, gameArea, direction) {
    // For now, want to implement projectile as an orb, and not worry about 
    // directional animation. Below we set up the animation.
    const projectileSequence =  {x: 0, y: 0, width: 20, height: 20, count: 2, timing: 100, loop: true};
    
    const sprite = Sprite(ctx, x, y);
    /** Direction and meaning:
     *  '0': Moving left
     *  '1': Moving up
     *  '2': Moving right
     *  '3': Moving down
     */

    sprite.setSequence(projectileSequence)
    .setScale(1.5)
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

    const update = function(time) {
        /* Update the projectile's location based on input direction */
        let { x, y } = sprite.getXY();

        /** Move the projectile. 
         * 1 frame is 60th of a second, so 1/60th of the number of pixels to be moved
         * in one second.
        */
        switch (direction) {
            case 0: x -= speed / 60; break;
            case 1: y -= speed / 60; break;
            case 2: x += speed / 60; break;
            case 3: y += speed / 60; break;
        }

        /* Set the new position if it is within the game area */
        sprite.setXY(x, y);

        /* Update the sprite object */
        sprite.update(time);
    };

    return{
        getXY: sprite.getXY,
        getBoundingBox: sprite.getBoundingBox,
        draw: sprite.draw,
        update: update,
        speedUp: speedUp,
        slowDown: slowDown,
    }
}
export default Projectile;