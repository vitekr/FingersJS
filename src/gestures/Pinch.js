/**
 * @module gestures
 *
 * @class Pinch
 * @constructor
 * @param {Object} pOptions
 * @return {Pinch}
 */
var Pinch = (function (_super) {

    var DEFAULT_OPTIONS = {
        pinchInDetect: 0.6,
        pinchOutDetect: 1.4
    };

    function Pinch(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            grow: null,
            scale: 1,
            target: null
        };
    }

    Fingers.__extend(Pinch.prototype, _super.prototype, {

        _startDistance: 0,
        data: null,

        _onFingerAdded: function(pNewFinger) {

            if(!this.isListening) {
                if(this.listenedFingers.length < 3) {
                    this._addListenedFinger(pNewFinger);
                    this.isListening = false;
                } else {
                    if(this.listenedFingers[0].state === 'active' &&
                       this.listenedFingers[1].state === 'active' &&
                       this.listenedFingers[2].state === 'active') {
                        this._addListenedFinger(pNewFinger);
                        this._startDistance = this._getFingersDistance();
                        this.data.target = pNewFinger.getTarget();
                        this.fire(_super.EVENT_TYPE.start, this.data);
                    } else {
                        this._removeAllListenedFingers();
                    }
                }
            } else {
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {},

        _onFingerRemoved: function(pFinger) {

            switch (this.listenedFingers.length) {
                case 1:
                case 2:
                case 3:
                    pFinger._removeHandlerObject(this);
                    this.listenedFingers.length = 0;
                    this.isListening = false;
                    break;
                case 4:

                    var newDistance = this._getFingersDistance();
                    var scale = newDistance / this._startDistance;

                    if(scale <= this.options.pinchInDetect || scale >= this.options.pinchOutDetect) {
                        this.data.grow = (scale > 1) ? Utils.GROW.OUT : Utils.GROW.IN;
                        this.data.scale = scale;
                        this.fire(_super.EVENT_TYPE.instant, this.data);
                    }
                    break;
                default: 
                    this._removeAllListenedFingers();
            } 
        },

        _getFingersDistance: function() {
            var finger1P = this.listenedFingers[0].currentP;
            var finger2P = this.listenedFingers[1].currentP;
            return Fingers.Utils.getDistance(finger2P.x - finger1P.x, finger2P.y - finger1P.y);
        }
    });

    return Pinch;
})(Fingers.Gesture);

Fingers.gesture.Pinch = Pinch;