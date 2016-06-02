'use strict';

var DepthMaterial = function() {
    //this.texture = null;
    //this.opacity = 1.0;
};

DepthMaterial = cc3d.inherits(DepthMaterial, cc3d.Material);
cc3d.extend( DepthMaterial.prototype, {
    _generateShaderKey: function (device, scene, objDefs) {
        var skinned = (objDefs && objDefs.skinned) || false;
        var key = 'DepthMaterialShader';
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
                'uniform mat4 matrix_world;' +
                'uniform mat4 matrix_viewprojection;\n' +
                'varying vec4 v_position_clip;\n';
            if(skinned) {
                vertSrc += cc3d.ShaderChunks.transformSkinned;
            } else {
                vertSrc += cc3d.ShaderChunks.transform;
            }
            vertSrc +='void main() {\n' +
                ' v_position_clip = matrix_viewprojection * matrix_world * getTransformedPos(vec4(a_position, 1.0));;\n' +
                ' gl_Position = v_position_clip;\n' +
                '}\n';
            pixelSrc = 'precision mediump float;\n';
            pixelSrc += 'varying vec4 v_position_clip;\n';
            pixelSrc += 'vec4 packFloat(float v)\n';
            pixelSrc += '{\n';
            pixelSrc += '    vec4 enc = vec4(1.0, 255.0, 65025.0, 16581375.0) * v;\n';
            pixelSrc += '    enc = fract(enc);\n';
            pixelSrc += '    return enc;\n';
            pixelSrc += '}\n\n';

            pixelSrc += 'float unpackFloat(vec4 rgba) \n';
            pixelSrc += '{\n';
            pixelSrc += '    return dot( rgba, vec4(1.0, 1.0/255.0, 1.0/65025.0, 1.0/16581375.0) );\n';
            pixelSrc += '}\n';
            pixelSrc += cc3d.ShaderChunks.linearShadowDepth;
            pixelSrc += 'void main() {\n';
            pixelSrc += '//vec3 depth = gl_FragCoord.zzz/1000.0;\n' +
                'float depth = toLinearShadowDepth(v_position_clip.z / v_position_clip.w);\n' +
                'gl_FragColor.w = depth;\n'+
                'gl_FragColor.z = fract(depth * (256.0 - 1.0));\n'+
                'gl_FragColor.y = fract(depth * (256.0 * 256.0 - 1.0));\n'+
                'gl_FragColor.x = fract(depth * (256.0 * 256.0 * 256.0 - 1.0));\n'+
                '}';
            var attribs = {
                a_position: cc3dEnums.SEMANTIC_POSITION,
                //a_uv: cc3dEnums.SEMANTIC_TEXCOORD0
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
        //this.setParameter('texture',this.texture);
        //this.setParameter('u_opacity', this.opacity);
        //if(this.hasAlphaTest()) {
        //    this.setParameter('alphaTestRef', this.alphaTest);
        //}
    },

});

cc3d.DepthMaterial = DepthMaterial;
