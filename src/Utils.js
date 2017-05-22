/**
 * @module fingers
 *
 * @class Utils
 */

var Utils = {

    DIRECTION: {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right'
    },

    GROW: {
        IN: 'in',
        OUT: 'out'
    },


    // ppcm is based on dot-pitch value (useful calculator is here: https://www.sven.de/dpi/)
    // dot-pitch mac: 0.1119 mm => 1 cm ~ 90 px
    // dot-pitch mac(percieved): 0.1989 => 1 cm ~ 50px
    // dot-pitch 4k computed: 0.3747 => 1cm ~ 27px
    // dot-pitch 4k counted: 0.3 => 1 cm ~ 34 px
    // dot-pitch Apple Cinema HD: 0.258 => 1 cm ~ 34 px
    // ppcm: pixels per centimeter
    PPCM: 30,

    getVelocity: function(deltaTime, deltaPos) {
        return Math.abs(deltaPos / deltaTime) || 0;
    },

    getOrientedVelocity: function(deltaTime, deltaPos) {
        return (deltaPos / deltaTime) || 0;
    },

    getDirection: function(deltaX, deltaY) {
        if(Math.abs(deltaX) >= Math.abs(deltaY)) {
            return (deltaX > 0) ? this.DIRECTION.RIGHT : this.DIRECTION.LEFT;
        }
        else {
            return (deltaY > 0) ? this.DIRECTION.DOWN : this.DIRECTION.UP;
        }
    },

    isVertical: function(direction) {
        return direction === this.DIRECTION.UP || direction === this.DIRECTION.DOWN;
    },

    getAngle: function(x, y) {
        return Math.atan2(x, y);
    },

    getDistance: function(x, y) {
        return Math.sqrt((x * x) + (y * y));
    },

    setPPCM: function(diagonal) {
        // sqrt(w^2 + h^2) / diagonal / 1in
        this.PPCM = Math.round(Math.sqrt(screen.width*screen.width + screen.height*screen.height)/diagonal/2.54);
        console.log(screen.width + 'x' + screen.height + '@' + diagonal + 'in; PPCM= ' + this.PPCM);
    }
};

Fingers.Utils = Utils;

