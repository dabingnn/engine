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
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {

            var vertSrc, pixelSrc;
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
            this.shader = new cc3d.graphics.Shader(device, definition);
            //link it
            this.shader.link();
            cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('texture',this.texture);
    },

});

var BasicLambertMaterial = function() {
    this.texture = null;
    this.color = new cc3d.math.Vec3(1,1,1);
};

BasicLambertMaterial = cc3d.inherits(BasicLambertMaterial, cc3d.Material);

cc3d.extend( BasicLambertMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        var key = 'BasicLambertMaterial';
        key += '_directionalLight_' + scene._directionalLights.length;
        key += '_pointLight_' + scene._pointLights.length;
        key += '_spotLight_' + scene._spotLights.length;
        if(this.texture) {
            key += 'texture';
        }

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
            'v_position = (matrix_world * tranformedPos).xyz;\n' +
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
        pixelSrc += cc3d.ShaderChunks.gamma;
        pixelSrc += 'uniform sampler2D texture;\n';
        pixelSrc += 'uniform vec3 color;\n';
        pixelSrc += 'void main () {\n' +
            'vec4 texture_diffuse =' + (this.texture !== null ?  'toLinear(texture2D(texture, v_uv));\n' : 'vec4(1.0);') +
            'lighting(v_normal,v_position);\n' +
            'gl_FragColor.rgb = texture_diffuse.rgb * color * (totalDiffuseLight + totalAmbientLight);\n' +
            'gl_FragColor.a = texture_diffuse.a;\n' +
            'gl_FragColor = toGamma(gl_FragColor);\n' +
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
        cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
    },
    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {
            this._generateShader(device,scene);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('texture',this.texture);
        this.setParameter('color',this.color.data);
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
                'uniform mat4 matrix_worldviewprojection;' +
                'void main() {' +
                'gl_Position = matrix_worldviewprojection * a_position;' +
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

var BasicPhongMaterial = function() {
    this.texture = null;
    this.color = new cc3d.math.Vec3(1,1,1);
    this.specularColor = new cc3d.math.Vec3(1,1,1);
    this.shininess = 0.25;
};

BasicPhongMaterial = cc3d.inherits(BasicPhongMaterial, cc3d.Material);

cc3d.extend( BasicPhongMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        var key = 'BasicPhongMaterial';
        key += '_directionalLight_' + scene._directionalLights.length;
        key += '_pointLight_' + scene._pointLights.length;
        key += '_spotLight_' + scene._spotLights.length;
        if(this.texture) {
            key += 'texture';
        }

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
            'v_position = (matrix_world * tranformedPos).xyz;\n' +
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
        pixelSrc += '#define LIGHTING_PHONG\n';
        pixelSrc += cc3d.ShaderChunks.commonVaryings;
        pixelSrc += cc3d.ShaderChunks.lighting;
        pixelSrc += 'uniform sampler2D texture;\n';
        pixelSrc += 'uniform vec3 color;\n';
        pixelSrc += 'void main () {\n' +
            'vec4 albedo =' + (this.texture !== null ?  'texture2D(texture, v_uv);\n' : 'vec4(1.0);') +
            'lighting(v_normal,v_position);\n' +
            'gl_FragColor.rgb = albedo.rgb * color * (totalDiffuseLight + totalAmbientLight) + totalSpecularLight;\n' +
            'gl_FragColor.a = albedo.a;\n' +
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
        cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
    },
    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {
            this._generateShader(device,scene);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('texture',this.texture);
        this.setParameter('color',this.color.data);
        this.setParameter('u_material_specular',this.specularColor.data);
        this.setParameter('u_material_shininess',this.shininess);
    },

});

cc3d.BasicMaterial = BasicMaterial;
cc3d.BasicLambertMaterial = BasicLambertMaterial;
cc3d.BasicPhongMaterial = BasicPhongMaterial;
cc3d.ColorMaterial = ColorMaterial;
