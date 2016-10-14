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

var misc = {};

misc.propertyDefine = function (ctor, sameNameGetSets, diffNameGetSets) {
    function define (np, propName, getter, setter) {
        var pd = Object.getOwnPropertyDescriptor(np, propName);
        if (pd) {
            if (pd.get) np[getter] = pd.get;
            if (pd.set && setter) np[setter] = pd.set;
        }
        else {
            var getterFunc = np[getter];
            if (CC_DEV && !getterFunc) {
                var clsName = (cc.Class._isCCClass(ctor) && cc.js.getClassName(ctor)) ||
                              ctor.name ||
                              '(anonymous class)';
                cc.warn('no %s or %s on %s', propName, getter, clsName);
            }
            else {
                cc.js.getset(np, propName, getterFunc, np[setter]);
            }
        }
    }
    var propName, np = ctor.prototype;
    for (var i = 0; i < sameNameGetSets.length; i++) {
        propName = sameNameGetSets[i];
        var suffix = propName[0].toUpperCase() + propName.slice(1);
        define(np, propName, 'get' + suffix, 'set' + suffix);
    }
    for (propName in diffNameGetSets) {
        var getset = diffNameGetSets[propName];
        define(np, propName, getset[0], getset[1]);
    }
};

/**
 * @param {Number} x
 * @return {Number}
 * Constructor
 */
misc.NextPOT = function (x) {
    x = x - 1;
    x = x | (x >> 1);
    x = x | (x >> 2);
    x = x | (x >> 4);
    x = x | (x >> 8);
    x = x | (x >> 16);
    return x + 1;
};

//var DirtyFlags = misc.DirtyFlags = {
//    TRANSFORM: 1 << 0,
//    SIZE: 1 << 1,
//    //Visible:
//    //Color:
//    //Opacity
//    //Cache
//    //Order
//    //Text
//    //Gradient
//    ALL: (1 << 2) - 1
//};
//
//DirtyFlags.WIDGET = DirtyFlags.TRANSFORM | DirtyFlags.SIZE;

misc.destructIgnoreId = function () {
    // The same as Object._destruct but dont reset _id when destroyed
    for (var key in this) {
        if (this.hasOwnProperty(key) && key !== '_id') {
            switch (typeof this[key]) {
                case 'string':
                    this[key] = '';
                    break;
                case 'object':
                case 'function':
                    this[key] = null;
                    break;
            }
        }
    }
};

module.exports = misc;
