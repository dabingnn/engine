'use strict';

var BasicMaterial = function() {
    this.texture = null;
    this.shader = null;

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
    this.shader.link();
};

BasicMaterial.prototype = {
    updateShader: function(device, scene) {
    },
    //todo move it to forward renderer later
    applyShaderandUniforms: function(device, scene) {
        var scope = device.scope;
        var textureValue = scope.resolve('texture');
        textureValue.setValue(this.texture);

        device.setShader(this.shader);

    }

};

cc3d.BasicMaterial = BasicMaterial;
