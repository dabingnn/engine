'use strict';

var BasicMaterial = function() {
    this.texture = null;
    this.opacity = 1.0;
};

BasicMaterial = cc3d.inherits(BasicMaterial, cc3d.Material);

cc3d.extend( BasicMaterial.prototype, {
    _generateShaderKey: function (device, scene, objDefs) {
        var skinned = (objDefs && objDefs.skinned) || false;
        var key = 'BasicMaterialShader';
        if(this.hasAlphaTest()) {
            key += '_alphaTest';
        }
        if(skinned) {
            key += '_skinned';
        }
        return key;
    },

    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene, objDefs);
        if(key === this.shaderKey) return;
        var skinned = (objDefs && objDefs.skinned) || false;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {

            var vertSrc, pixelSrc;
            vertSrc = '' +
                'attribute vec3 a_position;\n' +
                'attribute vec2 a_uv;\n' +
                'uniform mat4 matrix_world;\n' +
                'uniform mat4 matrix_viewprojection;\n' +
                (skinned ? cc3d.ShaderChunks.transformSkinned : cc3d.ShaderChunks.transform) +
                'varying vec2 v_uv;\n' +
                'void main() {\n' +
                'gl_Position = matrix_viewprojection * matrix_world * getTransformedPos(vec4(a_position, 1.0));\n' +
                'v_uv = a_uv;\n' +
                '}\n';
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
            if(skinned) {
                attribs['a_skinIndex'] = cc3dEnums.SEMANTIC_BLENDINDICES;
                attribs['a_skinWeight'] = cc3dEnums.SEMANTIC_BLENDWEIGHT;
            }
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

//for testing
var ColorMaterial = function() {
    this.color = new cc3d.math.Vec3(1,1,1);
};

ColorMaterial = cc3d.inherits(ColorMaterial, cc3d.Material);

cc3d.extend( ColorMaterial.prototype, {
    _generateShaderKey: function (device, scene,objDefs) {
        var key =  'ColorMaterialShader';
        var skinned = (objDefs && objDefs.skinned) || false;
        if(skinned) {
            key += '_skinnned';
        }

        return key;

    },

    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        var skinned = (objDefs && objDefs.skinned) || false;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {

            var vertSrc, pixelSrc;
            vertSrc = '' +
                'attribute vec3 a_position;\n' +
                'uniform mat4 matrix_viewprojection;\n' +
                'uniform mat4 matrix_world;\n' +
                (skinned ? cc3d.ShaderChunks.transformSkinned : cc3d.ShaderChunks.transform) +
                'void main() {\n' +
                'gl_Position = matrix_viewprojection * matrix_world * getTransformedPos(vec4(a_position,1.0));\n' +
                '}\n';
            pixelSrc = 'precision mediump float;\n' +
                'uniform vec3 color;\n' +
                'void main() {\n' +
                'gl_FragColor.rgb = color;\n' +
                'gl_FragColor.a = 1.0;\n' +
                '}';
            var attribs = {
                a_position: cc3dEnums.SEMANTIC_POSITION,
                //a_normal: cc3dEnums.SEMANTIC_NORMAL
            };
            if(skinned) {
                attribs['a_skinIndex'] = cc3dEnums.SEMANTIC_BLENDINDICES;
                attribs['a_skinWeight'] = cc3dEnums.SEMANTIC_BLENDWEIGHT;
            }
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
