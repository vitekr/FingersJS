/*! FingersJS - v1.6.0 - 2017-06-16
 * https://github.com/vitekr/FingersJS
 *
 * Copyright (c) 2017 Vít Rusňák <vit.rusnak@gmail.com>;
 * Based on original Fingers.js by Jérôme HENAFF <jerome.henaff@gmail.com>
 * Licensed under the MIT license */

(function(window, undefined) {
    'use strict';

    var Fingers = function Fingers(pElement) {
        return new Fingers.Instance(pElement);
    };

    Fingers.__extend = function(obj) {
        Array.prototype.slice.call(arguments, 1).forEach(function(source) {
            if (source) {
                for (var prop in source) {
                    obj[prop] = source[prop];
                }
            }
        });
        return obj;
    };

/**
 * @module fingers
 *
 * @class Utils
 */

var Utils = {

    DIRECTION: {
        UP: 'up',
        DOWN: 'down',
        LEFT: 'left',
        RIGHT: 'right'
    },

    GROW: {
        IN: 'in',
        OUT: 'out'
    },

    // ppcm is based on dot-pitch value (useful calculator is here: https://www.sven.de/dpi/)
    // dot-pitch mac: 0.1119 mm => 1 cm ~ 90 px
    // dot-pitch mac(percieved): 0.1989 => 1 cm ~ 50px
    // dot-pitch 4k computed: 0.3747 => 1cm ~ 27px
    // dot-pitch 4k counted: 0.3 => 1 cm ~ 34 px
    // dot-pitch Apple Cinema HD: 0.258 => 1 cm ~ 34 px
    // ppcm: pixels per centimeter
    PPCM: 30,

    getVelocity: function(deltaTime, deltaPos) {
        return Math.abs(deltaPos / deltaTime) || 0;
    },

    getOrientedVelocity: function(deltaTime, deltaPos) {
        return (deltaPos / deltaTime) || 0;
    },

    getDirection: function(deltaX, deltaY) {
        if(Math.abs(deltaX) >= Math.abs(deltaY)) {
            return (deltaX > 0) ? this.DIRECTION.RIGHT : this.DIRECTION.LEFT;
        }
        else {
            return (deltaY > 0) ? this.DIRECTION.DOWN : this.DIRECTION.UP;
        }
    },

    isVertical: function(direction) {
        return direction === this.DIRECTION.UP || direction === this.DIRECTION.DOWN;
    },

    getAngle: function(x, y) {
        return Math.atan2(x, y);
    },

    getDistance: function(x, y) {
        return Math.sqrt((x * x) + (y * y));
    },

    setPPCM: function(diagonal) {
        // sqrt(w^2 + h^2) / diagonal / 1in
        this.PPCM = Math.round(Math.sqrt(screen.width*screen.width + screen.height*screen.height)/diagonal/2.54);
        console.log(screen.width + 'x' + screen.height + '@' + diagonal + 'in; PPCM= ' + this.PPCM);
    }
};

Fingers.Utils = Utils;

/**
 * @module fingers
 */

/**
 * create new fingers instance
 * all methods should return the instance itself, so it is chainable.
 *
 * @class Instance
 * @constructor
 * @param {HTMLElement} pElement
 * @return {Instance}
 */

var Instance = function(pElement) {
    this._init(pElement);
};

/**
 * @property FINGER_MAP
 * @type {Object.<Number>, Finger>}
 */
Instance.FINGER_MAP = {};

Instance.prototype = {
    /**
     * @property element
     * @type {HTMLElement}
     */
    element: null,

    /**
     * @property gestureList
     * @type {Array.<Gesture>}
     */
    gestureList: null,

    /*---- INIT ----*/
    _init: function(pElement) {
        this.element = pElement;
        this.gestureList = [];
        this.startListening();
    },

    getElement: function() {
        return this.element;
    },

    /*---- gestures ----*/
    getGestures: function() {
        return this.gestureList;
    },

    addGesture: function(PGestureClass, pOptions) {
        var gesture = new PGestureClass(pOptions);
        this.gestureList.push(gesture);

        return gesture;
    },

    removeGesture: function(pGesture) {
        pGesture.removeAllHandlers();
        var index = this.gestureList.indexOf(pGesture);
        this.gestureList.splice(index, 1);
    },

    removeAllGestures: function() {
        for(var i = 0, size=this.gestureList.length; i<size; i++) {
            this.gestureList[i].removeAllHandlers();
        }
        this.gestureList.length = 0;
    },

    /*---- Native event listening ----*/
    startListening: function() {
        if(this._stopListeningF === null) {
            var _this = this;
    
            var onTouchStartF = this._onTouchStart.bind(this);
            var onTouchMoveF = this._onTouchMove.bind(this);
            var onTouchEndF = this._onTouchEnd.bind(this);
            var onTouchCancelF = this._onTouchCancel.bind(this);

            this.element.addEventListener("touchstart", onTouchStartF);
            this.element.addEventListener("touchmove", onTouchMoveF);
            this.element.addEventListener("touchend", onTouchEndF);
            this.element.addEventListener("touchcancel", onTouchCancelF);

            this._stopListeningF = function() {
                _this.element.removeEventListener("touchstart", onTouchStartF);
                _this.element.removeEventListener("touchmove", onTouchMoveF);
                _this.element.removeEventListener("touchend", onTouchEndF);
                _this.element.removeEventListener("touchcancel", onTouchCancelF);
            };
        }
    },

    _stopListeningF: null,
    stopListening: function() {
        if(this._stopListeningF !== null) {
            this._stopListeningF();
            this._stopListeningF = null;
        }
    },

    /*-------- Touch events ----*/
    _onTouchStart: function(pTouchEvent) {
        for(var i=0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            var touch = pTouchEvent.changedTouches[i];
            var finger = null;
            var pFingerId = touch.identifier;

            if(Instance.FINGER_MAP[pFingerId] === undefined) {
                finger = new Finger(pFingerId, Date.now(), touch.pageX, touch.pageY, this.getElement().id);
                Instance.FINGER_MAP[pFingerId] = finger;
            }  else {
                finger = Instance.FINGER_MAP[pFingerId];
            }

            for(var j=0, size2=this.gestureList.length; j<size2; j++) {
                this.gestureList[j]._onFingerAdded(finger);
            }
        }
        pTouchEvent.preventDefault();
    },

    _onTouchMove: function(pTouchEvent) {
        var touch;
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            touch = pTouchEvent.changedTouches[i];
            var finger = Instance.FINGER_MAP[touch.identifier];
            if(finger !== undefined) {
                finger._setCurrentP(Date.now(), touch.pageX, touch.pageY, false);
            }
        }
        pTouchEvent.preventDefault();
    },

    _onTouchEnd: function(pTouchEvent) {
        var finger = Instance.FINGER_MAP[pTouchEvent.changedTouches[0].identifier];
        if(finger !== undefined) {
            finger._setEndP(Date.now());
            finger._clearHandlerObjects();
            delete Instance.FINGER_MAP[finger.id];
        }
        pTouchEvent.preventDefault();
    },

    _onTouchCancel: function(pTouchEvent) {
        for(var i=0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            var finger = Instance.FINGER_MAP[pTouchEvent.changedTouches[i].identifier];
            if(finger !== undefined && this.fingerList.indexOf(finger) !== -1) {
                finger._setEndP(Date.now());
                finger._clearHandlerObjects();
                delete Instance.FINGER_MAP[finger.id];
                break;
            }
        }
        pTouchEvent.preventDefault();
    }
};

Fingers.Instance = Instance;

/**
 * @module fingers
 *
 * @class Finger
 * @constructor
 * @param {Number} pId
 * @param {Number} pTimestamp
 * @param {Number} pX
 * @param {Number} pY
 * @param {String} target
 * @return {Finger}
 */
var Finger = function(pId, pTimestamp, pX, pY, target) {
    this.id = pId;
    this.state = Finger.STATE.ACTIVE;
    this.target = target;
    this._handlerList = [];

    this.startP = new Position(pTimestamp, pX, pY);
    this.previousP = new Position(pTimestamp, pX, pY);
    this.currentP = new Position(pTimestamp, pX, pY);
};


Finger.STATE = {
    ACTIVE: "active",
    REMOVED: "removed"
};

Finger.CONSTANTS = {
    inactivityTime: 100
};

Finger.prototype = {
    /**
     * @property id
     * @type {Number}
     */
    id: null,
    state: null,
    startP: null,
    previousP: null,
    currentP: null,
    _handlerList: null,

    _addHandlerObject: function(pHandlerObject) {
        this._handlerList.push(pHandlerObject);
    },

    _clearHandlerObjects: function() {
        this._handlerList.length = 0;
    },

    _removeHandlerObject: function(pHandlerObject) {
        var index = this._handlerList.indexOf(pHandlerObject);
        this._handlerList.splice(index, 1);
    },

    _setCurrentP: function(pTimestamp, pX, pY, pForceSetter) {
        if(this.getX() != pX || this.getY() != pY || pForceSetter) { //Prevent chrome multiple events for same position (radiusX, radiusY)

            this.previousP.copy(this.currentP);
            this.currentP.set(pTimestamp, pX, pY);

            for(var i= 0; i<this._handlerList.length; i++) {
                this._handlerList[i]._onFingerUpdate(this);
            }
        }
    },

    _setEndP: function(pTimestamp) {
        //Only update if end event is not "instant" with move event
        if((pTimestamp - this.getTime()) > Finger.CONSTANTS.inactivityTime) {
            this._setCurrentP(pTimestamp, this.getX(), this.getY(), true);
        }
        
        this.state = Finger.STATE.REMOVED;

        var handlerList = this._handlerList.slice(0);
        for(var i=0; i<handlerList.length; i++) {
            handlerList[i]._onFingerRemoved(this);
        }
    },

    /*---- time ----*/
    getTime: function() {
        return this.currentP.timestamp;
    },

    getDeltaTime: function() {
        return this.currentP.timestamp - this.previousP.timestamp;
    },

    getTotalTime: function() {
        return this.currentP.timestamp - this.startP.timestamp;
    },

    getInactivityTime: function() {
        return Date.now() - this.currentP.timestamp;
    },

    /*---- position ----*/
    getX: function() {
        return this.currentP.x;
    },

    getY: function() {
        return this.currentP.y;
    },

    getTarget: function() {
        return this.target;
    },

    /*---- distance ----*/
    getDeltaX: function() {
        return this.currentP.x - this.previousP.x;
    },

    getDeltaY: function() {
        return this.currentP.y - this.previousP.y;
    },

    getDeltaDistance: function() {
        return Utils.getDistance(this.getDeltaX(), this.getDeltaY());
    },

    getTotalX: function() {
        return this.currentP.x - this.startP.x;
    },

    getTotalY: function() {
        return this.currentP.y - this.startP.y;
    },

    getDistance: function() {
        return Utils.getDistance(this.getTotalX(), this.getTotalY());
    },

    /*---- direction ----*/
    getDeltaDirection: function() {
        return Utils.getDirection(this.getDeltaX(), this.getDeltaY());
    },

    getDirection: function() {
        return Utils.getDirection(this.getTotalX(), this.getTotalY());
    },

    /*---- velocity ----*/
    getVelocityX: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaX());
    },

    getVelocityY: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaY());
    },

    getVelocity: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaDistance());
    },

    getVelocityAverage: function() {
        return Utils.getVelocity(this.getTotalTime(), this.getDistance());
    },

    getOrientedVelocityX: function() {
        return Utils.getOrientedVelocity(this.getDeltaTime(), this.getDeltaX());
    },

    getOrientedVelocityY: function() {
        return Utils.getOrientedVelocity(this.getDeltaTime(), this.getDeltaY());
    }
};

Fingers.Finger = Finger;

var Position = function(pTimestamp, pX, pY) {
    this.set(pTimestamp, pX, pY);
};

Position.prototype = {
    /**
     * @property timestamp
     * @type {Number}
     */
    timestamp: null,

    /**
     * @property x
     * @type {Number}
     */
    x: null,

    /**
     * @property y
     * @type {Number}
     */
    y: null,

    set: function(pTimestamp, pX, pY) {
        this.timestamp = pTimestamp;
        this.x = pX;
        this.y = pY;
    },

    copy: function(pPosition) {
        this.timestamp = pPosition.timestamp;
        this.x = pPosition.x;
        this.y = pPosition.y;
    }
};

Fingers.Position = Position;

/**
 * @module fingers
 *
 * @class FingerUtils
 */

var FingerUtils = {

    getFingersAngle: function(pFinger1, pFinger2) {
        return Utils.getAngle(pFinger2.currentP.x - pFinger1.currentP.x, pFinger2.currentP.y - pFinger1.currentP.y);
    },

    getFingersDistance: function(pFinger1, pFinger2) {
        return Utils.getDistance(pFinger2.currentP.x - pFinger1.currentP.x, pFinger2.currentP.y - pFinger1.currentP.y);
    },

    getFingersCenter: function(pFinger1, pFinger2) {
        return {
            x: ~~((pFinger1.currentP.x + pFinger2.currentP.x) / 2),
            y: ~~((pFinger1.currentP.y + pFinger2.currentP.y) / 2)
        };
    },

    getMultipleFingersCenter: function(pFinger1, pFinger2, pFinger3, pFinger4, pFinger5) {
        var center = {
            x: 0,
            y: 0
        };
        var size = arguments.length;
        for(var i= 0; i<size; i++) {
            center.x += arguments[i].currentP.x;
            center.y += arguments[i].currentP.y;
        }
        center.x = ~~(center.x / size);
        center.y = ~~(center.y / size);

        return center;
    }
};

Fingers.FingerUtils = FingerUtils;


/**
 * @module fingers
 *
 * @class Gesture
 * @constructor
 * @param {Object} pOptions
 * @param {Object} pDefaultOptions
 * @return {Gesture}
 */

var Gesture = function(pOptions, pDefaultOptions) {
    this.options = Fingers.__extend({}, pDefaultOptions || {}, pOptions || {});
    this._handlerList = [];
    this.listenedFingers = [];
};

Gesture.EVENT_TYPE = {
    instant: "instant",
    start: "start",
    end: "end",
    move: "move"
};

Gesture.prototype = {

    options: null,
    _handlerList: null,

    isListening: false,
    listenedFingers: null,

    /*---- Handlers ----*/
    addHandler: function(pHandler) {
        this._handlerList.push(pHandler);
        return this;
    },

    removeHandler: function(pHandler) {
        this._removeHandlerObject(pHandler);
        return this;
    },

    removeAllHandlers: function() {
        this._handlerList.length = 0;
        return this;
    },

    getHandlers: function() {
        return this._handlerList;
    },

    getHandler: function(pHandler) {
        var index = this._handlerList.indexOf(pHandler);
        return this._handlerList[index];
    },

    fire: function(pType, pData) {
        for(var i=0, size = this._handlerList.length; i<size; i++) {
            this._handlerList[i](pType, pData, this.listenedFingers);
        }
    },

    /*---- Fingers events ----*/
    _onFingerAdded: function(pNewFinger) { /*To Override*/ },

    _onFingerUpdate: function(pFinger) { /*To Override*/ },

    _onFingerRemoved: function(pFinger) { /*To Override*/ },

    /*---- Actions ----*/

    _addListenedFinger: function(pFinger) {
            this.listenedFingers.push(pFinger);
            pFinger._addHandlerObject(this);

            if(!this.isListening) {
                this.isListening = true;
            }
    },

    _removeListenedFinger: function(pFinger) {

        // console.log('OFA: before ' + pNewFinger.id + ", " + pNewFinger.state, pNewFinger._handlerList);
        pFinger._removeHandlerObject(this);
        // console.log('OFA after ' + pNewFinger.id + ", " + pNewFinger.state, pNewFinger._handlerList);
        this.listenedFingers.length = 0;
        this.isListening = false;

    },

    _removeAllListenedFingers: function() {
        var finger;
        for(var i= 0, size=this.listenedFingers.length; i<size; i++) {
            finger = this.listenedFingers[i];
            // console.log('before ' + finger.id + ", " + finger.state, finger._handlerList);
            this.listenedFingers[i]._removeHandlerObject(this);
            // console.log('after ' + finger.id + ", " + finger.state, finger._handlerList);
        }
        this.listenedFingers.length = 0;
        this.isListening = false;
    },
};

Fingers.Gesture = Gesture;
Fingers.gesture = {};


Fingers.gesture = {
};

/**
 * @module gestures
 *
 * @class Drag
 * @constructor
 * @param {Object} pOptions
 * @return {Drag}
 */
var Drag = (function (_super) {

    var DEFAULT_OPTIONS = {
        distanceThreshold: 0.3,      // in cm
    };

    function Drag(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }

    Fingers.__extend(Drag.prototype, _super.prototype, {

      _onFingerAdded: function(pNewFinger) {

            if(!this.isListening) {
                if(this.listenedFingers.length === 0) {
                    this._addListenedFinger(pNewFinger);
                    this.fire(_super.EVENT_TYPE.start, null);
                } else {
                    this._removeListenedFinger(this.listenedFingers[0]);
                }
            } else {
                if(this.listenedFingers.length > 0) {
                    this._removeListenedFinger(this.listenedFingers[0]);
                }
            }
        },

        _onFingerUpdate: function(pFinger) {
            var threshold = this.options.distanceThreshold*Utils.PPCM;
            if(pFinger.getDeltaDistance() > threshold) {
                this.fire(_super.EVENT_TYPE.move, null);
            }
        },

        _onFingerRemoved: function(pFinger) {
            this.fire(_super.EVENT_TYPE.end, null);
            this._removeListenedFinger(pFinger);
        }
    });

    return Drag;
})(Fingers.Gesture);

Fingers.gesture.Drag = Drag;   

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

/**
 * @module gestures
 *
 * @class Pinch
 * @constructor
 * @param {Object} pOptions
 * @return {Pinch}
 */
var Pinch = (function (_super) {

    var DEFAULT_OPTIONS = {
        pinchInDetect: 0.6,
        pinchOutDetect: 1.4
    };

    function Pinch(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            grow: null,
            scale: 1,
            target: null
        };
    }

    Fingers.__extend(Pinch.prototype, _super.prototype, {

        _startDistance: 0,
        data: null,

        _onFingerAdded: function(pNewFinger) {

            if(!this.isListening) {
                if(this.listenedFingers.length < 3) {
                    this._addListenedFinger(pNewFinger);
                    this.isListening = false;
                } else {
                    if(this.listenedFingers[0].state === 'active' &&
                       this.listenedFingers[1].state === 'active' &&
                       this.listenedFingers[2].state === 'active') {
                        this._addListenedFinger(pNewFinger);
                        this._startDistance = this._getFingersDistance();
                        this.data.target = pNewFinger.getTarget();
                        this.fire(_super.EVENT_TYPE.start, this.data);
                    } else {
                        this._removeAllListenedFingers();
                    }
                }
            } else {
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {},

        _onFingerRemoved: function(pFinger) {

            switch (this.listenedFingers.length) {
                case 1:
                case 2:
                case 3:
                    pFinger._removeHandlerObject(this);
                    this.listenedFingers.length = 0;
                    this.isListening = false;
                    break;
                case 4:

                    var newDistance = this._getFingersDistance();
                    var scale = newDistance / this._startDistance;

                    if(scale <= this.options.pinchInDetect || scale >= this.options.pinchOutDetect) {
                        this.data.grow = (scale > 1) ? Utils.GROW.OUT : Utils.GROW.IN;
                        this.data.scale = scale;
                        this.fire(_super.EVENT_TYPE.instant, this.data);
                    }
                    break;
                default: 
                    this._removeAllListenedFingers();
            } 
        },

        _getFingersDistance: function() {
            var finger1P = this.listenedFingers[0].currentP;
            var finger2P = this.listenedFingers[1].currentP;
            return Fingers.Utils.getDistance(finger2P.x - finger1P.x, finger2P.y - finger1P.y);
        }
    });

    return Pinch;
})(Fingers.Gesture);

Fingers.gesture.Pinch = Pinch;

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
        angleThreshold: 0.1    // in rad
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
        

            if(!this.isListening) {

                if(this.listenedFingers.length === 0) {
                        this._addListenedFinger(pNewFinger);
                        this.isListening = false;
                        this.options.scale = true;
                        this.options.rotate = true;
                } else {
                    if(this.listenedFingers[0].state === 'active') {

                        this._addListenedFinger(pNewFinger);
                      
                        this._lastAngle = this._getFingersAngle();
                        this._startAngle = this._lastAngle;

                        this._lastDistance = this._getFingersDistance();
                        this._startDistance = this._lastDistance;
                        this.data.target = pNewFinger.getTarget(); 
                            
                        this.fire(_super.EVENT_TYPE.start, this.data);
                    } else {
                        this._removeAllListenedFingers();
                    }
                }
            } else {
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {
            
            if(this.listenedFingers.length === 2) {
            
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
              
                // Instead of Math.abs(this.data.totalRotation), it should be faster
                var totrot = (this.data.totalRotation ^ (this.data.totalRotation >> 31)) - (this.data.totalRotation >> 31);
                var totdist = (this.data.totalDistance ^ (this.data.totalDistance >> 31)) - (this.data.totalDistance >> 31);

                if (this.data.rotate && totrot > this.options.angleThreshold) {
                    this.data.scale = false;     
                }
                if (this.data.scale && totdist > threshold) {
                    this.data.rotate = false;
                }
                if (!(this.data.rotate && this.data.scale)) {
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

/**
 * @module fingers
 */

// AMD export
if(typeof define == 'function' && define.amd) {
    define(function() {
        return Fingers;
    });
// commonjs export
} else if(typeof module !== 'undefined' && module.exports) {
    module.exports = Fingers;
// browser export
} else {
    window.Fingers = Fingers;
}

})(window);