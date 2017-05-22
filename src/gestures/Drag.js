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
        distanceThreshold: 0.2, // in cm
        preventCombinedGestures: true
    };

    function Drag(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }


    Fingers.__extend(Drag.prototype, _super.prototype, {

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length == this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    // console.log('Finger ' + pNewFinger.id + '[+ Drag]')
                    this._addListenedFinger(pFingerList[i]);
                    this.fire(_super.EVENT_TYPE.start, null);
                }
            }

            // this protects from combined gesture recognition when overreached the number of 
            // fingers, i.e., drag+zoom is not possible
            if(this.options.preventCombinedGestures && pFingerList.length > this.options.nbFingers) {
                // console.log('Finger ' + pNewFinger.id + '[- Drag]')
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {
            if(pFinger.getDeltaDistance() > this.options.distanceThreshold*Utils.PPCM) {
                this.fire(_super.EVENT_TYPE.move, null);
            }
        },

        _onFingerRemoved: function(pFinger) {
            // console.log('Finger ' + pFinger.id + '[- Drag]')
            this.fire(_super.EVENT_TYPE.end, null);
            this._removeAllListenedFingers();
        }
    });

    return Drag;
})(Fingers.Gesture);

Fingers.gesture.Drag = Drag;    