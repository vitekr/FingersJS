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
        distanceThreshold: 0.3      // in cm
    };

    function Drag(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }


    Fingers.__extend(Drag.prototype, _super.prototype, {
        
        _threshold: DEFAULT_OPTIONS.distanceThreshold*Utils.PPCM,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && 
               pFingerList.length+this.listenedFingers.length <= this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    this._addListenedFinger(pFingerList[i]);
                    this.fire(_super.EVENT_TYPE.start, null);
                }
            } else {
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {
            var threshold = this._threshold;
            
            if(pFinger.getDeltaDistance() > threshold) {
                this.fire(_super.EVENT_TYPE.move, null);
            }
        },

        _onFingerRemoved: function(pFinger) {
            var threshold = this._threshold;
            if(pFinger.getDeltaDistance() > threshold) {
                this.fire(_super.EVENT_TYPE.end, null);
            }
            this._removeAllListenedFingers();
        }
    });

    return Drag;
})(Fingers.Gesture);

Fingers.gesture.Drag = Drag;   