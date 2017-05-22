/**
 * @module gestures
 *
 * @class Scale
 * @constructor
 * @param {Object} pOptions
 * @return {Scale}
 */

 var Scale = (function (_super) {
    // TODO: add thresholds
    var DEFAULT_OPTIONS = {
        distanceThreshold: 2.5 // in cm
    };

    function Scale(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            totalDistance: 0,
            deltaDistance: 0,
            target: null
        };
    }

    Fingers.__extend(Scale.prototype, _super.prototype, {

        _startDistance: 0,
        _lastDistance: 0,
        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length >= 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);
       
                this._lastDistance = this._getFingersDistance();
                this._startDistance = this._lastDistance;
                this.data.totalDistance = 1;
                this.data.deltaDistance = 1;
                this.data.target = pFingerList[0].getTarget();
          
                this.fire(_super.EVENT_TYPE.start, this.data);
            }
        },

        _onFingerUpdate: function(pFinger) {
            var newDistance = this._getFingersDistance();
            // this.data.totalScale = newDistance / this._startDistance;
            // this.data.deltaScale = newDistance / this._lastDistance;
            this.data.totalDistance = this._startDistance - newDistance;
            this.data.deltaDistance = this._lastDistance - newDistance;
            this._lastDistance = newDistance;
            if(Math.abs(this.data.totalDistance) > this.options.distanceThreshold*Utils.PPCM) {
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }
        },

        _onFingerRemoved: function(pFinger) {
            this._removeAllListenedFingers();
            this.fire(_super.EVENT_TYPE.end, this.data);
        },

        _getFingersDistance: function() {
            return Fingers.FingerUtils.getFingersDistance(this.listenedFingers[0], this.listenedFingers[1]);
        }
    });

    return Scale;
})(Fingers.Gesture);

Fingers.gesture.Scale = Scale;