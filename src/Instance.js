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
            // console.log('here I should remove the finger: ' + pTouchEvent.changedTouches[i].identifier);
            // this._removeFinger(pTouchEvent.changedTouches[i].identifier, pTouchEvent.timeStamp);
            this._removeFinger(pTouchEvent.changedTouches[i].identifier);
        }
        //FIXME: BEWARE OF OGRES AND THIS NASTY HACK that :/
        // this is dirty nasty hack for cleaning the orphaned Finger objects
        // TODO: try to fix me
        // if (this.fingerList.length && Date.now()-this.fingerList[0].previousP.timestamp > Finger.CONSTANTS.inactivityTime) {
        //     this._removeAllFingers();
        // }
    },

    _onTouchCancel: function(pTouchEvent) {
        for(var i= 0, size=pTouchEvent.changedTouches.length; i<size; i++) {
            var finger = Instance.FINGER_MAP[pTouchEvent.changedTouches[i].identifier];
            if(finger !== undefined && this._getFingerPosition(finger) !== -1) {
                this._removeAllFingers();
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

        for(var i=0, size=this.gestureList.length; i<size; i++) {
            this.gestureList[i]._onFingerAdded(finger, this.fingerList);
        }
    },

    _removeFinger: function(pFingerId) {
        var finger = Instance.FINGER_MAP[pFingerId];
        if(finger !== undefined) {
            this.fingerList.splice(this._getFingerPosition(finger), 1);
            finger._setEndP(Date.now()-10);
            finger._clearHandlerObjects();
            delete this.fingerCreatedMap[finger.id];
            delete Instance.FINGER_MAP[finger.id];
        } else {
            console.log('!!!! AJAJAJ, finger undefined');
        }
    },

    _removeAllFingers: function() {
        // var list = this.fingerList.splice(0);
        for(var i=0, size=this.fingerList.length; i<size; i++) {
            this._removeFinger(this.fingerList[i].id);
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