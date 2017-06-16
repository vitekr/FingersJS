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
        distanceThreshold: 0.8,  // in cm
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

        _onFingerAdded: function(pNewFinger) {

            if(!this.isListening) {
                if(this.listenedFingers.length === 0) {
                    this._addListenedFinger(pNewFinger);
                    clearTimeout(this.timer);
                    this.timer = setTimeout(this._onHoldTimeLeftF, this.options.duration);
                    this.data.target = pNewFinger.getTarget();
                } else {
                    this.listenedFingers[0]._removeHandlerObject(this);
                    this.listenedFingers.length = 0;
                    clearTimeout(this.timer);
                }
            } else {
                if(this.listenedFingers.length === 1) {
                    this.listenedFingers[0]._removeHandlerObject(this);
                    this._onHoldCancel();
                    this.listenedFingers.length = 0;
                    this.isListening = false;
                }
            } 
        },

        _onFingerUpdate: function(pFinger) {
            var threshold = this.options.distanceThreshold*Utils.PPCM;
            if(this.listenedFingers.length > 0 && this.listenedFingers[0].getDistance() > threshold) {
                this._onHoldCancel();
                pFinger._removeHandlerObject(this);
            }
        },

        _onFingerRemoved: function(pFinger) {
            pFinger._removeHandlerObject(this);
            this._onHoldCancel();
        },

        _onHoldTimeLeftF: null,
        _onHoldTimeLeft: function() {
            this.fire(_super.EVENT_TYPE.instant, this.data);
            this._onHoldCancel();
        },

        _onHoldCancel: function() {
            this.listenedFingers.length = 0;
            this.isListening = false;
            clearTimeout(this.timer);
        }
    });

    return Hold;
})(Fingers.Gesture);

Fingers.gesture.Hold = Hold;