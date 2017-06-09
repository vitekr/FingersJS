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
    _addListenedFingers: function(pFinger1, pFinger2, pFinger3) {
        for(var i=0, size=arguments.length; i<size; i++) {
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

    _removeListenedFinger: function(pFinger) {

        pFinger._removeHandlerObject(this);
        index = this.listenedFingers.indexOf(pFinger);
        this.listenedFingers.splice(index, 1);

        if(this.listenedFingers.length === 0) {
            this.isListening = false;
        }
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
