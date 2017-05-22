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
        distanceThreshold: 0.5,
        duration: 600,
        preventCombinedGestures: true
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

        _onFingerAdded: function(pNewFinger, pFingerList) {
            // this protects from combined gesture recognition when overreached the number of 
            if(!this.isListening && 
                this.options.preventCombinedGestures && 
                pFingerList.length > this.options.nbFingers
                ) {
                    this._removeAllListenedFingers();
            }
            if(!this.isListening && pFingerList.length >= this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    this._addListenedFinger(pFingerList[i]);
                }

                clearTimeout(this.timer);
                this.data.target = pNewFinger.getTarget();
                this.timer = setTimeout(this._onHoldTimeLeftF, this.options.duration);
            }
        },

        _onFingerUpdate: function(pFinger) {

            // if the distanceThreshold is overreached in one or the other dimension, then cancel
            if(pFinger.currentP.x - pFinger.startP.x > this.options.distanceThreshold*Utils.PPCM) {
                this._onHoldCancel();
            }

            if(pFinger.currentP.y - pFinger.startP.y > this.options.disanceThreshold*Utils.PPCM) {
                this._onHoldCancel();
            }

            for(var i = 0, size = this.listenedFingers.length; i<size; i++) {
                if(this.listenedFingers[i].getDistance() > this.options.distanceThreshold*Utils.PPCM) {
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
            // console.log('Hold', this);
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