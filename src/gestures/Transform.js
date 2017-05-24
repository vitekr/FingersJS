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
    var DEFAULT_OPTIONS = {
        distanceThreshold: 5,   // in cm
        angleThreshold: 0.13    // in rad
    };

    function Transform(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            totalRotation: 0,
            deltaRotation: 0,
            totalDistance: 0,
            deltaDistance: 0,
            totalScale: 1,
            deltaScale: 1,
            scale: true,
            rotate: true,
            target: null
        };
    }

    Fingers.__extend(Transform.prototype, _super.prototype, {

        _startAngle: 0,
        _lastAngle: 0,
        _startDistance: 0,
        _lastDistance: 0,
        _threshold: 1,
        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            this._threshold = this.options.distanceThreshold*Utils.PPCM;
            this.data.scale = true;
            this.data.rotate = true;
            if(!this.isListening && pFingerList.length == 2 && this.listenedFingers.length + pFingerList.length === 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);

                this._lastAngle = this._getFingersAngle();
                this._startAngle = this._lastAngle;

                this._lastDistance = this._getFingersDistance();
                this._startDistance = this._lastDistance;
    
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
            this.data.totalScale = newDistance / this._startDistance;
            this.data.deltaScale = newDistance / this._lastDistance;
            this.data.totalDistance = this._startDistance - newDistance;
            this.data.deltaDistance = this._lastDistance - newDistance;
            this._lastDistance = newDistance;
          
            if (this.data.rotate && Math.abs(this.data.totalRotation) > this.options.angleThreshold) {
                this.data.scale = false;     
            }

            if (this.data.scale && Math.abs(this.data.totalDistance) > this._threshold) {
                this.data.rotate = false;
            }

            if (Math.abs(this.data.totalRotation) > this.options.angleThreshold || 
                Math.abs(this.data.totalDistance) > this._threshold) {
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