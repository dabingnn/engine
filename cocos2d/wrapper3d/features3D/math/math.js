/**
 * @name pc.math
 * @namespace
 * @description Math API
 */
pc.math = cc.math;

// IE doesn't have native log2
if (!Math.log2) {
    Math.log2 = function (x) {
        return Math.log(x) * pc.math.INV_LOG2;
    };
}

pc.extend(pc, (function () {
    return {
        Vec2: cc.Vec2v2
    };
}()));

pc.extend(pc, (function () {
    return {
        Vec3: cc.Vec3
    };
}()));

pc.extend(pc, (function () {
    return {
        Vec4: cc.Vec4
    };
}()));

pc.extend(pc, (function () {
    return {
        Quat: cc.Quat
    };
}()));

pc.extend(pc, (function () {
    return {
        Mat3: cc.Mat3
    };
}()));

pc.extend(pc, (function () {
    return {
        Mat4: cc.Mat4
    };
}()));
