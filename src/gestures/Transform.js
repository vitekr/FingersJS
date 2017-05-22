/**
 * @module gestures
 *
 * @class Transform
 * @constructor
 * @param {Object} pOptions
 * @param {Function} pHandler
 * @return {Transform}
 */

var Transform = (function (_super) {
    // TODO: add thresholds
    var DEFAULT_OPTIONS = {
        distanceThreshold: 2.5,
        angleThreshold: 4
    };

    function Transform(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            totalRotation: 0,
            deltaRotation: 0,
            totalDistance: 0,
            deltaDistance: 0,
            target: null
        };
    }

    Fingers.__extend(Transform.prototype, _super.prototype, {

        _startAngle: 0,
        _lastAngle: 0,
        _startDistance: 0,
        _lastDistance: 0,
        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length == 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);


                this._lastAngle = this._getFingersAngle();
                this._startAngle = this._lastAngle;
                // this.data.totalRotation = 0;
                // this.data.deltaRotation = 0;

                this._lastDistance = this._getFingersDistance();
                this._startDistance = this._lastDistance;
                // this.data.totalDistance = 0;
                // this.data.deltaDistance = 0;


                //target element is under the first finger
                this.data.target = pFingerList[0].getTarget();   

                this.fire(_super.EVENT_TYPE.start, this.data);
            }
        },

        _onFingerUpdate: function(pFinger) {
         
            var newAngle = this._getFingersAngle();
            this.data.totalRotation = this._startAngle - newAngle;
            this.data.deltaRotation = this._lastAngle - newAngle;
            this._lastAngle = newAngle;

            var newDistance = this._getFingersDistance();
            this.data.totalDistance = this._startDistance - newDistance;
            this.data.deltaDistance = this._lastDistance - newDistance;
            this._lastDistance = newDistance;
            

            if(Math.abs(this.data.totalDistance) > this.options.distanceThreshold*Utils.PPCM) {
                this.data.totalRotation = 0;
                this.data.deltaRotation = 0;
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }


           if(Math.abs(this.data.totalRotation) > this.options.angleThreshold) {
                this.data.totalDistance = 0;
                this.data.deltaScale = 0;
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }

        },

        _onFingerRemoved: function(pFinger) {
            this._removeAllListenedFingers();
            this.fire(_super.EVENT_TYPE.end, this.data);
        },

        _getFingersAngle: function() {
            return Fingers.FingerUtils.getFingersAngle(this.listenedFingers[0], this.listenedFingers[1]);
        },

        _getFingersDistance: function() {
            return Fingers.FingerUtils.getFingersDistance(this.listenedFingers[0], this.listenedFingers[1]);
        }
    });

    return Transform;
})(Fingers.Gesture);

Fingers.gesture.Transform = Transform;