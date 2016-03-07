// 'use strict';

function jswheel(wheelData, pointList, options) {
    this.wheelData = wheelData;
    this.pointList = JSON.parse(JSON.stringify(pointList));
    this.options = options;
    this.container = document.getElementById(options.containerId);
    this.index = 0;
    this.wheelIndex = 0;
    this.elems = [];
    this.pLen = this.pointList.length;
    this.ready = true;
    this.container.style.perspective = options.perspective;

    for (var i in options.containerStyle) {
        this.container.style[i] = options.containerStyle[i];
    }

    this.options.transitionTime /= 1000;

    if (this.options.hideDuration) {
        this.options.hideDuration /= 1000;
    }

    if (this.options.hideStart) {
        this.options.hideStart /= 1000;
    }

    if (this.pLen < 2) {
        throw "jswheel requires at least two points";
    }

    var startElemIdx = null;
    var tmp;

    // assures that starting point is the given element name
    if (this.options.startElem !== undefined) {
        for (i = 0; i < this.wheelData.length; i++) {
            if (this.wheelData[i].name.toLowerCase() == this.options.startElem.toLowerCase()) {
                startElemIdx = i;
            }
        }

        var sliceAt = startElemIdx - this.options.selectPosition;
        sliceAt = sliceAt < 0 ? sliceAt + this.wheelData.length: sliceAt;
        tmp = this.wheelData.splice(sliceAt);
        this.wheelData = tmp.concat(this.wheelData);
    }

    // assures that selection point is the first entry of this.wheelData at start
    if (startElemIdx === null) {
        tmp = this.wheelData.splice(this.wheelData.length - this.options.selectPosition);
        this.wheelData = tmp.concat(this.wheelData);
    }

    // if we have less wheel elements than points, multiply wheel elements
    if (this.wheelData.length < this.pLen) {
        var toMult = Math.ceil(this.pLen / this.wheelData.length);
        var newWheelData = this.wheelData;
        for (i = 1; i < toMult; i++) {
            newWheelData = newWheelData.concat(this.wheelData);
        }
        this.wheelData = newWheelData;
    }

    // used to handle percentage-like positionning (override this to your usage)
    this.scaler = function(value, type) {
        var win_x = window.innerWidth;
        var win_y = window.innerHeight;

        if (type === 'x') {
            return (value * win_x / 100).toFixed(3);
        } else if (type === 'y') {
            return (value * win_y / 100).toFixed(3);
        } else if (type === 'scale') {
            return (value * (win_y / 700)).toFixed(3);
        }
    };

    // init and set positions of all elements
    this.init = function () {
        this.elems = [];
        this.container.innerHTML = null;

        for (var e = 0; e < this.pLen; e++) {
            var cur = (e + this.index) % this.pLen;
            var wheelCur = (cur + this.wheelIndex) % this.wheelData.length;

            var elemHTML = document.createElement('div');
            if (this.wheelData[wheelCur].html === undefined) {
                this.wheelData[wheelCur].html = '<img src="%file%" title="%name%">';
            }
            elemHTML.innerHTML = this.wheelData[wheelCur].html
                .replace(/%file%/g, this.wheelData[wheelCur].file)
                .replace(/%name%/g, this.wheelData[wheelCur].name);
            elemHTML.setAttribute('class', 'ws-elem');
            elemHTML.setAttribute('style', this.options.style);
            elemHTML.setAttribute('title', this.wheelData[wheelCur].name);

            this.container.appendChild(elemHTML);
            this.elems.push(elemHTML);
        }
        this.update();
        this.hide();
    };

    this.show = function () {
        if (this.options.hide) {
            // clearTimeout(this.hideAnim);
            TweenLite.killTweensOf(this.container);
            TweenLite.to(this.container, 0, {opacity: 1});
        }
    };

    this.hide = function (time) {
        if (this.options.hide) {
            TweenLite.to(
                this.container,
                this.options.hideDuration,
                {opacity: 0, delay: this.options.hideStart + time}
            );
        }
    };

    this.moveTo = function (direction) {
        var toChange, curWheelIndex;

        if (direction == 'prev') {
            this.index = (this.index + 1) % this.pLen;
            this.wheelIndex = (this.wheelIndex + this.wheelData.length - 1) %
                              this.wheelData.length;
            toChange = (this.pLen - this.index) % this.pLen;
            curWheelIndex = this.wheelIndex;

        } else if (direction == 'next') {
            this.index = (this.index + this.pLen - 1) % this.pLen;
            this.wheelIndex = (this.wheelIndex + 1) % this.wheelData.length;
            toChange = this.pLen - 1 - this.index;
            curWheelIndex = (this.wheelIndex + this.pLen - 1) % this.wheelData.length;
        }

        // change element image and name
        if (this.wheelData[curWheelIndex].html === undefined) {
            this.wheelData[curWheelIndex].html = '<img src="%file%" title="%name%">';
        }
        this.elems[toChange].innerHTML = this.wheelData[curWheelIndex].html
            .replace(/%file%/g, this.wheelData[curWheelIndex].file)
            .replace(/%name%/g, this.wheelData[curWheelIndex].name);
        this.elems[toChange].setAttribute('title', this.wheelData[curWheelIndex].name);
    };

    this.moveToLetter = function (direction) {
        var toChange, curWheelIndex;

        var refLetter = this.wheelData[(this.wheelIndex + this.options.selectPosition) %
                        this.wheelData.length].name.charAt(0).toLowerCase();

        var curLetter = refLetter;
        while (refLetter == curLetter) {
            this.moveTo(direction);
            curLetter = this.wheelData[(this.wheelIndex + this.options.selectPosition) %
                        this.wheelData.length].name.charAt(0).toLowerCase();
        }

        this.update();
    };

    this.update = function (time) {
        // update elements positions, rotation, etc..
        // this.ready = false;
        var that = this;
        time = (time === undefined ? 0 : time);
        this.show();

        for (var e = 0; e < this.pLen; e++) {
            this.pointList[e].x = this.scaler(pointList[e].x, 'x');
            this.pointList[e].y = this.scaler(pointList[e].y, 'y');
            this.pointList[e].scale = this.scaler(pointList[e].scale, 'scale');
        }

        for (var e = 0; e < this.pLen; e++) {
            var cur = (e + this.index) % this.pLen;
            // copy object since TweenLite use existing object for transformation
            var elemTransform = {};
            for (i in this.pointList[cur]) {
                elemTransform[i] = this.pointList[cur][i];
            }
            if (elemTransform.zIndex) {
                TweenLite.to(this.elems[e], 0, {zIndex: elemTransform.zIndex});
            }
            TweenLite.to(this.elems[e], time, elemTransform)
                     .eventCallback('onComplete', function(){that.ready = true;});
        }
        this.hide(time);
    };

    this.move = function (direction) {
        // avoids animation queuing - IMPROVE THIS
        if (this.ready) {
            this.ready = false;
            var that = this;
            setTimeout(function(){that.ready = true;}, this.options.minTransitionTime);
        } else {
            return;
        }

        this.moveTo(direction);
        this.update(this.options.transitionTime);
    };

    this.select = function () {
        return (this.wheelData[(this.wheelIndex + this.options.selectPosition) %
               this.wheelData.length]);
    };

    this.init();
};
