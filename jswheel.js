'use strict';
(function($){

    $.jswheel = {};

    function pixelScaler(val, y) {
        var ref_x = 1024;
        var ref_y = 768;

        var win_x = window.innerWidth;
        var win_y = window.innerHeight;

        if (y) {
            return (val * win_y / ref_y);
        } else {
            return (val * win_x / ref_x);
        }
    }

    $.jswheel = function(wheelData, pointList, options) {
        var res = {};
        var index = 0;
        var wheelIndex = 0;
        var elems = [];
        var pLen = pointList.length;
        var ready = true;
        var tmp;

        if (pLen < 2) {
            throw "jswheel requires at least two points";
        }

        // if we have less wheel elements than points, multiply wheel elements
        if (wheelData.length < pLen) {
            var toMult = Math.ceil(pLen / wheelData.length);
            var newWheelData = wheelData;
            for (var i = 1; i < toMult; i++) {
                newWheelData = newWheelData.concat(wheelData);
            }
            wheelData = newWheelData;
        }

        // assures that selection point is the first entry of wheelData at start
        tmp = wheelData.splice(wheelData.length - options.selectPosition);
        wheelData = tmp.concat(wheelData);

        // reset / set positions of all elements
        res.update = function () {
            elems = [];
            $(options.container).empty();

            for (var e = 0; e < pLen; e++) {
                var cur = (e + index) % pLen;
                var wheelCur = (cur + wheelIndex) % wheelData.length;

                var elemHTML = [
                    '<img class="ws-elem"',
                      'src="'+wheelData[wheelCur].file+'"',
                      'style="'+options.style+'"',
                      'title="'+wheelData[wheelCur].name+'">',
                    '</img>'
                ].join(' ');

                var elemTransform = [
                    'translate('+pixelScaler(pointList[cur][0], 0)+'px,'+pixelScaler(pointList[cur][1], 1)+'px)',
                    'rotate('+pointList[cur][2]+'deg)',
                    'scale('+pointList[cur][3]+')',
                ].join(' ');

                var newelem = $(elemHTML).css({
                    'transform': elemTransform,
                    'z-index': pointList[cur][4],
                }).appendTo($(options.container));

                elems.push(newelem);
            }
        };

        res.move = function (to) {
            var toChange, curWheelIndex;

            // avoids animation queuing
            if (ready) {
                ready = false;
                setTimeout(function() {ready = true;}, options.transitionTime);
            } else {
                return;
            }

            if (to == 'prev') {
                index = (index + 1) % pLen;
                wheelIndex = (wheelIndex + wheelData.length - 1) % wheelData.length;
                toChange = (pLen - index) % pLen;
                curWheelIndex = wheelIndex;

            } else {
                index = (index + pLen - 1) % pLen;
                wheelIndex = (wheelIndex + 1) % wheelData.length;
                toChange = pLen - 1 - index;
                curWheelIndex = (wheelIndex+pLen-1) % wheelData.length;
            }

            // change element image and name
            elems[toChange].attr('src', wheelData[curWheelIndex].file)
                           .attr('name', wheelData[curWheelIndex].name);

            // update elements positions, rotation, etc..
            for (var e = 0; e < pLen; e++) {
                var cur = (e + index) % pLen;
                var elemTransform = [
                    'translate('+pixelScaler(pointList[cur][0], 0)+'px,'+pixelScaler(pointList[cur][1], 1)+'px)',
                    'rotate('+pointList[cur][2]+'deg)',
                    'scale('+pointList[cur][3]+')',
                ].join(' ');
                elems[e].css({"z-index":pointList[cur][4]});
                elems[e].animate({transform: elemTransform}, options.transitionTime);
            }
        };

        res.prev = function () {
            res.move('prev');
        };

        res.next = function () {
            res.move('next');
        };

        res.select = function () {
            return (wheelData[(wheelIndex + options.selectPosition) % wheelData.length]);
        };

        res.update();
        return res;
    };

})(jQuery);
