'use strict';

var BasicMaterial = function() {
    this.texture = null;
};

BasicMaterial = cc3d.inherits(BasicMaterial, cc3d.Material);

cc3d.extend( BasicMaterial.prototype, {
    updateShader: function (device, scene, objDefs) {
        if(this.shader) return;
        var vertSrc,pixelSrc;
        vertSrc = '' +
            'attribute vec4 a_position;' +
            'attribute vec2 a_texCoord0;' +
            'uniform mat4 worldViewProjection;' +
            'varying vec2 v_texCoord0;' +
            'void main() {' +
            'gl_Position = worldViewProjection * a_position;' +
            'v_texCoord0 = a_texCoord0;' +
            '}';
        pixelSrc = 'precision mediump float;' +
            'varying vec2 v_texCoord0;' +
            'uniform sampler2D texture;' +
            'void main() {' +
            'vec4 diffuseColor = texture2D(texture, v_texCoord0);' +
            'gl_FragColor = diffuseColor;' +
            '}';
        var attribs = {
            a_position: cc3dEnums.SEMANTIC_POSITION,
            a_texCoord0: cc3dEnums.SEMANTIC_TEXCOORD0
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
};

BasicLambertMaterial = cc3d.inherits(BasicLambertMaterial, cc3d.Material);

cc3d.extend( BasicLambertMaterial.prototype, {
    updateShader: function (device, scene, objDefs) {
        if(this.shader) return;
        var vertSrc,pixelSrc;
        vertSrc = '' +
            'attribute vec4 a_position;' +
            'attribute vec2 a_texCoord0;' +
            'attribute vec3 a_normal;' +
            'uniform mat4 world;' +
            'uniform mat4 view;' +
            'uniform mat4 projection;' +
            'uniform mat4 worldViewProjection;' +
            'uniform mat4 matrix_normal;' +
            'varying vec2 v_texCoord0;' +
            'varying vec3 v_normal;' +
            'void main() {' +
            'gl_Position = worldViewProjection * a_position;' +
            'v_normal = (matrix_normal * vec4(a_normal,0.0)).xyz;' +
            'v_texCoord0 = a_texCoord0;' +
            '}';
        pixelSrc = 'precision mediump float;' +
            'varying vec2 v_texCoord0;' +
            'varying vec3 v_normal;' +
            'uniform sampler2D texture;' +
            'uniform vec3 lightDirInWorld;' +
            'uniform vec3 lightColor;' +
            'uniform vec3 sceneAmbient;' +
            'float computeLight(vec3 lightDir, vec3 normal) {' +
            'float dotLight = dot(lightDir, normal);' +
            'if(dotLight < 0.0) dotLight = 0.0;' +
            'return dotLight;' +
            '}' +
            'void main() {' +
            'float diffuseFactor = computeLight(-lightDirInWorld,v_normal);' +
            'vec3 lighting = lightColor.rgb * diffuseFactor + sceneAmbient;' +
            'vec4 diffuse = texture2D(texture, v_texCoord0);' +
            'gl_FragColor.xyz = diffuse.rgb * lighting.rgb;' +
            'gl_FragColor.a = diffuse.a;' +
            '}';
        var attribs = {
            a_position: cc3dEnums.SEMANTIC_POSITION,
            a_texCoord0: cc3dEnums.SEMANTIC_TEXCOORD0,
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

    update: function() {
        this.setParameter('texture',this.texture);
    },

});

cc3d.BasicMaterial = BasicMaterial;
cc3d.BasicLambertMaterial = BasicLambertMaterial;
