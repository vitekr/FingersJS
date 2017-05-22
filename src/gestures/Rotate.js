/**
 * @module gestures
 *
 * @class Rotate
 * @constructor
 * @param {Object} pOptions
 * @param {Function} pHandler
 * @return {Rotate}
 */

var Rotate = (function (_super) {
    var DEFAULT_OPTIONS = {
        angleThreshold: 5
    };

    function Rotate(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            totalRotation: 0,
            deltaRotation: 0,
            target: null
        };
    }

    Fingers.__extend(Rotate.prototype, _super.prototype, {

        _startAngle: 0,
        _lastAngle: 0,
        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length == 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);

                this._lastAngle = this._getFingersAngle();
                this._startAngle = this._lastAngle;

                this.data.totalRotation = 0;
                this.data.deltaRotation = 0;
                this.data.target = pFingerList[0].getTarget();

                this.fire(_super.EVENT_TYPE.start, this.data);
            }
        },

        _onFingerUpdate: function(pFinger) {
 
            var newAngle = this._getFingersAngle();
            this.data.totalRotation = this._startAngle - newAngle;
            this.data.deltaRotation = this._lastAngle - newAngle;
            this._lastAngle = newAngle;
            // console.log(this.data.totalRotation, this.data.deltaRotation, newAngle)
            
            // if(Math.abs(this.data.deltaRotation) > this.options.angleThreshold) {
            //    this.fire(_super.EVENT_TYPE.move, this.data);            
            // }
           if(Math.abs(this.data.totalRotation) > this.options.angleThreshold) {
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }

        },

        _onFingerRemoved: function(pFinger) {
            this._removeAllListenedFingers();
            this.fire(_super.EVENT_TYPE.end, this.data);
        },

        _getFingersAngle: function() {
            return Fingers.FingerUtils.getFingersAngle(this.listenedFingers[0], this.listenedFingers[1]);
        }
    });

    return Rotate;
})(Fingers.Gesture);

Fingers.gesture.Rotate = Rotate;