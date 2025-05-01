import Sprite from './sprite.js';

const Bomb = function(ctx, x, y){
    const sequences = {
        exploding: {x: 64, y: 112, width: 16, height: 16, count: 9, timing: 100, loop: true}
    }

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.exploding)
    .setScale(2)
    .setShadowScale({ x: 0.75, y: 0.2 })
    .useSheet("./images/object_sprites.png");

    return{
        draw: sprite.draw,
        update: sprite.update
    }
}

export default Bomb;