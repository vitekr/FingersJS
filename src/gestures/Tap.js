/**
 * @module gestures
 *
 * @class Tap
 * @constructor
 * @param {Object} pOptions
 * @return {Tap}
 */
var Tap = (function (_super) {

    var DEFAULT_OPTIONS = {
        nbFingers: 1,
        nbTapMin: 1,
        nbTapMax: 1,
        tapInterval: 200,
        distanceThreshold: 0.6  // in cm
    };

    function Tap(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
        this.data = {
            nbTap: 0,
            lastTapTimestamp: 0,
            tapPosition: [0,0],
            target: null
        };
    }

    Fingers.__extend(Tap.prototype, _super.prototype, {

        data: null,
        _distance: 0,
        _threshold: 0,
        _delay: 0,

        _onFingerAdded: function(pNewFinger) {
            this._delay = pNewFinger.getTime() - this.data.lastTapTimestamp;
            if(this._delay > this.options.tapInterval) { // First tap
                this.data.lastTapTimestamp = pNewFinger.getTime();
                this.data.nbTap = 0;
                this._threshold = this.options.distanceThreshold*Utils.PPCM;
                this.data.tapPosition = [pNewFinger.getX(), pNewFinger.getY()];
                this.data.target = pNewFinger.getTarget();
            } else { // Second tap
                this._distance = Fingers.Utils.getDistance(pNewFinger.getX() - this.data.tapPosition[0], pNewFinger.getY() - this.data.tapPosition[1]);
            }
            this._addListenedFinger(pNewFinger);
        },

        _onFingerUpdate: function(pFinger) {
            if(pFinger.getDistance() > this._threshold) {
                this._removeListenedFinger(pFinger);
            }
        },

        _onFingerRemoved: function(pFinger) {
            this._removeListenedFinger(pFinger);
            this.data.nbTap++;
            if (this._delay < this.options.tapInterval && this._distance < this._threshold && 
                this.data.nbTap >= this.options.nbTapMin && this.data.nbTap <= this.options.nbTapMax) {
                    this.fire(_super.EVENT_TYPE.instant, this.data);
            } 
        }
    });

    return Tap;
})(Fingers.Gesture);

Fingers.gesture.Tap = Tap;