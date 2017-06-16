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