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

    function Rotate(pOptions, pHandler) {
        _super.call(this, pOptions, pHandler);

        this.data = {
            totalRotation: 0,
            deltaRotation: 0
        }
    }

    __extend(Rotate.prototype, _super.prototype, {

        _startAngle: 0,
        _lastAngle: 0,
        data: null,

        _onFingerAddedImpl: function(pFingerList) {
            if(pFingerList.length >= 2) {
                this._startListeningFingers(pFingerList[0], pFingerList[1]);

                this._handler(_super.EVENT_TYPE.start, 0, this.listenedFingers);
                this._lastAngle = this._getFingersAngle();
                this._startAngle = this._lastAngle;
            }
        },

        _onFingerUpdate: function() {
            var newAngle = this._getFingersAngle();
            this.data.totalRotation = this._startAngle - newAngle;
            this.data.deltaRotation = this._lastAngle - newAngle;
            this._lastAngle = newAngle;

            this._handler(_super.EVENT_TYPE.move, this.data, this.listenedFingers);
        },

        _onFingerRemovedImpl: function(pFinger) {
            this._handler(_super.EVENT_TYPE.end, 0, this.listenedFingers);

            this._stopListeningFingers();
        },

        _getFingersAngle: function() {
            var finger1P = this.listenedFingers[0].currentP;
            var finger2P = this.listenedFingers[1].currentP;
            return Fingers.Utils.getAngle(finger2P.x - finger1P.x, finger2P.y - finger1P.y);
        }
    });

    return Rotate;
})(Fingers.Gesture);

Fingers.gesture.Rotate = Rotate;