
'use strict';

var Light = function () {
    this._type = cc3d.SceneEnums.LIGHTTYPE_DIRECTIONAL;
    this._color = new cc3d.math.Vec3(0.8, 0.8, 0.8);
    this._intensity = 1;
    //this._castShadows = false;
    this._enabled = false;

    // Point and spot properties
    this._attenuationStart = 10;
    this._attenuationEnd = 10;
    this._falloffMode = 0;
    //this._shadowType = pc.SHADOW_DEPTH;
    //this.mask = 1;

    // Spot properties
    this._innerConeAngle = 40;
    this._outerConeAngle = 45;

    // Cache of light property data in a format more friendly for shader uniforms
    this._finalColor = new cc3d.math.Vec3(0.8, 0.8, 0.8);
    this._linearFinalColor = new cc3d.math.Vec3();
    this._position = new cc3d.math.Vec3(0, 0, 0);
    this._direction = new cc3d.math.Vec3(0, 0, 0);
    this._innerConeAngleCos = Math.cos(this._innerConeAngle * Math.PI / 180);
    this._outerConeAngleCos = Math.cos(this._outerConeAngle * Math.PI / 180);

    // Shadow mapping resources
    //this._shadowCamera = null;
    //this._shadowMatrix = new pc.Mat4();
    //this._shadowDistance = 40;
    //this._shadowResolution = 1024;
    //this._shadowBias = -0.0005;
    //this._normalOffsetBias = 0.0;
    //this.shadowUpdateMode = pc.SHADOWUPDATE_REALTIME;

    this._scene = null;
    this._node = null;
};

Light.prototype = {

    clone: function () {
        var clone = new Light();

        // Clone Light properties
        clone.setType(this.getType());
        clone.setColor(this.getColor());
        clone.setIntensity(this.getIntensity());
        clone.setCastShadows(this.getCastShadows());
        clone.setEnabled(this.getEnabled());

        // Point and spot properties
        clone.setAttenuationStart(this.getAttenuationStart());
        clone.setAttenuationEnd(this.getAttenuationEnd());
        clone.setFalloffMode(this.getFalloffMode());
        //clone.setShadowType(this.getShadowType());
        //clone.shadowUpdateMode = this.shadowUpdateMode;
        //clone.mask = this.mask;

        // Spot properties
        clone.setInnerConeAngle(this.getInnerConeAngle());
        clone.setOuterConeAngle(this.getOuterConeAngle());

        // Shadow properties
        //clone.setShadowBias(this.getShadowBias());
        //clone.setNormalOffsetBias(this.getNormalOffsetBias());
        //clone.setShadowResolution(this.getShadowResolution());
        //clone.setShadowDistance(this.getShadowDistance());

        return clone;
    },

    getAttenuationEnd: function () {
        return this._attenuationEnd;
    },

    getAttenuationStart: function () {
        return this._attenuationStart;
    },

    getFalloffMode: function () {
        return this._falloffMode;
    },

    //getShadowType: function () {
    //    return this._shadowType;
    //},

    //getCastShadows: function () {
    //    return this._castShadows && this.mask!==pc.MASK_LIGHTMAP && this.mask!==0;
    //},

    getColor: function () {
        return this._color;
    },

    getEnabled: function () {
        return this._enabled;
    },

    getInnerConeAngle: function () {
        return this._innerConeAngle;
    },

    getIntensity: function () {
        return this._intensity;
    },

    getOuterConeAngle: function () {
        return this._outerConeAngle;
    },

    //getShadowBias: function () {
    //    return this._shadowBias;
    //},

    //getNormalOffsetBias: function () {
    //    return this._normalOffsetBias;
    //},

    //getShadowDistance: function () {
    //    return this._shadowDistance;
    //},

    //getShadowResolution: function () {
    //    return this._shadowResolution;
    //},

    getType: function () {
        return this._type;
    },

    setAttenuationEnd: function (radius) {
        this._attenuationEnd = radius;
    },

    setAttenuationStart: function (radius) {
        this._attenuationStart = radius;
    },

    setFalloffMode: function (mode) {
        this._falloffMode = mode;
        //if (this._scene !== null) {
        //    this._scene.updateShaders = true;
        //}
    },

    //setShadowType: function (mode) {
    //    this._shadowType = mode;
    //    if (this._scene !== null) {
    //        this._scene.updateShaders = true;
    //    }
    //},

    //setMask: function (_mask) {
    //    this.mask = _mask;
    //    if (this._scene !== null) {
    //        this._scene.updateShaders = true;
    //    }
    //},

    //getBoundingSphere: function (sphere) {
    //    if (this._type===pc.LIGHTTYPE_SPOT) {
    //        sphere.radius = this.getAttenuationEnd() * 0.5;
    //        spotCenter.copy(this._node.up);
    //        spotCenter.scale(-sphere.radius);
    //        spotCenter.add(this._node.getPosition());
    //        sphere.center = spotCenter;
    //    } else if (this._type===pc.LIGHTTYPE_POINT) {
    //        sphere.center = this._node.getPosition();
    //        sphere.radius = this.getAttenuationEnd();
    //    }
    //},

    //setCastShadows: function (castShadows) {
    //    this._castShadows = castShadows;
    //    if (this._scene !== null) {
    //        this._scene.updateShaders = true;
    //    }
    //},

    setColor: function () {
        var r, g, b;
        if (arguments.length === 1) {
            r = arguments[0].x;
            g = arguments[0].y;
            b = arguments[0].z;
        } else if (arguments.length === 3) {
            r = arguments[0];
            g = arguments[1];
            b = arguments[2];
        }

        this._color.set(r, g, b);

        // Update final color
        var i = this._intensity;
        this._finalColor.set(r * i, g * i, b * i);
        for(var c=0; c<3; c++) {
            if (i >= 1) {
                this._linearFinalColor.data[c] = Math.pow(this._finalColor.data[c] / i, 2.2) * i;
            } else {
                this._linearFinalColor.data[c] = Math.pow(this._finalColor.data[c], 2.2);
            }
        }
    },

    setEnabled: function (enable) {
        if (this._enabled !== enable) {
            this._enabled = enable;
            //if (this._scene !== null) {
            //    this._scene.updateShaders = true;
            //}
        }
    },

    setInnerConeAngle: function (angle) {
        this._innerConeAngle = angle;
        this._innerConeAngleCos = Math.cos(angle * Math.PI / 180);
    },

    setIntensity: function (intensity) {
        this._intensity = intensity;

        // Update final color
        var c = this._color;
        var r = c.x;
        var g = c.y;
        var b = c.z;
        var i = this._intensity;
        this._finalColor.set(r * i, g * i, b * i);
        for(var j = 0; j < 3; j++) {
            if (i >= 1) {
                this._linearFinalColor.data[j] = Math.pow(this._finalColor.data[j] / i, 2.2) * i;
            } else {
                this._linearFinalColor.data[j] = Math.pow(this._finalColor.data[j], 2.2);
            }
        }
    },

    setOuterConeAngle: function (angle) {
        this._outerConeAngle = angle;
        this._outerConeAngleCos = Math.cos(angle * Math.PI / 180);
    },

    //setShadowBias: function (bias) {
    //    this._shadowBias = bias;
    //},

    //setNormalOffsetBias: function (bias) {
    //    if ((!this._normalOffsetBias && bias) || (this._normalOffsetBias && !bias)) {
    //        this._scene.updateShaders = true;
    //    }
    //    this._normalOffsetBias = bias;
    //},
    //
    //setShadowDistance: function (distance) {
    //    this._shadowDistance = distance;
    //},

    //setShadowResolution: function (resolution) {
    //    var device = pc.Application.getApplication().graphicsDevice;
    //    if (this._type===pc.LIGHTTYPE_POINT) {
    //        resolution = Math.min(resolution, device.maxCubeMapSize);
    //    } else {
    //        resolution = Math.min(resolution, device.maxTextureSize);
    //    }
    //    this._shadowResolution = resolution;
    //},

    setType: function (type) {
        this._type = type;
        //this._destroyShadowMap();
    },

    //_destroyShadowMap: function () {
    //    if (this._shadowCamera) {
    //        var rt = this._shadowCamera._renderTarget;
    //        var i;
    //        if (rt) {
    //            if (rt.length) {
    //                for(i=0; i<rt.length; i++) {
    //                    if (rt[i].colorBuffer) rt[i].colorBuffer.destroy();
    //                    rt[i].destroy();
    //                }
    //            } else {
    //                if (rt.colorBuffer) rt.colorBuffer.destroy();
    //                rt.destroy();
    //            }
    //        }
    //        this._shadowCamera._renderTarget = null;
    //        this._shadowCamera = null;
    //        this._shadowCubeMap = null;
    //    }
    //},
    //
    //updateShadow: function() {
    //    if (this.shadowUpdateMode!==pc.SHADOWUPDATE_REALTIME) {
    //        this.shadowUpdateMode = pc.SHADOWUPDATE_THISFRAME;
    //    }
    //}
};

cc3d.Light = Light;
