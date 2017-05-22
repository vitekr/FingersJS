/*! FingersJS - v1.0.0 - 2017-05-22
 * https://github.com/vitekr/fingers.js
 *
 * Copyright (c) 2017 Vít Rusňák <vit.rusnak@gmail.com>;
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
 *
 * @class CacheArray
 * @constructor
 * @return {CacheArray}
 */

var CacheArray = function() {
    this._cache = [];
};

CacheArray.prototype = {
    _cache: null,

    isCachedValue: function(pIndex) {
        return (this._cache[pIndex] !== undefined);
    },

    getCachedValue: function(pIndex) {
        return this._cache[pIndex];
    },

    setCachedValue: function(pIndex, pValue) {
        this._cache[pIndex] = pValue;
    },

    clearCachedValue: function(pIndex) {
        delete this._cache[pIndex];
    },

    clearCache: function() {
        this._cache = [];
    },

    getCachedValueOrUpdate: function(pIndex, pUpdateF, pUpdateContext) {
        var cacheValue = this.getCachedValue(pIndex);
        if(cacheValue === undefined) {
            cacheValue = pUpdateF.call(pUpdateContext);
            this.setCachedValue(pIndex, cacheValue);
        }
        return cacheValue;
    }
};

Fingers.CacheArray = CacheArray;

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
     * @property fingerList
     * @type {Array.<Finger>}
     */
    fingerList: null,

    /**
     * @property fingerCreatedMap
     * @type {Object.<Number>, Finger>}
     */
    fingerCreatedMap: null,

    /**
     * @property gestureList
     * @type {Array.<Gesture>}
     */
    gestureList: null,

    /*---- INIT ----*/
    _init: function(pElement) {
        this.element = pElement;
        this.fingerList = [];
        this.fingerCreatedMap = {};
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
        this.gestureList = [];
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
            this._removeAllFingers(Date.now());
            this._stopListeningF();
            this._stopListeningF = null;
        }
    },

    /*-------- Touch events ----*/
    _onTouchStart: function(pTouchEvent) {
        var touch;
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            touch = pTouchEvent.changedTouches[i];
            this._createFinger(touch.identifier, pTouchEvent.timeStamp, touch.pageX, touch.pageY, this.getElement().id);
        }
        pTouchEvent.preventDefault();
    },

    _onTouchMove: function(pTouchEvent) {
        var touch;
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            touch = pTouchEvent.changedTouches[i];
            this._updateFingerPosition(touch.identifier, pTouchEvent.timeStamp, touch.pageX, touch.pageY);
        }

        pTouchEvent.preventDefault();
    },

    
    _onTouchEnd: function(pTouchEvent) {
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            this._removeFinger(pTouchEvent.changedTouches[i].identifier, pTouchEvent.timeStamp);
            // console.log(pTouchEvent.changedTouches[i].identifier)
        }
        //FIXME: BEWARE OF OGRES AND THIS NASTY HACK that :/
        // this is dirty nasty hack for cleaning the orphaned Finger objects
        // TODO: try to fix me
        if (this.fingerList.length && Date.now()-this.fingerList[0].currentP.timestamp > Finger.CONSTANTS.inactivityTime) {
            this._removeAllFingers();
        }
    },

    _onTouchCancel: function(pTouchEvent) {
        //Security to prevent chrome bugs
        var finger;
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            finger = Instance.FINGER_MAP[pTouchEvent.changedTouches[i].identifier];
            if(finger !== undefined && this._getFingerPosition(finger) !== -1) {
                //Remove all fingers
                this._removeAllFingers(pTouchEvent.timeStamp);
                break;
            }
        }
    },

    /*---- Fingers ----*/
    _createFinger: function(pFingerId, pTimestamp, pX, pY, target) {
        var finger;
        if(Instance.FINGER_MAP[pFingerId] === undefined) {
            finger = new Finger(pFingerId, pTimestamp, pX, pY, target);
            Instance.FINGER_MAP[pFingerId] = finger;
            this.fingerCreatedMap[pFingerId] = finger;
        }
        else {
            finger = Instance.FINGER_MAP[pFingerId];
        }

        this.fingerList.push(finger);
        finger.nbListeningInstances++;

        for(var i=0, size=this.gestureList.length; i<size; i++) {
            this.gestureList[i]._onFingerAdded(finger, this.fingerList);
        }
    },

    _removeFinger: function(pFingerId, pTimestamp) {
        var finger = Instance.FINGER_MAP[pFingerId];
        // console.log('remove finger', pFingerId)
        if(finger !== undefined) {
            this.fingerList.splice(this._getFingerPosition(finger), 1);
            delete this.fingerCreatedMap[finger.id];
            finger.nbListeningInstances--;

            //Only last one can remove a finger
            if(finger.nbListeningInstances === 0) {
                // FIXME: console.log('removing finger', finger.id)
                finger._setEndP(pTimestamp);
                delete Instance.FINGER_MAP[finger.id];

                finger._clearHandlerObjects();
            }
        }
    },

    _removeAllFingers: function(pTimestamp) {
        var list = this.fingerList.splice(0);
        for(var i= 0, size=list.length; i<size; i++) {
            this._removeFinger(list[i].id, pTimestamp);
        }
    },

    _updateFingerPosition: function(pFingerId, pTimestamp, pX, pY) {
        //Only creator can update a finger
        var finger = this.fingerCreatedMap[pFingerId];
        if(finger !== undefined) {
            finger._setCurrentP(pTimestamp, pX, pY, false);
        }
    },

    /*---- utils ----*/
    _getFingerPosition: function(pFinger) {
        var index = this.fingerList.indexOf(pFinger);
        // console.log(index, pFinger.id)
        return index;
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

    this._cacheArray = new CacheArray();
};

var CACHE_INDEX_CREATOR = 0;
Finger.cacheIndexes = {
    deltaTime: CACHE_INDEX_CREATOR++,
    totalTime: CACHE_INDEX_CREATOR++,

    deltaX: CACHE_INDEX_CREATOR++,
    deltaY: CACHE_INDEX_CREATOR++,
    deltaDistance: CACHE_INDEX_CREATOR++,
    totalX: CACHE_INDEX_CREATOR++,
    totalY: CACHE_INDEX_CREATOR++,
    totalDistance: CACHE_INDEX_CREATOR++,

    deltaDirection: CACHE_INDEX_CREATOR++,
    totalDirection: CACHE_INDEX_CREATOR++,

    velocityX: CACHE_INDEX_CREATOR++,
    velocityY: CACHE_INDEX_CREATOR++,
    velocity: CACHE_INDEX_CREATOR++,
    velocityAverage: CACHE_INDEX_CREATOR++,
    orientedVelocityX: CACHE_INDEX_CREATOR++,
    orientedVelocityY: CACHE_INDEX_CREATOR++
};

Finger.STATE = {
    ACTIVE: "active",
    REMOVED: "removed"
};

Finger.CONSTANTS = {
    inactivityTime: 200
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
    nbListeningInstances: 0,
    _cacheArray: null,
    _handlerList: null,

    _addHandlerObject: function(pHandlerObject) {
        this._handlerList.push(pHandlerObject);
    },

    _removeHandlerObject: function(pHandlerObject) {
        var index = this._handlerList.indexOf(pHandlerObject);
        this._handlerList.splice(index, 1);
        console.log('removed handler: ', pHandlerObject);
    },

    _clearHandlerObjects: function() {
        this._handlerList = [];
    },

    _setCurrentP: function(pTimestamp, pX, pY, pForceSetter) {
        if(this.getX() != pX || this.getY() != pY || pForceSetter) { //Prevent chrome multiple events for same position (radiusX, radiusY)
            this._cacheArray.clearCache();

            this.previousP.copy(this.currentP);
            this.currentP.set(pTimestamp, pX, pY);

            for(var i= 0; i<this._handlerList.length; i++) {
                this._handlerList[i]._onFingerUpdate(this);
            }
        }
    },

    _setEndP: function(pTimestamp) {
        this.state = Finger.STATE.REMOVED;
        //Only update if end event is not "instant" with move event
        if((pTimestamp - this.getTime()) > Finger.CONSTANTS.inactivityTime) {
            this._setCurrentP(pTimestamp, this.getX(), this.getY(), false);
        }
        var handlerList = this._handlerList.slice();
        for(var i= 0; i<handlerList.length; i++) {
            handlerList[i]._onFingerRemoved(this);
        }
    },

    /*---- time ----*/
    getTime: function() {
        return this.currentP.timestamp;
    },

    getDeltaTime: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.deltaTime, this._getDeltaTime, this);
    },
    _getDeltaTime: function() {
        return this.currentP.timestamp - this.previousP.timestamp;
    },

    getTotalTime: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.totalTime, this._getTotalTime, this);
    },
    _getTotalTime: function() {
        return this.currentP.timestamp - this.startP.timestamp;
    },

    getInactivityTime: function() {
        var delta = Date.now() - this.currentP.timestamp;
        return (delta > Finger.CONSTANTS.inactivityTime) ? delta : 0;
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
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.deltaX, this._getDeltaX, this);
    },
    _getDeltaX: function() {
        return this.currentP.x - this.previousP.x;
    },

    getDeltaY: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.deltaY, this._getDeltaY, this);
    },
    _getDeltaY: function() {
        return this.currentP.y - this.previousP.y;
    },

    getDeltaDistance: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.deltaDistance, this._getDeltaDistance, this);
    },
    _getDeltaDistance: function() {
        return Utils.getDistance(this.getDeltaX(), this.getDeltaY());
    },

    getTotalX: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.totalX, this._getTotalX, this);
    },
    _getTotalX: function() {
        return this.currentP.x - this.startP.x;
    },

    getTotalY: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.totalY, this._getTotalY, this);
    },
    _getTotalY: function() {
        return this.currentP.y - this.startP.y;
    },

    getDistance: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.totalDistance, this._getDistance, this);
    },
    _getDistance: function() {
        return Utils.getDistance(this.getTotalX(), this.getTotalY());
    },

    /*---- direction ----*/
    getDeltaDirection: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.deltaDirection, this._getDeltaDirection, this);
    },
    _getDeltaDirection: function() {
        return Utils.getDirection(this.getDeltaX(), this.getDeltaY());
    },

    getDirection: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.totalDirection, this._getDirection, this);
    },
    _getDirection: function() {
        return Utils.getDirection(this.getTotalX(), this.getTotalY());
    },

    /*---- velocity ----*/
    getVelocityX: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.velocityX, this._getVelocityX, this);
    },
    _getVelocityX: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaX());
    },

    getVelocityY: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.velocityY, this._getVelocityY, this);
    },
    _getVelocityY: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaY());
    },

    getVelocity: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.velocity, this._getVelocity, this);
    },
    _getVelocity: function() {
        return Utils.getVelocity(this.getDeltaTime(), this.getDeltaDistance());
    },

    getVelocityAverage: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.velocityAverage, this._getVelocity, this);
    },
    _getVelocityAverage: function() {
        return Utils.getVelocity(this.getTotalTime(), this.getDistance());
    },

    getOrientedVelocityX: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.orientedVelocityX, this._getOrientedVelocityX, this);
    },
    _getOrientedVelocityX: function() {
        return Utils.getOrientedVelocity(this.getDeltaTime(), this.getDeltaX());
    },

    getOrientedVelocityY: function() {
        return this._cacheArray.getCachedValueOrUpdate(Finger.cacheIndexes.orientedVelocityY, this._getOrientedVelocityY, this);
    },
    _getOrientedVelocityY: function() {
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
            x: Math.round((pFinger1.currentP.x + pFinger2.currentP.x) / 2),
            y: Math.round((pFinger1.currentP.y + pFinger2.currentP.y) / 2)
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
        center.x = Math.round(center.x / size);
        center.y = Math.round(center.y / size);

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
        var index = this._handlerList.indexOf(pHandler);
        this._handlerList.splice(index, 1);
        return this;
    },

    removeAllHandlers: function() {
        this._handlerList = [];
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
    _onFingerAdded: function(pNewFinger, pFingerList) { /*To Override*/ },

    _onFingerUpdate: function(pFinger) { /*To Override*/ },

    _onFingerRemoved: function(pFinger) { /*To Override*/ },

    /*---- Actions ----*/
    _addListenedFingers: function(pFinger1, pFinger2, pFinger3) {
        for(var i= 0, size=arguments.length; i<size; i++) {
            this._addListenedFinger(arguments[i]);
        }
    },
    _addListenedFinger: function(pFinger) {
        this.listenedFingers.push(pFinger);
        pFinger._addHandlerObject(this);

        if(!this.isListening) {
            this.isListening = true;
        }
    },

    _removeListenedFingers: function(pFinger1, pFinger2, pFinger3) {
        for(var i= 0, size=arguments.length; i<size; i++) {
            this._removeListenedFinger(arguments[i]);
        }
    },
    _removeListenedFinger: function(pFinger) {
        pFinger._removeHandlerObject(this);

        var index = this.listenedFingers.indexOf(pFinger);
        this.listenedFingers.splice(index, 1);

        if(this.listenedFingers.length === 0) {
            this.isListening = false;
        }
    },

    _removeAllListenedFingers: function() {
        var finger;
        for(var i= 0, size=this.listenedFingers.length; i<size; i++) {
            finger = this.listenedFingers[i];
            // FIXME HERE FIRST: 
            // console.log('removing finger', finger.id, finger.state, finger._handlerList)
            console.log('before' + finger.id + ", " + finger.state, finger._handlerList);
            finger._removeHandlerObject(this);
            // if(finger._handlerList.length === 0) {
            //     this._removeAllListenedFingers();
            // }
            // FIXME: 
            console.log('after' + finger.id + ", " + finger.state, finger._handlerList);
        }

        this.listenedFingers = [];
        this.isListening = false;
    },

    /*---- Utils ----*/
    isListenedFinger: function(pFinger) {
        return (this.isListening && this.getListenedPosition(pFinger) > -1);
    },

    getListenedPosition: function(pFinger) {
        return this.listenedFingers.indexOf(pFinger);
    }
};

Fingers.Gesture = Gesture;



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
        nbFingers: 1,
        distanceThreshold: 0.2, // in cm
        preventCombinedGestures: true
    };

    function Drag(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }


    Fingers.__extend(Drag.prototype, _super.prototype, {

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length == this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    // console.log('Finger ' + pNewFinger.id + '[+ Drag]')
                    this._addListenedFinger(pFingerList[i]);
                    this.fire(_super.EVENT_TYPE.start, null);
                }
            }

            // this protects from combined gesture recognition when overreached the number of 
            // fingers, i.e., drag+zoom is not possible
            if(this.options.preventCombinedGestures && pFingerList.length > this.options.nbFingers) {
                // console.log('Finger ' + pNewFinger.id + '[- Drag]')
                this._removeAllListenedFingers();
            }
        },

        _onFingerUpdate: function(pFinger) {
            if(pFinger.getDeltaDistance() > this.options.distanceThreshold*Utils.PPCM) {
                this.fire(_super.EVENT_TYPE.move, null);
            }
        },

        _onFingerRemoved: function(pFinger) {
            // console.log('Finger ' + pFinger.id + '[- Drag]')
            this.fire(_super.EVENT_TYPE.end, null);
            this._removeAllListenedFingers();
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

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length >= 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);

                this._startDistance = this._getFingersDistance();
                this.data.target = pFinger.getTarget();
            }
        },

        _onFingerUpdate: function(pFinger) {},

        _onFingerRemoved: function(pFinger) {
            var newDistance = this._getFingersDistance();
            var scale = newDistance / this._startDistance;

            if(scale <= this.options.pinchInDetect || scale >= this.options.pinchOutDetect) {
                this.data.grow = (scale > 1) ? Utils.GROW.OUT : Utils.GROW.IN;
                this.data.scale = scale;
                this.fire(_super.EVENT_TYPE.instant, this.data);
            }

            this._removeAllListenedFingers();
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
 * @class Raw
 * @constructor
 * @param {Object} pOptions
 * @return {Raw}
 */


var Raw = (function (_super) {

    var DEFAULT_OPTIONS = {
        nbMaxFingers: 50
    };

    function Raw(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
    }


    Fingers.__extend(Raw.prototype, _super.prototype, {

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(this.listenedFingers.length < this.options.nbMaxFingers) {
                this._addListenedFinger(pNewFinger);

                this.fire(_super.EVENT_TYPE.start, pNewFinger);
            }
        },

        _onFingerUpdate: function(pFinger) {
            this.fire(_super.EVENT_TYPE.move, pFinger);
        },

        _onFingerRemoved: function(pFinger) {
            this.fire(_super.EVENT_TYPE.end, pFinger);

            this._removeListenedFinger(pFinger);
        }
    });

    return Raw;
})(Fingers.Gesture);

Fingers.gesture.Raw = Raw;

/**
 * @module gestures
 *
 * @class Swipe
 * @constructor
 * @param {Object} pOptions
 * @return {Swipe}
 */



var Swipe = (function (_super) {

    var DEFAULT_OPTIONS = {
        nbFingers: 1,
        swipeVelocityX: 0.6,
        swipeVelocityY: 0.6
    };

    function Swipe(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            direction: null,
            velocity: 0,
            target: null
        };
    }

    Fingers.__extend(Swipe.prototype, _super.prototype, {

        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length >= this.options.nbFingers) {
                for(var i=0; i<this.options.nbFingers; i++) {
                    this._addListenedFinger(pFingerList[i]);
                    this.data.target = pFinger.getTarget();
                }
            }
        },

        _onFingerUpdate: function(pFinger) {
        },

        _onFingerRemoved: function(pFinger) {
            var isSameDirection = true;
            var direction = this.listenedFingers[0].getDeltaDirection();
            var maxVelocityX = 0;
            var maxVelocityY = 0;

            var size = this.listenedFingers.length;
            for(var i= 0; i<size; i++) {
                isSameDirection = isSameDirection && (direction === this.listenedFingers[i].getDeltaDirection());

                maxVelocityX = Math.max(maxVelocityX, this.listenedFingers[i].getVelocityX());
                maxVelocityY = Math.max(maxVelocityY, this.listenedFingers[i].getVelocityY());
            }

            if(isSameDirection &&
                (maxVelocityX > this.options.swipeVelocityX || maxVelocityY > this.options.swipeVelocityY)) {
                this.data.direction = direction;
                this.data.velocity = (maxVelocityX > this.options.swipeVelocityX) ? maxVelocityX : maxVelocityY;

                this.fire(_super.EVENT_TYPE.instant, this.data);
            }

            this._removeAllListenedFingers();
        }
    });

    return Swipe;
})(Fingers.Gesture);

Fingers.gesture.Swipe = Swipe;


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
        maxDistanceMoving: 10
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
                pFinger.getDistance() < this.options.maxDistanceMoving) {
                this.data.lastTapTimestamp = pFinger.getTime();
                this.data.tapPosition = [pFinger.getX(), pFinger.getY()];
                this.data.target = pFinger.getTarget();
                this.data.nbTap++;

                if(this.data.nbTap >= this.options.nbTapMin && this.data.nbTap <= this.options.nbTapMax) {
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
    // TODO: add thresholds
    var DEFAULT_OPTIONS = {
        distanceThreshold: 2.5,
        angleThreshold: 4
    };

    function Transform(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);

        this.data = {
            totalRotation: 0,
            deltaRotation: 0,
            totalDistance: 0,
            deltaDistance: 0,
            target: null
        };
    }

    Fingers.__extend(Transform.prototype, _super.prototype, {

        _startAngle: 0,
        _lastAngle: 0,
        _startDistance: 0,
        _lastDistance: 0,
        data: null,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(!this.isListening && pFingerList.length == 2) {
                this._addListenedFingers(pFingerList[0], pFingerList[1]);


                this._lastAngle = this._getFingersAngle();
                this._startAngle = this._lastAngle;
                // this.data.totalRotation = 0;
                // this.data.deltaRotation = 0;

                this._lastDistance = this._getFingersDistance();
                this._startDistance = this._lastDistance;
                // this.data.totalDistance = 0;
                // this.data.deltaDistance = 0;


                //target element is under the first finger
                this.data.target = pFingerList[0].getTarget();   

                this.fire(_super.EVENT_TYPE.start, this.data);
            }
        },

        _onFingerUpdate: function(pFinger) {
         
            var newAngle = this._getFingersAngle();
            this.data.totalRotation = this._startAngle - newAngle;
            this.data.deltaRotation = this._lastAngle - newAngle;
            this._lastAngle = newAngle;

            var newDistance = this._getFingersDistance();
            this.data.totalDistance = this._startDistance - newDistance;
            this.data.deltaDistance = this._lastDistance - newDistance;
            this._lastDistance = newDistance;
            

            if(Math.abs(this.data.totalDistance) > this.options.distanceThreshold*Utils.PPCM) {
                this.data.totalRotation = 0;
                this.data.deltaRotation = 0;
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }


           if(Math.abs(this.data.totalRotation) > this.options.angleThreshold) {
                this.data.totalDistance = 0;
                this.data.deltaScale = 0;
                this.fire(_super.EVENT_TYPE.move, this.data);  
            }

        },

        _onFingerRemoved: function(pFinger) {
            this._removeAllListenedFingers();
            this.fire(_super.EVENT_TYPE.end, this.data);
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
 * @module gestures
 *
 * @class ZoneHover
 * @constructor
 * @param {Object} pOptions
 * @return {ZoneHover}
 */


var ZoneHover = (function (_super) {

    var DEFAULT_OPTIONS = {
    };

    function ZoneHover(pOptions) {
        _super.call(this, pOptions, DEFAULT_OPTIONS);
        this._zoneList = [];
        this._zoneMap = {};
    }

    ZoneHover.TYPE = {
        enter: "enter",
        leave: "leave"
    };
    ZoneHover.LAST_ZONE_ID = 0;

    Fingers.__extend(ZoneHover.prototype, _super.prototype, {

        _zoneList: null,
        _zoneMap: null,
        _zoneSize: 0,

        _onFingerAdded: function(pNewFinger, pFingerList) {
            if(this.listenedFingers.length === 0) {
                this._addListenedFinger(pNewFinger);

                for(var i=0; i<this._zoneSize; i++) {
                    this._checkZone(this._zoneList[i], pNewFinger);
                }
            }
        },

        _onFingerUpdate: function(pFinger) {
            for(var i=0; i<this._zoneSize; i++) {
                this._checkZone(this._zoneList[i], pFinger);
            }
        },

        _onFingerRemoved: function(pFinger) {
            var zone;
            for(var i=0; i<this._zoneSize; i++) {
                zone = this._zoneList[i];
                if(this._zoneMap[zone.id] === true) {
                    this._fireLeaveZone(zone);
                }
            }

            this._removeListenedFinger(pFinger);
        },

        /**
         * @typedef Zone
         * @type {Object}
         * @property {number} id
         * @property {number} left
         * @property {number} right
         * @property {number} top
         * @property {number} bottom
         */

        /**
         * @param {Zone} pZone
         */
        addZone: function(pZone) {
            if(this._zoneList.indexOf(pZone) === -1) {
                if(pZone.id === undefined) {
                    pZone.id = ZoneHover.LAST_ZONE_ID++;
                }

                this._zoneList.push(pZone);
                this._zoneMap[pZone.id] = false;
                this._zoneSize++;
            }

            return this;
        },

        /**
         * @param {Zone} pZone
         */
        removeZone: function(pZone) {
            var index = this._zoneList.indexOf(pZone);
            if(index !== -1) {
                this._zoneList.splice(index, 1);
                delete this._zoneMap[pZone.id];
                this._zoneSize--;
            }

            return this;
        },

        getHoveredZones: function() {
            var enteredZones = [];
            var zone;
            for(var i=0; i<this._zoneSize; i++) {
                zone = this._zoneList[i];
                if(this._zoneMap[zone.id] === true) {
                    enteredZones.push(zone);
                }
            }

            return enteredZones;
        },

        _checkZone: function(pZone, pFinger) {
            var isInZone = this._isInZone(pZone, pFinger.getX(), pFinger.getY());
            if(this._zoneMap[pZone.id] === false && isInZone) {
                this._zoneMap[pZone.id] = true;
                this._fireEnterZone(pZone);
            }
            else if(this._zoneMap[pZone.id] === true && !isInZone) {
                this._zoneMap[pZone.id] = false;
                this._fireLeaveZone(pZone);
            }
        },

        _fireEnterZone: function(pZone) {
            this.fire(_super.EVENT_TYPE.instant, {
                type: ZoneHover.TYPE.enter,
                zone: pZone
            });
        },

        _fireLeaveZone: function(pZone) {
            this.fire(_super.EVENT_TYPE.instant, {
                type: ZoneHover.TYPE.leave,
                zone: pZone
            });
        },

        _isInZone: function(pZone, pX, pY) {
            return (pX >= pZone.left &&
                pX <= pZone.right &&
                pY >= pZone.top &&
                pY <= pZone.bottom);
        }
    });

    return ZoneHover;
})(Fingers.Gesture);

Fingers.gesture.ZoneHover = ZoneHover;

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