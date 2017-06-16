# FingersJS

#### A javascript library for simultaneous touch gestures
FingersJS is a small javascript library that detects and fire gesture events on DOM objects.<br/>
This library detects __basic gestures__: Tap, Hold, ~~Swipe~~, Pinch, Drag, Rotate, Scale.<br/>
It also detects __multiple gestures on different objects in the same time__.

FingerJS is ~~partially~~ vastly re-written fork of the original [Fingers.js](https://github.com/paztis/fingers.js) library. 
Unlike the original fingers.js, the distance is recalculated to centimeters. The value is based on the PPI/DPI of the screen. For particular usage, it should be tweaked. Also note, that the documentation here shouldn't be up-to-date and I kindly suggest to check the code.

## Features
- Light library (4kB minified and gzipped)
- Works with touch devices (multiple fingers)
- Detect action gestures (Tap (one or more), Hold, ~~Swipe~~, Pinch)
- Detect movement gestures (Drag, Rotate, Scale)
- ~~Detect raw gestures (Fingers object managed)~~
- __Multiple gestures in same time__ (You can drag 2 different objects, rotate a third and swipe a fourth in same time)
- Easy to add your custom gestures.
- AMD/CommonJS support


## Usage
FingersJS is simple to use. Just create an instance of Fingers on the wanted DOM object, then register the gestures you want.<br/>

    var element = document.getElementById('el_id');
    var fingers = new Fingers(element);
    var gesture1 = fingers.addGesture(Fingers.gesture.Tap);
    var gesture2 = fingers.addGesture(Fingers.gesture.Hold);

Gestures can have multiple handlers:

    var element = document.getElementById('el_id');
    var fingers = new Fingers(element);
    var gesture1 = fingers.addGesture(Fingers.gesture.Tap);
    gesture1.addHandler(function(eventType, data, fingerList) {
        alert('Tap 1');
    });
    gesture1.addHandler(function(eventType, data, fingerList) {
        alert('Tap 2');
    });

Gestures handling methods are chainable:

    var element = document.getElementById('el_id');
    new Fingers(element)
        .addGesture(Fingers.gesture.Tap)
        .addHandler(function(eventType, data, fingerList) {alert('Tap 1');})
        .addHandler(function(eventType, data, fingerList) {alert('Tap 2');})
        .addHandler(function(eventType, data, fingerList) {alert('Tap 3');});


## Finger
Finger object is accessible from ```Gesture``` events

It contains all the informations about the finger from its beginning until its end.
It provides informations about:
- it time
- its position
- its moving direction
- its moving velocity

Informations are always available from Finger start or from Finger last move (ex: current velocity and average velocity)

# Gestures

## Gesture events

There are 2 kinds of gestures:

- action gestures: fire instant events 
- movement gestures: fire start, move then end events

Each event contains:

- its type (instant, start, move, end)
- its data (specific for each gesture)
- the list of concerned Fingers objects

The following gestures are detected:

- hold (1 .. N fingers), instant
- tap (1 .. N fingers) and multiple taps (1 .. N successive taps), instant
- ~~swipe (1 .. N fingers), instant~~
- Pinch (1 .. N fingers), instant
- drag (1 finger)
- rotate (2 fingers)
- scale (2 fingers)
- transform (rotate and scale) (2 fingers)
- ~~raw (each finger is seen independently)~~


## Gesture Options and Data

Each gesture has his set of options and manages its own data.

<!-- ### Raw gesture
#### Options
    {
        nbMaxFingers: Number.MAX_VALUE
    };
 -->

### Hold
#### Options
    {
        distanceThreshold: 0.8,         // in cm
        duration: 600,                  // in ms
    };
#### Data
- target (name of the target element)

### Tap

#### Options
    {
        nbFingers: 1,
        nbTapMin: 0,
        nbTapMax: 50,
        tapInterval: 300,
        distanceThreshold: 10
    };
#### Data
- nbTap (number of taps)
- lastTapTimestamp
- tapPosition
- target

### Drag
#### Options
    {
        distanceThreshold: 0.2,         // in cm
    }
#### Data
No data

<!-- ### Swipe
#### Options
    {
        nbFingers: 1,
        swipeVelocityX: 0.6,
        swipeVelocityY: 0.6
    };
#### Data
- direction (up, down, left, right)
- velocity
- target -->

### Pinch

Pinch fires the event after the gesture is completed. It is designed for 4 finger pinch (known e.g., from iPads)
#### Options
    {
        pinchInDetect: 0.6,
        pinchOutDetect: 1.4
    };
#### Data
- grow ('in' or 'out')
- scale
- target

<!-- ### Rotate

#### Options
    {
        angleThreshold: 0   // in radians
    }

#### Data
- totalRotation (rotation since the gesture start)
- deltaRotation (rotation since the last gesture move)

Note, that the angles are in radians.

#### Internal variables
- ```_startAngle```
- ```_lastAngle```

Note, that the angles are in degrees.

### Scale
#### Options
    {
        distanceThreshold: 2.5 // in cm
    }
#### Data
- totalDistance (distance since the gesture start)
- deltaDistance (distance between the last two gesture events)

#### Internal variables
- ```_startDistance```
- ```_lastDistance``` -->

### Transform
#### Options
    {
        distanceThreshold: 5,   // in cm
        angleThreshold: 0.1     // in radians
    };
#### Data
- totalRotation
- deltaRotation
- totalDistance
- deltaDistance
- totalScale
- deltaScale
- scale
- rotate
- target

#### Internal variables
- ```_startDistance```
- ```_lastDistance```
- ```_startAngle```
- ```_lastDistance```
- ```_threshold```


## Usage

#### Example
    var element = document.getElementById('el_id');
    new Fingers(element).addGesture(Fingers.gesture.Tap, {
         nbFingers: 3,
         tapInterval: 400
     });


#### Action gesture event exemple
    var element = document.getElementById('el_id');
    new Fingers(element)
        .addGesture(Fingers.gesture.Tap)
        .addHandler(function(eventType, data, fingerList) {
            //eventType === Fingers.Gesture.EVENT_TYPE.instant
        });

#### Movement gesture event exemple
    var element = document.getElementById('el_id');
    new Fingers(element)
        .addGesture(Fingers.gesture.Transform).addHandler(function(pEventType, pData, pFingers) {
            switch(pEventType) {
                case Fingers.Gesture.EVENT_TYPE.start:
                    ...
                    break;
                case Fingers.Gesture.EVENT_TYPE.move:
                    ...
                    break;
                case Fingers.Gesture.EVENT_TYPE.end:
                    ...
                    break;
            }
        });

## Custom Gesture
Its really easy to create you own ```Gesture```. You need to define its parameters, output data (optional) and handlers for each of the states of the gesture's life-cycle. 

#### Create your Gesture class
    var MyGesture = (function (_super) {

        //Constructor
        function MyGesture(pOptions) {
            _super.call(this, pOptions, {
                option_1: "default_value",
                option_2: "default_value"
            });

            this.data = {
                myData1: ...
                myData2: ...
            }
        }

        Fingers.__extend(MyGesture.prototype, _super.prototype, {

            _onFingerAdded: function(pNewFinger, pFingerList) {
                //If gesture is already listening fingers
                if(!this.isListening) {

                    //Listening of the fingers
                    this._addListenedFinger(pNewFinger);

                    //Event fire
                    this.fire(_super.EVENT_TYPE.start, this.data);
                }
            },

            _onFingerUpdate: function(pFinger) {
                //Event fire
                this.fire(_super.EVENT_TYPE.move, this.data);
            },

            _onFingerRemoved: function(pFinger) {
                if(this.isListenedFinger(pFinger)) {

                    //Event fire
                    this.fire(_super.EVENT_TYPE.end, this.data);

                    //Stop listening finger
                    this._removeAllListenedFingers();
                }
            }
        });

        return MyGesture;
    })(Fingers.Gesture);

    Fingers.gesture.MyGesture = MyGesture;

#### Use it with Fingers
    var element = document.getElementById('el_id');
    new Fingers(element)
        .addGesture(Fingers.gesture.MyGesture, {
            option_1: "value_1",
            option_2: "value_2"
        })
        .addHandler(function(eventType, data, fingerList) {
            alert('My Gesture appends');
        });


## Examples (outdated)
Examples are available in [/tests/manual folder](/tests/manual).
Try if on PC or on a Smartphone / Tablet with all your fingers, then enjoy it.