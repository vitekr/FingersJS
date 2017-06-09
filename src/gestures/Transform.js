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

        _onFingerAdded: function(pNewFinger) {
        
            if(!this.isListening && this.listenedFingers.length >= 0) {

                switch(this.listenedFingers.length) {
                    case 0:
                        this._addListenedFinger(pNewFinger);
                        this.isListening = false;
                        this.options.scale = true;
                        this.options.rotate = true;
                        break;
                    case 1:
                        if(this.listenedFingers[0].state === 'active') {

                            this._addListenedFinger(pNewFinger);
                      
                            this._lastAngle = this._getFingersAngle();
                            this._startAngle = this._lastAngle;

                            this._lastDistance = this._getFingersDistance();
                            this._startDistance = this._lastDistance;
                            this.data.target = pNewFinger.getTarget(); 
                            
                            this.fire(_super.EVENT_TYPE.start, this.data);
                        } 
                        break;
                }
            } 
        },

        _onFingerUpdate: function(pFinger) {
            
            if(this.listenedFingers.length == 2) {
            
                var threshold = this.options.distanceThreshold*Utils.PPCM;
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

                if (this.data.scale && Math.abs(this.data.totalDistance) > threshold) {
                    this.data.rotate = false;
                }

                if (Math.abs(this.data.totalRotation) > this.options.angleThreshold || 
                    Math.abs(this.data.totalDistance) > threshold) {
                    this.fire(_super.EVENT_TYPE.move, this.data);  
                }
            }
        },

        _onFingerRemoved: function(pFinger) {
            switch (this.listenedFingers.length) {
                case 1:
                    pFinger._removeHandlerObject(this);
                    this.listenedFingers.length = 0;
                    this.isListening = false;
                    break;
                case 2:
                    this._removeAllListenedFingers();

                    this.fire(_super.EVENT_TYPE.end, this.data); 
                    this.data.rotate = this.data.scale = true;
                    break;
                default: 
                    this._removeAllListenedFingers();
            } 
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