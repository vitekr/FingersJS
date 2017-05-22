/**
 * @module gestures
 *
 * @class Tap
 * @constructor
 * @param {Object} pOptions
 * @return {Swipe}
 */

var Tap = (function (_super) {

    var DEFAULT_OPTIONS = {
        nbFingers: 1,
        nbTapMin: 0,
        nbTapMax: 50,
        tapInterval: 300,
        distanceThreshold: 0.5
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

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length >= this.options.nbFingers) {

                if((pNewFinger.getTime() - this.data.lastTapTimestamp) > this.options.tapInterval) {
                    this._clearTap();
                }

                for(var i=0; i<this.options.nbFingers; i++) {
                    this._addListenedFinger(pFingerList[i]);
                }
            }
        },

        _onFingerUpdate: function(pFinger) {
            if(pFinger.currentP.timestamp - pFinger.startP.timestamp > this.options.tapInterval) {
                this._removeAllListenedFingers();
            }
        },

        _onFingerRemoved: function(pFinger) {

            this._removeAllListenedFingers();

            if(pFinger.getTotalTime() < this.options.tapInterval &&
               pFinger.getDistance() < this.options.distanceThreshold*Utils.PPCM) {
                this.data.lastTapTimestamp = pFinger.getTime();
                this.data.tapPosition = [pFinger.getX(), pFinger.getY()];
                this.data.target = pFinger.getTarget();
                this.data.nbTap++;

                if(this.data.nbTap >= this.options.nbTapMin && 
                   this.data.nbTap <= this.options.nbTapMax) {
                    this.fire(_super.EVENT_TYPE.instant, this.data);
                }
            }
        },

        _clearTap: function() {
            this.data.lastTapTimestamp = 0;
            this.data.nbTap = 0;
        }

    });

    return Tap;
})(Fingers.Gesture);

Fingers.gesture.Tap = Tap;
