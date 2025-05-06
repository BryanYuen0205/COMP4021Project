import Sprite from './sprite.js';

const Boots = function(ctx, x, y){
    const sequences = {
        boots: {x: 144, y: 48, width: 16, height: 16, count: 1, timing: 100, loop: true}
    }

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.boots)
    .setScale(2)
    .setShadowScale({ x: 0.75, y: 0.2 })
    .useSheet("./images/object_sprites.png");

    // This is the birth time of the gem for finding its age.
    let birthTime = performance.now();

    // This function gets the age (in millisecond) of the gem.
    // - `now` - The current timestamp
    const getAge = function(now) {
        return now - birthTime;
    };

    const randomize = function(pos) {
        // console.log(gemAttr.gemColor + " " + gemAttr.gemPosition);
        /* Randomize the position */
        const {x, y} = pos;
        sprite.setXY(x, y);
        birthTime = performance.now();
    };

    // The methods are returned as an object here.
    return {
        getXY: sprite.getXY,
        setXY: sprite.setXY,
        getAge: getAge,
        getBoundingBox: sprite.getBoundingBox,
        randomize: randomize,
        draw: sprite.draw,
        update: sprite.update
    };
}

export default Boots;