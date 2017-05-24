/**
 * @module gestures
 *
 * @class Hold
 * @constructor
 * @param {Object} pOptions
 * @return {Hold}
 */
var Hold = (function (_super) {
   
    var DEFAULT_OPTIONS = {
        nbFingers: 1,
        distanceThreshold: 1,  // in cm
        duration: 600          // in ms
    };

    function Hold(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
        this._onHoldTimeLeftF = this._onHoldTimeLeft.bind(this);
        this.data = {
            target: 'null'
        };
    }

    Fingers.__extend(Hold.prototype, _super.prototype, {

        timer: null,
        _threshold: DEFAULT_OPTIONS.distanceThreshold*Utils.PPCM,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length >= this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    this._addListenedFinger(pFingerList[i]);
                }
                clearTimeout(this.timer);
                this.timer = setTimeout(this._onHoldTimeLeftF, this.options.duration);
                this.data.target = pNewFinger.getTarget();
            }

            if (this.listenedFingers.length+pFingerList.length-this.options.nbFingers > this.options.nbFingers) {
                // console.log('too many fingers, removing hold: ' + pFingerList.length + ', ' + this.listenedFingers.length)
                this._onHoldCancel();
            }
        },

        _onFingerUpdate: function(pFinger) {


            // cancel when the distance threshold is overreached in at least one of the dimensions
            if(Math.abs(pFinger.currentP.x - pFinger.startP.x) > this._threshold || 
               Math.abs(pFinger.currentP.y - pFinger.startP.y) > this._threshold) {
                this._onHoldCancel();
            }

            for(var i = 0, size = this.listenedFingers.length; i<size; i++) {
                if(this.listenedFingers[i].getDistance() > this._threshold) {
                    this._onHoldCancel();
                    break;
                }
            }
        },

        _onFingerRemoved: function(pFinger) {
            this._onHoldCancel();
        },

        _onHoldTimeLeftF: null,
        _onHoldTimeLeft: function() {
            this.fire(_super.EVENT_TYPE.instant, this.data);
        },

        _onHoldCancel: function() {
            this._removeAllListenedFingers();
            clearTimeout(this.timer);
        }
    });

    return Hold;
})(Fingers.Gesture);

Fingers.gesture.Hold = Hold;