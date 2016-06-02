'use strict';

var BasicMaterial = function() {
    this.texture = null;
    this.opacity = 1.0;
};

BasicMaterial = cc3d.inherits(BasicMaterial, cc3d.Material);

cc3d.extend( BasicMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        var key = 'BasicMaterialShader';
        if(this.hasAlphaTest()) {
            key += '_alphaTest';
        }
        return key;
    },

    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {

            var vertSrc, pixelSrc;
            vertSrc = '' +
                'attribute vec4 a_position;' +
                'attribute vec2 a_uv;' +
                'uniform mat4 matrix_world;' +
                'uniform mat4 matrix_viewprojection;' +
                'varying vec2 v_uv;' +
                'void main() {' +
                'gl_Position = matrix_viewprojection * matrix_world * a_position;' +
                'v_uv = a_uv;' +
                '}';
            pixelSrc = 'precision mediump float;' +
                'varying vec2 v_uv;' +
                'uniform sampler2D texture;' +
                'uniform float u_opacity;';
            if(this.hasAlphaTest()) {
                pixelSrc += 'uniform float alphaTestRef;';
            }
            pixelSrc += 'void main() {' +
                'vec4 albedo = texture2D(texture, v_uv);';
            if(this.hasAlphaTest()) {
                pixelSrc += 'if(albedo.a < alphaTestRef) discard;';
            }
            pixelSrc += 'gl_FragColor = albedo;' +
                'gl_FragColor.a *= u_opacity;' +
                '}';
            var attribs = {
                a_position: cc3dEnums.SEMANTIC_POSITION,
                a_uv: cc3dEnums.SEMANTIC_TEXCOORD0
                //a_normal: cc3dEnums.SEMANTIC_NORMAL
            };
            var definition = {
                vshader: vertSrc,
                fshader: pixelSrc,
                attributes: attribs
            };
            this.shader = new cc3d.graphics.Shader(device, definition);
            //link it
            this.shader.link();
            cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('texture',this.texture);
        this.setParameter('u_opacity', this.opacity);
        if(this.hasAlphaTest()) {
            this.setParameter('alphaTestRef', this.alphaTest);
        }
    },

});

var ColorMaterial = function() {
    this.color = new cc3d.math.Vec3(1,1,1);
};

ColorMaterial = cc3d.inherits(ColorMaterial, cc3d.Material);

cc3d.extend( ColorMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        return 'ColorMaterialShader';
    },

    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {

            var vertSrc, pixelSrc;
            vertSrc = '' +
                'attribute vec4 a_position;' +
                'uniform mat4 matrix_viewprojection;' +
                'uniform mat4 matrix_world;' +
                'void main() {' +
                'gl_Position = matrix_viewprojection * matrix_world * a_position;' +
                '}';
            pixelSrc = 'precision mediump float;' +
                'uniform vec3 color;' +
                'void main() {' +
                'gl_FragColor.rgb = color;' +
                'gl_FragColor.a = 1.0;' +
                '}';
            var attribs = {
                a_position: cc3dEnums.SEMANTIC_POSITION,
                //a_normal: cc3dEnums.SEMANTIC_NORMAL
            };
            var definition = {
                vshader: vertSrc,
                fshader: pixelSrc,
                attributes: attribs
            };
            this.shader = new cc3d.graphics.Shader(device, definition);
            //link it
            this.shader.link();
            cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('color',this.color.data);
    },

});

cc3d.BasicMaterial = BasicMaterial;
cc3d.ColorMaterial = ColorMaterial;
