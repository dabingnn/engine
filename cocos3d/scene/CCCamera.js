
'use strict';

var Frustum = function Frustum(projectionMatrix, viewMatrix) {
    projectionMatrix = projectionMatrix || new cc3d.math.Mat4().setPerspective(90, 16 / 9, 0.1, 1000);
    viewMatrix = viewMatrix || new cc3d.math.Mat4();

    this.planes = [];
    for (var i = 0; i < 6; i++)
        this.planes[i] = [ ];

    this.update(projectionMatrix, viewMatrix);
};

Frustum.prototype = {

    update: function (projectionMatrix, viewMatrix) {
        var viewProj = new cc3d.math.Mat4();
        viewProj.mul2(projectionMatrix, viewMatrix);
        var vpm = viewProj.data;

        // Extract the numbers for the RIGHT plane
        this.planes[0][0] = vpm[3] - vpm[0];
        this.planes[0][1] = vpm[7] - vpm[4];
        this.planes[0][2] = vpm[11] - vpm[8];
        this.planes[0][3] = vpm[15] - vpm[12];
        // Normalize the result
        var t = Math.sqrt(this.planes[0][0] * this.planes[0][0] + this.planes[0][1] * this.planes[0][1] + this.planes[0][2] * this.planes[0][2]);
        this.planes[0][0] /= t;
        this.planes[0][1] /= t;
        this.planes[0][2] /= t;
        this.planes[0][3] /= t;

        // Extract the numbers for the LEFT plane
        this.planes[1][0] = vpm[3] + vpm[0];
        this.planes[1][1] = vpm[7] + vpm[4];
        this.planes[1][2] = vpm[11] + vpm[8];
        this.planes[1][3] = vpm[15] + vpm[12];
        // Normalize the result
        t = Math.sqrt(this.planes[1][0] * this.planes[1][0] + this.planes[1][1] * this.planes[1][1] + this.planes[1][2] * this.planes[1][2]);
        this.planes[1][0] /= t;
        this.planes[1][1] /= t;
        this.planes[1][2] /= t;
        this.planes[1][3] /= t;

        // Extract the BOTTOM plane
        this.planes[2][0] = vpm[3] + vpm[1];
        this.planes[2][1] = vpm[7] + vpm[5];
        this.planes[2][2] = vpm[11] + vpm[9];
        this.planes[2][3] = vpm[15] + vpm[13];
        // Normalize the result
        t = Math.sqrt(this.planes[2][0] * this.planes[2][0] + this.planes[2][1] * this.planes[2][1] + this.planes[2][2] * this.planes[2][2]);
        this.planes[2][0] /= t;
        this.planes[2][1] /= t;
        this.planes[2][2] /= t;
        this.planes[2][3] /= t;

        // Extract the TOP plane
        this.planes[3][0] = vpm[3] - vpm[1];
        this.planes[3][1] = vpm[7] - vpm[5];
        this.planes[3][2] = vpm[11] - vpm[9];
        this.planes[3][3] = vpm[15] - vpm[13];
        // Normalize the result
        t = Math.sqrt(this.planes[3][0] * this.planes[3][0] + this.planes[3][1] * this.planes[3][1] + this.planes[3][2] * this.planes[3][2]);
        this.planes[3][0] /= t;
        this.planes[3][1] /= t;
        this.planes[3][2] /= t;
        this.planes[3][3] /= t;

        // Extract the FAR plane
        this.planes[4][0] = vpm[3] - vpm[2];
        this.planes[4][1] = vpm[7] - vpm[6];
        this.planes[4][2] = vpm[11] - vpm[10];
        this.planes[4][3] = vpm[15] - vpm[14];
        // Normalize the result
        t = Math.sqrt(this.planes[4][0] * this.planes[4][0] + this.planes[4][1] * this.planes[4][1] + this.planes[4][2] * this.planes[4][2]);
        this.planes[4][0] /= t;
        this.planes[4][1] /= t;
        this.planes[4][2] /= t;
        this.planes[4][3] /= t;

        // Extract the NEAR plane
        this.planes[5][0] = vpm[3] + vpm[2];
        this.planes[5][1] = vpm[7] + vpm[6];
        this.planes[5][2] = vpm[11] + vpm[10];
        this.planes[5][3] = vpm[15] + vpm[14];
        // Normalize the result
        t = Math.sqrt(this.planes[5][0] * this.planes[5][0] + this.planes[5][1] * this.planes[5][1] + this.planes[5][2] * this.planes[5][2]);
        this.planes[5][0] /= t;
        this.planes[5][1] /= t;
        this.planes[5][2] /= t;
        this.planes[5][3] /= t;
    },

    //containsPoint: function (point) {
    //    for (var p = 0; p < 6; p++)
    //        if (this.planes[p][0] * point.x +
    //            this.planes[p][1] * point.y +
    //            this.planes[p][2] * point.z +
    //            this.planes[p][3] <= 0)
    //            return false;
    //    return true;
    //},
    //containsSphere: function (sphere) {
    //    var c = 0;
    //    var d;
    //    for (p = 0; p < 6; p++) {
    //        d = this.planes[p][0] * sphere.center.x +
    //            this.planes[p][1] * sphere.center.y +
    //            this.planes[p][2] * sphere.center.z +
    //            this.planes[p][3];
    //        if (d <= -sphere.radius)
    //            return 0;
    //        if (d > sphere.radius)
    //            c++;
    //    }
    //    return (c === 6) ? 2 : 1;
    //}
};

var Camera = function () {
    this._projection = cc3d.SceneEnums.PROJECTION_PERSPECTIVE;
    this._nearClip = 0.1;
    this._farClip = 10000;
    this._fov = 45;
    this._orthoHeight = 10;
    this._aspect = 16 / 9;
    this._horizontalFov = false;
    this.frustumCulling = false;
    this._renderDepthRequests = 0;

    this._projMatDirty = true;
    this._projMat = new cc3d.math.Mat4();
    this._viewMat = new cc3d.math.Mat4();
    this._viewProjMat = new cc3d.math.Mat4();

    this._rect = {
        x: 0,
        y: 0,
        width: 1,
        height: 1
    };

    this._frustum = new Frustum(this._projMat, this._viewMat);

    // Create a full size viewport onto the backbuffer
    this._renderTarget = null;
    this._depthTarget = null;

    // Create the clear options
    this._clearOptions = {
        color: [186.0 / 255.0, 186.0 / 255.0, 177.0 / 255.0, 1.0],
        depth: 1.0,
        flags: cc3d.graphics.Enums.CLEARFLAG_COLOR | cc3d.graphics.Enums.CLEARFLAG_DEPTH
    };

    this._node = null;
};

Camera.prototype = {
    clone: function () {
        var clone = new Camera();
        clone.setProjection(this.getProjection());
        clone.setNearClip(this.getNearClip());
        clone.setFarClip(this.getFarClip());
        clone.setFov(this.getFov());
        clone.setAspectRatio(this.getAspectRatio());
        clone.setRenderTarget(this.getRenderTarget());
        clone.setClearOptions(this.getClearOptions());
        clone.frustumCulling = this.frustumCulling;
        return clone;
    },
    //worldToScreen: function (worldCoord, cw, ch, screenCoord) {
    //    if (screenCoord === undefined) {
    //        screenCoord = new cc3d.math.Vec3();
    //    }
    //
    //    var projMat = this.getProjectionMatrix();
    //    var wtm = this._node.getWorldTransform();
    //    this._viewMat.copy(wtm).invert();
    //    this._viewProjMat.mul2(projMat, this._viewMat);
    //    this._viewProjMat.transformPoint(worldCoord, screenCoord);
    //
    //    // calculate w co-coord
    //    var wp = worldCoord.data;
    //    var vpm = this._viewProjMat.data;
    //    var w = wp[0] * vpm[3] +
    //        wp[1] * vpm[7] +
    //        wp[2] * vpm[11] +
    //        1 * vpm[15];
    //
    //    screenCoord.x = (screenCoord.x / w + 1) * 0.5 * cw;
    //    screenCoord.y = (1 - screenCoord.y / w) * 0.5 * ch;
    //
    //    return screenCoord;
    //},
    //screenToWorld: function (x, y, z, cw, ch, worldCoord) {
    //    if (worldCoord === undefined) {
    //        worldCoord = new pc.Vec3();
    //    }
    //
    //    var projMat = this.getProjectionMatrix();
    //    var wtm = this._node.getWorldTransform();
    //    this._viewMat.copy(wtm).invert();
    //    this._viewProjMat.mul2(projMat, this._viewMat);
    //    var invViewProjMat = this._viewProjMat.clone().invert();
    //
    //    if (this._projection === pc.PROJECTION_PERSPECTIVE) {
    //        // Calculate the screen click as a point on the far plane of the
    //        // normalized device coordinate 'box' (z=1)
    //        var far = new pc.Vec3(x / cw * 2 - 1, (ch - y) / ch * 2 - 1, 1);
    //        // Transform to world space
    //        var farW = invViewProjMat.transformPoint(far);
    //
    //        var w = far.x * invViewProjMat.data[3] +
    //            far.y * invViewProjMat.data[7] +
    //            far.z * invViewProjMat.data[11] +
    //            invViewProjMat.data[15];
    //
    //        farW.scale(1 / w);
    //
    //        var alpha = z / this._farClip;
    //        worldCoord.lerp(this._node.getPosition(), farW, alpha);
    //    } else {
    //        // Calculate the screen click as a point on the far plane of the
    //        // normalized device coordinate 'box' (z=1)
    //        var range = this._farClip - this._nearClip;
    //        var deviceCoord = new pc.Vec3(x / cw * 2 - 1, (ch - y) / ch * 2 - 1, (this._farClip - z) / range * 2 - 1);
    //        // Transform to world space
    //        invViewProjMat.transformPoint(deviceCoord, worldCoord);
    //    }
    //
    //    return worldCoord;
    //},

    getAspectRatio: function () {
        return this._aspect;
    },

    getClearOptions: function () {
        return this._clearOptions;
    },

    getFarClip: function () {
        return this._farClip;
    },

    getFov: function () {
        return this._fov;
    },

    getFrustum: function () {
        return this._frustum;
    },

    getNearClip: function () {
        return this._nearClip;
    },

    getOrthoHeight: function () {
        return this._orthoHeight;
    },

    getProjection: function () {
        return this._projection;
    },

    getProjectionMatrix: function () {
        if (this._projMatDirty) {
            if (this._projection === cc3d.SceneEnums.PROJECTION_PERSPECTIVE) {
                this._projMat.setPerspective(this._fov, this._aspect, this._nearClip, this._farClip, this._horizontalFov);
            } else {
                var y = this._orthoHeight;
                var x = y * this._aspect;
                this._projMat.setOrtho(-x, x, -y, y, this._nearClip, this._farClip);
            }

            this._projMatDirty = false;
        }
        return this._projMat;
    },

    getRect: function () {
        return this._rect;
    },

    getRenderTarget: function () {
        return this._renderTarget;
    },

    setAspectRatio: function (aspect) {
        this._aspect = aspect;
        this._projMatDirty = true;
    },

    setClearOptions: function (options) {
        this._clearOptions = options;
    },

    setFarClip: function (far) {
        this._farClip = far;
        this._projMatDirty = true;
    },

    setFov: function (fov) {
        this._fov = fov;
        this._projMatDirty = true;
    },

    setNearClip: function (near) {
        this._nearClip = near;
        this._projMatDirty = true;
    },

    setOrthoHeight: function (height) {
        this._orthoHeight = height;
        this._projMatDirty = true;
    },

    setHorizontalFov: function (value) {
        this._horizontalFov = value;
        this._projMatDirty = true;
    },

    setProjection: function (type) {
        this._projection = type;
        this._projMatDirty = true;
    },

    setRect: function (x, y, width, height) {
        this._rect.x = x;
        this._rect.y = y;
        this._rect.width = width;
        this._rect.height = height;
    },

    setRenderTarget: function (target) {
        this._renderTarget = target;
    }
    //
    //requestDepthMap: function () {
    //    this._renderDepthRequests++;
    //},
    //
    //releaseDepthMap: function () {
    //    this._renderDepthRequests--;
    //}
};

cc3d.Frustum = Frustum;
cc3d.Camera = Camera;