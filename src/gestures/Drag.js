/**
 * @module gestures
 *
 * @class Drag
 * @constructor
 * @param {Object} pOptions
 * @return {Drag}
 */
var Drag = (function (_super) {

    var DEFAULT_OPTIONS = {
        nbFingers: 1,
        distanceThreshold: 0.3,      // in cm
    };

    function Drag(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }

    Fingers.__extend(Drag.prototype, _super.prototype, {

        _onFingerAdded: function(pNewFinger) {

            if(!this.isListening && this.listenedFingers.length < this.options.nbFingers) {
                this._addListenedFinger(pNewFinger);
                this.fire(_super.EVENT_TYPE.start, null);
            } 
            
            if(this.isListening && pNewFinger !== this.listenedFingers[0]) {
               this.listenedFingers[0]._removeHandlerObject(this);
                this.listenedFingers.length = 0;
                this.isListening = false;
            }
        },

        _onFingerUpdate: function(pFinger) {
            var threshold = this.options.distanceThreshold*Utils.PPCM;
            
            if(pFinger.getDeltaDistance() > threshold) {
                this.fire(_super.EVENT_TYPE.move, null);
            }
        },

        _onFingerRemoved: function(pFinger) {
            this.fire(_super.EVENT_TYPE.end, null);
            pFinger._removeHandlerObject(this);
            this.listenedFingers.length = 0;
            this.isListening = false;
        }
    });

    return Drag;
})(Fingers.Gesture);

Fingers.gesture.Drag = Drag;   