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

var Component = require('../../core/components/CCComponent');

var MSDFFont = function (data, texture) {
    this.data = data;
    this.texture = texture;
    this.em = 1;
    this._lineHeight = 1;
    this._foregroundColor = new cc.ColorF(1,1,1,1);
    this._backgroundColor = new cc.ColorF(0,0,0,0);
};

MSDFFont.prototype.getShader = function () {
    var shader;
    return function () {
        if(!shader) {
            var shaderDefinition = {
                attributes: {
                    aPosition: cc3d.SEMANTIC_POSITION,
                    aUv0: cc3d.SEMANTIC_TEXCOORD0
                },
                vshader: cc3d.shaderChunks.msdfVS,
                fshader: cc3d.shaderChunks.msdfPS.replace("[PRECISION]", "precision highp float;"),
            };

            shader = new cc3d.Shader(cc.renderer.device, shaderDefinition);
        }
        return shader;
    };
}();

MSDFFont.prototype.getShader2d = function () {
    var shader;
    return function () {
        if(!shader) {
            var shaderDefinition = {
                attributes: {
                    aPosition: cc3d.SEMANTIC_POSITION,
                    aUv0: cc3d.SEMANTIC_TEXCOORD0
                },
                vshader: cc3d.shaderChunks.msdf2dVS,
                fshader: cc3d.shaderChunks.msdfPS.replace("[PRECISION]", "precision highp float;"),
            };

            shader = new cc3d.Shader(cc.renderer.device, shaderDefinition);
        }
        return shader;
    };
}();


MSDFFont.prototype.setForegroundColor = function (color) {
    this._foregroundColor.copy(color);
};

MSDFFont.prototype.setBackgroundColor = function (color) {
    this._backgroundColor.copy(color);
};

MSDFFont.prototype.getUv = function(json, char) {
    var data = json;
    var width = data.info.width;
    var height = data.info.height;

    if (!data.chars[char]) {
        // missing char
        return [0,0,1,1];
    }

    var x = data.chars[char].x;
    var y =  data.chars[char].y;

    var x1 = x;
    var y1 = y;
    var x2 = (x + data.chars[char].width);
    var y2 = (y - data.chars[char].height);
    var edge = 1 - (data.chars[char].height / height)
    return [
        x1 / width,
        edge - (y1 / height), // bottom left

        (x2 / width),
        edge - (y2 / height)  // top right
    ];
};

MSDFFont.prototype.getMaterial = function() {
    var backgroundColor = this._backgroundColor;
    var foregroundColor = this._foregroundColor;
    var material = new cc3d.Material();
    material.setShader(this.getShader());

    material.setParameter("texture_atlas", this.texture);
    material.setParameter("material_background", [backgroundColor.r,backgroundColor.g,backgroundColor.b,backgroundColor.a]);
    material.setParameter("material_foreground", [foregroundColor.r,foregroundColor.g,foregroundColor.b,foregroundColor.a]);
    material.blendType = cc3d.BLEND_PREMULTIPLIED;
    material.cull = cc3d.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
};

MSDFFont.prototype.getMaterial2d = function() {
    var backgroundColor = this._backgroundColor;
    var foregroundColor = this._foregroundColor;

    var material = new cc3d.Material();
    material.setShader(this.getShader2d());

    material.setParameter("texture_atlas", this.texture);
    material.setParameter("material_background", [backgroundColor.r,backgroundColor.g,backgroundColor.b,backgroundColor.a]);
    material.setParameter("material_foreground", [foregroundColor.r,foregroundColor.g,foregroundColor.b,foregroundColor.a]);
    material.blendType = cc3d.BLEND_PREMULTIPLIED;
    material.cull = cc3d.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
};

MSDFFont.prototype.createMesh = function (testString, lineHeight) {
    lineHeight = lineHeight || 1.0;
    var l = testString.length;
    // create empty arrays
    var positions = new Array(l*3*4);
    var normals = new Array(l*3*4);
    var uvs = new Array(l*2*4);
    var indices = new Array(l*3*2);

    // create index buffer now
    // index buffer doesn't change as long as text length stays the same
    for (var i = 0; i < l; i++) {
        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var cursorX = 0;
    var cursorY = 0;
    var cursorZ = 0;
    var miny = Number.MAX_VALUE;
    var maxy = Number.MIN_VALUE;
    var json = this.data;
    //var lines = 0;
    for(i = 0; i < l; ++i) {
        var char = testString.charCodeAt(i);
        var data = json.chars[char];

        if (char === 10 || char === 13) {
            // add forced line-break
            cursorY -= lineHeight * this.em;
            cursorX = 0;
            //lines++;
            continue;
        }

        var x = 0;
        var y = 0;
        var scale = 0;
        var advance = 0;
        if (data && data.scale) {
            scale = 1 / data.scale;
            advance = data.xadvance / data.width;
            x = data.xoffset / data.width;
            y = data.yoffset / data.height;
        } else {
            // missing character
            advance = 0.5;
            x = 0;
            y = 0;
            scale = 0.01;
        }
        //fill positions and calculate width
        positions[i*4*3+0] = cursorX - x;
        positions[i*4*3+1] = cursorY - y;
        positions[i*4*3+2] = cursorZ;

        positions[i*4*3+3] = cursorX + scale - x;
        positions[i*4*3+4] = cursorY - y;
        positions[i*4*3+5] = cursorZ;

        positions[i*4*3+6] = cursorX + scale - x;
        positions[i*4*3+7] = cursorY - y + scale;
        positions[i*4*3+8] = cursorZ;

        positions[i*4*3+9]  = cursorX - x;
        positions[i*4*3+10] = cursorY - y + scale;
        positions[i*4*3+11] = cursorZ;

        if (positions[i*4*3+7] > maxy) maxy = positions[i*4*3+7];
        if (positions[i*4*3+1] < miny) miny = positions[i*4*3+1];

        // advance cursor
        var spacing = 1;
        cursorX = cursorX + (spacing*advance);

        normals[i*4*3+0] = 0;
        normals[i*4*3+1] = 0;
        normals[i*4*3+2] = -1;

        normals[i*4*3+3] = 0;
        normals[i*4*3+4] = 0;
        normals[i*4*3+5] = -1;

        normals[i*4*3+6] = 0;
        normals[i*4*3+7] = 0;
        normals[i*4*3+8] = -1;

        normals[i*4*3+9] = 0;
        normals[i*4*3+10] = 0;
        normals[i*4*3+11] = -1;
        var uv = this.getUv(json, char);

        uvs[i*4*2+0] = uv[0];
        uvs[i*4*2+1] = uv[1];

        uvs[i*4*2+2] = uv[2];
        uvs[i*4*2+3] = uv[1];

        uvs[i*4*2+4] = uv[2];
        uvs[i*4*2+5] = uv[3];

        uvs[i*4*2+6] = uv[0];
        uvs[i*4*2+7] = uv[3];

        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var mesh = cc3d.createMesh(cc.renderer.device, positions, {uvs: uvs, normals: normals, indices: indices});

    return mesh;
};

var bmFontVS = "attribute vec3 aPosition;\n" +
    "attribute vec2 aUv0;\n" +
    "uniform mat4 matrix_model;\n" +
    "uniform mat4 matrix_viewProjection;\n" +
    "varying vec2 vUv0;" +
    "\nvoid main(void)\n{" +
    "\n    vUv0 = aUv0;\n" +
    "    gl_Position = matrix_viewProjection * matrix_model * vec4(aPosition, 1.0);\n" +
    "}\n";

var bmFontVS2d = "attribute vec3 aPosition;\n" +
    "attribute vec2 aUv0;\n" +
    "varying vec2 vUv0;\n" +
    "uniform mat4 uProjection2d;\n" +
    "void main(void)\n{" +
    "\n    vUv0 = aUv0;\n" +
    "    gl_Position = vec4((uProjection2d * vec4(aPosition, 1.0)).xy, 0.0, 1.0);\n" +
    "}\n";

var bmFontPS = "#extension GL_OES_standard_derivatives : enable\n" +
    "[PRECISION]\n" +
    "varying vec2 vUv0;\n" +
    "uniform sampler2D texture_atlas;\n" +
    "void main() {\n" +
    "    vec4 sample = texture2D(texture_atlas, vUv0).rgba;\n" +
    "    if (sample.a < 0.05) {\n" +
    "        discard;\n" +
    "    }\n" +
    "    gl_FragColor = sample;\n" +
    "}\n";

var BMFont = function (data, texture) {
    this.data = data;
    this.texture = texture;
    this.em = 1;
    this._lineHeight = 1;
};

BMFont.prototype.getShader = function () {
    var shader;
    return function () {
        if(!shader) {
            var shaderDefinition = {
                attributes: {
                    aPosition: cc3d.SEMANTIC_POSITION,
                    aUv0: cc3d.SEMANTIC_TEXCOORD0
                },
                vshader: bmFontVS,
                fshader: bmFontPS.replace("[PRECISION]", "precision highp float;"),
            };

            shader = new cc3d.Shader(cc.renderer.device, shaderDefinition);
        }
        return shader;
    };
}();

BMFont.prototype.getShader2d = function () {
    var shader;
    return function () {
        if(!shader) {
            var shaderDefinition = {
                attributes: {
                    aPosition: cc3d.SEMANTIC_POSITION,
                    aUv0: cc3d.SEMANTIC_TEXCOORD0
                },
                vshader: bmFontVS2d,
                fshader: bmFontPS.replace("[PRECISION]", "precision highp float;"),
            };

            shader = new cc3d.Shader(cc.renderer.device, shaderDefinition);
        }
        return shader;
    };
}();

BMFont.prototype.getUv = function(json, char) {
    var data = json;
    var width = data.common.scaleW;
    var height = data.common.scaleH;

    if (!data.chars[char]) {
        // missing char
        return [0,0,1,1];
    }

    var x = data.chars[char].x;
    var y =  data.chars[char].y;

    var x1 = x;
    var y1 = y;
    var x2 = (x + data.chars[char].width);
    var y2 = (y - data.chars[char].height);
    var edge = 1 - (data.chars[char].height / height);
    return [
        x1 / width,
        edge - (y1 / height), // bottom left

        (x2 / width),
        edge - (y2 / height)  // top right
    ];
};

BMFont.prototype.createMesh = function (testString, lineHeight) {
    lineHeight = lineHeight || 1.0;
    var l = testString.length;
    // create empty arrays
    var positions = new Array(l*3*4);
    var normals = new Array(l*3*4);
    var uvs = new Array(l*2*4);
    var indices = new Array(l*3*2);

    // create index buffer now
    // index buffer doesn't change as long as text length stays the same
    for (var i = 0; i < l; i++) {
        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var cursorX = 0;
    var cursorY = 0;
    var cursorZ = 0;
    var miny = Number.MAX_VALUE;
    var maxy = Number.MIN_VALUE;
    var json = this.data;
    var fontSize = json.info.size;
    //var lines = 0;
    for(i = 0; i < l; ++i) {
        var char = testString.charCodeAt(i);
        var data = json.chars[char];

        if (char === 10 || char === 13) {
            // add forced line-break
            cursorY -= lineHeight * this.em;
            cursorX = 0;
            //lines++;
            continue;
        }

        var x = 0;
        var y = 0;
        var advance = 0;
        if (data) {
            scale = 1 ;
            advance = data.xadvance/fontSize;
            x = data.xoffset/fontSize;
            y = 1 - (data.height + data.yoffset)/fontSize;
        } else {
            // missing character
            advance = 0.5;
            x = 0;
            y = 0;
            scale = 0.01;
        }

        //fill positions and calculate width
        positions[i*4*3+0] = cursorX + x;
        positions[i*4*3+1] = cursorY + y;
        positions[i*4*3+2] = cursorZ;

        positions[i*4*3+3] = cursorX + data.width/fontSize + x;
        positions[i*4*3+4] = cursorY + y;
        positions[i*4*3+5] = cursorZ;

        positions[i*4*3+6] = cursorX + data.width/fontSize + x;
        positions[i*4*3+7] = cursorY + data.height/fontSize + y;
        positions[i*4*3+8] = cursorZ;

        positions[i*4*3+9]  = cursorX + x;
        positions[i*4*3+10] = cursorY + data.height/fontSize + y;
        positions[i*4*3+11] = cursorZ;

        if (positions[i*4*3+7] > maxy) maxy = positions[i*4*3+7];
        if (positions[i*4*3+1] < miny) miny = positions[i*4*3+1];

        // advance cursor
        var spacing = 1;
        cursorX = cursorX + (spacing*advance);

        normals[i*4*3+0] = 0;
        normals[i*4*3+1] = 0;
        normals[i*4*3+2] = -1;

        normals[i*4*3+3] = 0;
        normals[i*4*3+4] = 0;
        normals[i*4*3+5] = -1;

        normals[i*4*3+6] = 0;
        normals[i*4*3+7] = 0;
        normals[i*4*3+8] = -1;

        normals[i*4*3+9] = 0;
        normals[i*4*3+10] = 0;
        normals[i*4*3+11] = -1;
        var uv = this.getUv(json, char);

        uvs[i*4*2+0] = uv[0];
        uvs[i*4*2+1] = uv[1];

        uvs[i*4*2+2] = uv[2];
        uvs[i*4*2+3] = uv[1];

        uvs[i*4*2+4] = uv[2];
        uvs[i*4*2+5] = uv[3];

        uvs[i*4*2+6] = uv[0];
        uvs[i*4*2+7] = uv[3];

        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var mesh = cc3d.createMesh(cc.renderer.device, positions, {uvs: uvs, normals: normals, indices: indices});

    return mesh;
};

BMFont.prototype.getMaterial = function() {
    var material = new cc3d.Material();
    material.setShader(this.getShader());
    material.setParameter("texture_atlas", this.texture);
    material.blendType = cc3d.BLEND_PREMULTIPLIED;
    material.cull = cc3d.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
};

BMFont.prototype.getMaterial2d = function() {
    var material = new cc3d.Material();
    material.setShader(this.getShader2d());
    material.setParameter("texture_atlas", this.texture);
    material.blendType = cc3d.BLEND_PREMULTIPLIED;
    material.cull = cc3d.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    return material;
};

var LabelComponent = cc.Class({
    name: 'cc.LabelComponent',
    extends: Component,

    editor: CC_EDITOR && {
        executeInEditMode: true,
        menu: 'i18n:MAIN_MENU.component.renderers/LabelComponent',
    },
    properties: {
        screenSpace: {
            get: function () {
                return this._is2D;
            },
            set: function (value) {
                this._is2D = value;
                this._detachMeshInstanceToRenderer();
                if(this._text && this._font) {
                    this._buildFontMeshInstance();
                }
                this._attachMeshInstanceToRenderer();
            },
        },
    },

    ctor: function () {
        this._meshInstance = null;
        this._font = null;
        this._text = null;
        this._is2D = false;
    },

    start: function() {
    },

    onEnable: (!CC_EDITOR) && function() {
        this._attachMeshInstanceToRenderer();
    },

    onDisable: (!CC_EDITOR) && function() {
        this._detachMeshInstanceToRenderer();
    },

    setFont: function(font) {
        this._font = font;
        //this._font = new MSDFFont(fontFile, fontTexture);
        this._detachMeshInstanceToRenderer();
        if(this._text) {
            this._buildFontMeshInstance();
        }
        this._attachMeshInstanceToRenderer();
    },

    setText:function (text) {
        this._text = text;
        this._detachMeshInstanceToRenderer();
        if(this._font) {
            this._buildFontMeshInstance();
        }
        this._attachMeshInstanceToRenderer();
    },

    onDestroy: function() {

    },

    onFocusInEditor: function() {

    },

    onLostFocusInEditor: function() {

    },

    _buildFontMeshInstance: function () {
        if(this._font && this._text) {
            var mesh = this._font.createMesh(this._text, 1.1);
            var mtl = this._is2D ? this._font.getMaterial2d() : this._font.getMaterial();
            this._meshInstance = new cc3d.MeshInstance(this.node, mesh, mtl);
            if(this._is2D && this._meshInstance) {
                var modelMat = new cc.Mat4();
                var projMat = new cc.Mat4();
                modelMat.copy(this.node.getWorldTransform());
                var w = cc.renderer.device.canvas.width/32;
                var h = cc.renderer.device.canvas.height/32;
                var left;
                var right;
                var bottom;
                var top;
                var near = 2;
                var far = 0;
                var xscale = 1/32;
                var yscale = 1/32;
                left = 0;
                right = w;
                xscale = 1/32;
                bottom = 0;
                top = h;
                yscale = 1/32;
                projMat.setOrtho(left, right, bottom, top, near, far);
                modelMat.data[12] *= xscale;
                modelMat.data[13] *= yscale;
                projMat.mul(modelMat);
                this._meshInstance.setParameter('uProjection2d', projMat.data);
            }
        }

    },

    _attachMeshInstanceToRenderer: function () {
        if(this._meshInstance) {
            var scene = cc.director.getScene();
            var drawcall = scene && scene._sgScene && scene._sgScene.drawCalls;
            drawcall.push(this._meshInstance);
        }
    },

    _detachMeshInstanceToRenderer: function () {
        if(this._meshInstance) {
            var scene = cc.director.getScene();
            var drawcall = scene && scene._sgScene && scene._sgScene.drawCalls;
            drawcall.splice(drawcall.indexOf(this._meshInstance), 1);
        }
    },

    __preload: function () {
    }

});

cc.LabelComponent = module.exports = LabelComponent;
cc.MSDFFont = MSDFFont;
cc.BMFont = BMFont;
