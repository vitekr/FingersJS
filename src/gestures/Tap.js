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
        tapInterval: 180,
        tapDuration: 50,
        distanceThreshold: 0.4  // in cm
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

        _onFingerAdded: function(pNewFinger) {

            if(this.isListening && this.listenedFingers.length == 1) {
                pNewFinger._removeHandlerObject(this);
                this.listenedFingers.length = 0;
                this.isListening = false;
            }
            if(!this.isListening && this.listenedFingers.length < this.options.nbFingers) { 

                if((pNewFinger.getTime() - this.data.lastTapTimestamp) > this.options.tapInterval) {
                    this.data.lastTapTimestamp = 0;
                    this.data.nbTap = 0;
                }
                this._addListenedFinger(pNewFinger);
            } 
        },

        _onFingerUpdate: function(pFinger) {

            if (pFinger.getTotalTime() > this.options.tapInterval &&
               pFinger.getDistance() > this.options.distanceThreshold*Utils.PPCM) {
                pFinger._removeHandlerObject(this);
                this.listenedFingers.length = 0;
                this.isListening = false;
            }
        },

        _onFingerRemoved: function(pFinger) {

            pFinger._removeHandlerObject(this);
            this.listenedFingers.length = 0;
            this.isListening = false;
                             
            if (pFinger.getTotalTime() < this.options.tapInterval &&
               pFinger.getDistance() < this.options.distanceThreshold*Utils.PPCM) {
                this.data.lastTapTimestamp = pFinger.getTime();
                
                this.data.nbTap++;
                if (this.data.nbTap >= this.options.nbTapMin &&  
                    this.data.nbTap <= this.options.nbTapMax) {
                    this.data.tapPosition = [pFinger.getX(), pFinger.getY()];
                    this.data.target = pFinger.getTarget();
                    this.fire(_super.EVENT_TYPE.instant, this.data);

                } 
            }
        }
    });

    return Tap;
})(Fingers.Gesture);

Fingers.gesture.Tap = Tap;