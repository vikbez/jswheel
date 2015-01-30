// 'use strict';

function jswheel(wheelData, pointList, options) {
    this.wheelData = wheelData;
    this.pointList = pointList;
    this.options = options;
    this.container = document.getElementById(options.containerId);
    this.index = 0;
    this.wheelIndex = 0;
    this.elems = [];
    this.pLen = this.pointList.length;
    this.ready = true;

    if (this.pLen < 2) {
        throw "jswheel requires at least two points";
    }

    // if we have less wheel elements than points, multiply wheel elements
    if (this.wheelData.length < this.pLen) {
        var toMult = Math.ceil(this.pLen / this.wheelData.length);
        var newWheelData = this.wheelData;
        for (var i = 1; i < toMult; i++) {
            newWheelData = newWheelData.concat(this.wheelData);
        }
        this.wheelData = newWheelData;
    }

    // assures that selection point is the first entry of this.wheelData at start
    var tmp = this.wheelData.splice(this.wheelData.length - this.options.selectPosition);
    this.wheelData = tmp.concat(this.wheelData);

    this.setReady = function() {
        this.ready = true;
    };

    this.pixelScaler = function(val, y) {
        var ref_x = 1024;
        var ref_y = 768;

        var win_x = window.innerWidth;
        var win_y = window.innerHeight;

        if (y) {
            return (val * win_y / ref_y);
        } else {
            return (val * win_x / ref_x);
        }
    };

    // reset / set positions of all elements
    this.update = function () {
        this.elems = [];
        this.container.innerHTML = null;

        for (var e = 0; e < this.pLen; e++) {
            var cur = (e + this.index) % this.pLen;
            var wheelCur = (cur + this.wheelIndex) % this.wheelData.length;

            var elemHTML = document.createElement('img');
            elemHTML.setAttribute('class', 'ws-elem');
            elemHTML.setAttribute('src', this.wheelData[wheelCur].file);
            elemHTML.setAttribute('style', this.options.style);
            elemHTML.setAttribute('title', this.wheelData[wheelCur].name);

            var elemTransform = [
                'translate('+this.pixelScaler(this.pointList[cur][0], 0)+'px,'+
                             this.pixelScaler(this.pointList[cur][1], 1)+'px)',
                'rotate('+this.pointList[cur][2]+'deg)',
                'scale('+this.pointList[cur][3]+')',
            ].join(' ');

            TweenLite.to(elemHTML, 0, {
                'transform': elemTransform,
                'z-index': this.pointList[cur][4],
            });

            this.container.appendChild(elemHTML);
            this.elems.push(elemHTML);
        }
    };

    this.move = function (direction) {
        var toChange, curWheelIndex;

        // avoids animation queuing - IMPROVE THIS
        if (this.ready) {
            this.ready = false;
            that = this;
            setTimeout(function(){that.ready = true}, this.options.minTransitionTime);
        } else {
            return;
        }

        if (direction == 'prev') {
            this.index = (this.index + 1) % this.pLen;
            this.wheelIndex = (this.wheelIndex + this.wheelData.length - 1) %
                              this.wheelData.length;
            toChange = (this.pLen - this.index) % this.pLen;
            curWheelIndex = this.wheelIndex;

        } else {
            this.index = (this.index + this.pLen - 1) % this.pLen;
            this.wheelIndex = (this.wheelIndex + 1) % this.wheelData.length;
            toChange = this.pLen - 1 - this.index;
            curWheelIndex = (this.wheelIndex + this.pLen - 1) % this.wheelData.length;
        }

        // change element image and name
        this.elems[toChange].setAttribute('src', this.wheelData[curWheelIndex].file);
        this.elems[toChange].setAttribute('name', this.wheelData[curWheelIndex].name);

        // update elements positions, rotation, etc..
        for (var e = 0; e < this.pLen; e++) {
            var cur = (e + this.index) % this.pLen;
            var elemTransform = [
                'translate('+this.pixelScaler(pointList[cur][0], 0)+'px,'+
                             this.pixelScaler(pointList[cur][1], 1)+'px)',
                'rotate('+pointList[cur][2]+'deg)',
                'scale('+pointList[cur][3]+')',
            ].join(' ');
            parent = this;
            TweenLite.to(this.elems[e], 0, {"z-index":pointList[cur][4]});
            TweenLite.to(this.elems[e], this.options.transitionTime, {transform: elemTransform})
                     .eventCallback('onComplete', function(){this.ready = true});
            this.ready = false;
        }
    };

    this.prev = function () {
        this.move('prev');
    };

    this.next = function () {
        this.move('next');
    };

    this.select = function () {
        return (this.wheelData[(this.wheelIndex + this.options.selectPosition) %
               this.wheelData.length]);
    };

    this.update();
};
