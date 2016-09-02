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

var ValueType = require('./CCValueType');
var JS = require('../platform/js');
var CCClass = require('../platform/CCClass');

function Vec3 (x, y, z) {
    if (x && typeof x === 'object') {
        z = x.z;
        y = x.y;
        x = x.x;
    }
    this.x = x || 0;
    this.y = y || 0;
    this.z = z || 0;
    this._data = [0,0,0];
}
JS.extend(Vec3, ValueType);
CCClass.fastDefine('cc.Vec3', Vec3, { x: 0, y: 0, z: 0, });

JS.mixin(Vec3.prototype, {

    clone: function () {
        return new Vec3(this.x, this.y, this.z);
    },

    set: function (newValue) {
        this.x = newValue.x;
        this.y = newValue.y;
        this.z = newValue.z;
        return this;
    },

    equals: function (other) {
        return other && this.x === other.x && this.y === other.y && this.z === other.z;
    },

    toString: function () {
        return "(" +
            this.x.toFixed(2) + ", " +
            this.y.toFixed(2) + ", " +
            this.z.toFixed(2) + ")"
            ;
    },

    lerp: function (to, ratio, out) {
        out = out || new Vec3();
        var x = this.x;
        var y = this.y;
        var z = this.z;
        out.x = x + (to.x - x) * ratio;
        out.y = y + (to.y - y) * ratio;
        out.z = z + (to.z - z) * ratio;
        return out;
    },

    addSelf: function (vector) {
        this.x += vector.x;
        this.y += vector.y;
        this.z += vector.z;
        return this;
    },

    add: function (vector, out) {
        out = out || new Vec3();
        out.x = this.x + vector.x;
        out.y = this.y + vector.y;
        out.z = this.z + vector.z;
        return out;
    },

    subSelf: function (vector) {
        this.x -= vector.x;
        this.y -= vector.y;
        this.z -= vector.z;
        return this;
    },

    sub: function (vector, out) {
        out = out || new Vec3();
        out.x = this.x - vector.x;
        out.y = this.y - vector.y;
        out.z = this.z - vector.z;
        return out;
    },

    mulSelf: function (num) {
        this.x *= num;
        this.y *= num;
        this.z *= num;
        return this;
    },

    mul: function (num, out) {
        out = out || new Vec3();
        out.x = this.x * num;
        out.y = this.y * num;
        out.z = this.z * num;
        return out;
    },

    scaleSelf: function (vector) {
        this.x *= vector.x;
        this.y *= vector.y;
        this.z *= vector.z;
        return this;
    },

    scale: function (vector, out) {
        out = out || new Vec3();
        out.x = this.x * vector.x;
        out.y = this.y * vector.y;
        out.z = this.z * vector.z;
        return out;
    },

    divSelf: function (num) {
        this.x /= num;
        this.y /= num;
        this.z /= num;
        return this;
    },

    div: function (num, out) {
        out = out || new Vec3();
        out.x = this.x / num;
        out.y = this.y / num;
        out.z = this.z / num;
        return out;
    },

    negSelf: function () {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    },

    neg: function (out) {
        out = out || new Vec3();
        out.x = -this.x;
        out.y = -this.y;
        out.z = -this.z;
        return out;
    },

    dot: function (vector) {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    },

    cross: function (vector, out) {
        var ax, ay, az, bx, by, bz;
        out = out || new Vec3();

        ax = this.x;
        ay = this.y;
        az = this.z;
        bx = vector.x;
        by = vector.y;
        bz = vector.z;

        out.x = ay * bz - by * az;
        out.y = az * bx - bz * ax;
        out.z = ax * by - bx * ay;

        return out;
    },

    mag: function () {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    },

    magSqr: function () {
        return this.x * this.x + this.y * this.y + this.z * this.z;
    },

    normalizeSelf: function () {
        var magSqr = this.x * this.x + this.y * this.y + this.z * this.z;
        if (magSqr === 1.0)
            return this;

        if (magSqr === 0.0) {
            console.warn("Can't normalize zero vector");
            return this;
        }

        var invsqrt = 1.0 / Math.sqrt(magSqr);
        this.x *= invsqrt;
        this.y *= invsqrt;
        this.z *= invsqrt;
        return this;
    },


    normalize: function (out) {
        out = out || new Vec3();
        out.x = this.x;
        out.y = this.y;
        out.z = this.z;
        out.normalizeSelf();
        return out;
    },

    angle: function (vector) {
        var magSqr1 = this.magSqr();
        var magSqr2 = vector.magSqr();

        if (magSqr1 === 0 || magSqr2 === 0) {
            console.warn("Can't get angle between zero vector");
            return 0.0;
        }

        var dot = this.dot(vector);
        var theta = dot / (Math.sqrt(magSqr1 * magSqr2));
        theta = cc.clampf(theta, -1.0, 1.0);
        return Math.acos(theta);
    },

    signAngle: function (vector) {
        //todo: add implementation here by Harrison
        cc.error("add implementation here");
        return 0;
    },

    rotate: function (radians, out) {
        //todo: add implementation here by Harrison
        cc.error("add implementation here");

        out = out || new Vec3();
        out.x = this.x;
        out.y = this.y;
        out.z = this.z;
        return out;
    },


    rotateSelf: function (radians) {
        //todo: add implementation here by Harrison
        cc.error("add implementation here");
        return this;
    }

    //_serialize: function () {
    //    return [this.x, this.y];
    //},
    //_deserialize: function (data) {
    //    this.x = data[0];
    //    this.y = data[1];
    //}
});

Object.defineProperty(Vec3.prototype, 'data', {
    get: function () {
        var data = this._data;
        data[0] = this.x;
        data[1] = this.y;
        data[2] = this.z;
        return this._data;
    },
});

// static
JS.get(Vec3, 'ONE', function () {
    return new Vec3(1.0, 1.0, 1.0);
});

JS.get(Vec3, 'ZERO', function () {
    return new Vec3(0.0, 0.0, 0.0);
});

JS.get(Vec3, 'UP', function () {
    return new Vec3(0.0, 1.0, 0.0);
});

JS.get(Vec3, 'RIGHT', function () {
    return new Vec3(1.0, 0.0, 0.0);
});

cc.Vec3 = Vec3;

cc.v3 = function v3 (x, y, z) {
    return new Vec3(x, y, z);
};
module.exports = cc.Vec3;