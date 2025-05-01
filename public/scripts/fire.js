import Sprite from './sprite.js';

const Fire = function(ctx, x, y){
    const sequences = {
        burning: {x: 0, y: 160, width: 16, height: 16, count: 8, timing: 100, loop: true}
    }

    const sprite = Sprite(ctx, x, y);

    sprite.setSequence(sequences.burning)
    .setScale(2)
    .setShadowScale({ x: 0.75, y: 0.2 })
    .useSheet("./images/object_sprites.png");

    return{
        draw: sprite.draw,
        update: sprite.update
    }
}

export default Fire;