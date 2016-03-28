/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and  non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Chukong Aipu reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

cc3d = {
    extend : function(target, ex) {
        var prop,
            copy;

        for(prop in ex) {
            copy = ex[prop];
            if(typeof(copy) == "object") {
                target[prop] = extend({}, copy);
            } else if(typeof(copy) == "array") {
                target[prop] = extend([], copy);
            } else {
                target[prop] = copy;
            }
        }

        return target;
    },

    inherits: function (Self, Super) {
        var Temp = function () {};
        var Func = function () {
            Super.apply(this, arguments);
            Self.apply(this, arguments);
            // this.constructor = Self;
        };
        Func._super = Super.prototype;
        Temp.prototype = Super.prototype;
        Func.prototype = new Temp();

        return Func;
    }
};

require('./math');
require('./graphicDevice');
require('./scene');
