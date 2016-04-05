'use strict';

var BasicMaterial = function() {
    this.texture = null;
};

BasicMaterial = cc3d.inherits(BasicMaterial, cc3d.Material);

cc3d.extend( BasicMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        return 'BasicMaterialShader';
    },

    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var vertSrc,pixelSrc;
        vertSrc = '' +
            'attribute vec4 a_position;' +
            'attribute vec2 a_uv;' +
            'uniform mat4 matrix_worldviewprojection;' +
            'varying vec2 v_uv;' +
            'void main() {' +
            'gl_Position = matrix_worldviewprojection * a_position;' +
            'v_uv = a_uv;' +
            '}';
        pixelSrc = 'precision mediump float;' +
            'varying vec2 v_uv;' +
            'uniform sampler2D texture;' +
            'void main() {' +
            'vec4 diffuseColor = texture2D(texture, v_uv);' +
            'gl_FragColor = diffuseColor;' +
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
        this.shader = new cc3d.graphics.Shader(device,definition);
        //link it
        this.shader.link();
    },

    update: function() {
        this.setParameter('texture',this.texture);
    },

});

var BasicLambertMaterial = function() {
    this.texture = null;
    this.color = cc3d.math.Vec3(1,1,1);
    this._shaderKey = 0;
};

BasicLambertMaterial = cc3d.inherits(BasicLambertMaterial, cc3d.Material);

cc3d.extend( BasicLambertMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        var key = 'BasicLambertMaterial';
        key += '_directionalLight_' + scene._directionalLights.length;
        key += '_pointLight_' + scene._pointLights.length;
        key += '_spotLight_' + scene._spotLights.length;

        return key;
    },

    _generateShader : function(device, scene) {

        var vertSrc,pixelSrc;
        //todo add define here
        vertSrc = '\n';
        vertSrc += '#define VARYING_POSITION\n';
        vertSrc += '#define VARYING_NORMAL\n';
        vertSrc += '#define VARYING_UV\n';

        vertSrc += '#define USE_UV\n';
        vertSrc += '#define USE_NORMAL\n';

        vertSrc += cc3d.ShaderChunks.commonUniforms;
        vertSrc += cc3d.ShaderChunks.commonAttributes;
        vertSrc += cc3d.ShaderChunks.commonVaryings;
        vertSrc += 'void main() {\n' +
            'vec4 tranformedPos = vec4(a_position, 1.0);\n' +
            'gl_Position = matrix_worldviewprojection * tranformedPos;\n' +
            'v_position = (matrix_worldview * tranformedPos).xyz;\n' +
            'vec4 normal = matrix_normal * vec4(a_normal,0.0);\n' +
            'v_normal = normalize(normal.xyz);\n' +
            'v_uv = a_uv;\n' +
            '}';

        pixelSrc = 'precision mediump float;\n';

        pixelSrc += '#define VARYING_POSITION\n';
        pixelSrc += '#define VARYING_NORMAL\n';
        pixelSrc += '#define VARYING_UV\n';
        //light define
        pixelSrc += '#define DIRECTIONAL_LIGHT_COUNT ' + scene._directionalLights.length + '\n';
        pixelSrc += '#define POINT_LIGHT_COUNT ' + scene._pointLights.length + '\n';
        pixelSrc += '#define SPOT_LIGHT_COUNT ' + scene._spotLights.length + '\n';

        pixelSrc += cc3d.ShaderChunks.commonVaryings;
        pixelSrc += cc3d.ShaderChunks.lighting;
        pixelSrc += 'uniform sampler2D texture;\n';
        pixelSrc += 'void main () {\n' +
            'vec4 texture_diffuse = texture2D(texture, v_uv);\n' +
            'vec3 diffuseLighting = getDiffuseLighting(v_normal,v_position);\n' +
            'gl_FragColor.rgb = texture_diffuse.rgb * diffuseLighting;\n' +
            'gl_FragColor.a = texture_diffuse.a;\n' +
            '}';

        var attribs = {
            a_position: cc3dEnums.SEMANTIC_POSITION,
            a_uv: cc3dEnums.SEMANTIC_TEXCOORD0,
            a_normal: cc3dEnums.SEMANTIC_NORMAL
        };
        var definition = {
            vshader: vertSrc,
            fshader: pixelSrc,
            attributes: attribs
        };
        this.shader = new cc3d.graphics.Shader(device,definition);
        this.shader.link();
    },
    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;

        this._generateShader(device,scene);
    },

    update: function() {
        this.setParameter('texture',this.texture);
    },

});

cc3d.BasicMaterial = BasicMaterial;
cc3d.BasicLambertMaterial = BasicLambertMaterial;
