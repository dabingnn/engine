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
                'uniform mat4 matrix_worldviewprojection;' +
                'varying vec2 v_uv;' +
                'void main() {' +
                'gl_Position = matrix_worldviewprojection * a_position;' +
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

var BasicPhongMaterial = function() {
    this.texture = null;
    this.color = new cc3d.math.Vec3(1,1,1);
    this.specularColor = new cc3d.math.Vec3(1,1,1);
    this.shininess = 0.25;
    this.opacity = 1.0;
    this.useLambertLighting = false;
};

BasicPhongMaterial = cc3d.inherits(BasicPhongMaterial, cc3d.Material);

cc3d.extend( BasicPhongMaterial.prototype, {
    _generateShaderKey: function (device, scene, objDefs) {
        var skinned = (objDefs && objDefs.skinned) || false;
        var key = 'BasicMaterial';
        if(skinned){
            key += '_skinned';
        }
        key += this.useLambertLighting ? '_Lambert' : '_BlinnPhong';
        key += '_directionalLight_' + scene._directionalLights.length;
        key += '_pointLight_' + scene._pointLights.length;
        key += '_spotLight_' + scene._spotLights.length;
        if(this.texture) {
            key += '_texture';
        }

        if(this.hasAlphaTest()) {
            key += '_alphaTest';
        }

        return key;
    },

    _generateShader : function(device, scene,objDefs) {
        //todo: add skinned setting here
        var skinned = (objDefs && objDefs.skinned) || false;
        var vertSrc,pixelSrc;
        //todo add define here
        vertSrc = '\n';
        vertSrc += '#define VARYING_POSITION\n';
        vertSrc += '#define VARYING_NORMAL\n';
        vertSrc += '#define VARYING_UV\n';

        vertSrc += '#define USE_UV\n';
        vertSrc += '#define USE_NORMAL\n';
        if(skinned) {
            vertSrc += '#define USE_SKIN\n';
        }

        vertSrc += cc3d.ShaderChunks.commonUniforms;
        vertSrc += cc3d.ShaderChunks.commonAttributes;
        vertSrc += cc3d.ShaderChunks.commonVaryings;
        if(skinned) {
            vertSrc += cc3d.ShaderChunks.skin;
        }
        vertSrc += 'void main() {\n';
        if(skinned) {
            vertSrc += 'mat4 skinMatrix = getSkinMatrix(a_skinIndex, a_skinWeight);\n';
            vertSrc += 'vec4 tranformedPos = skinMatrix * vec4(a_position, 1.0);\n';
        } else {
            vertSrc += 'vec4 tranformedPos = vec4(a_position, 1.0);\n';
        }
        vertSrc += 'gl_Position = matrix_worldviewprojection * tranformedPos;\n' +
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
        pixelSrc += '#define LIGHTING_SHADOW\n';
        pixelSrc += cc3d.ShaderChunks.commonVaryings;
        pixelSrc += cc3d.ShaderChunks.lighting;
        pixelSrc += cc3d.ShaderChunks.gamma;

        //begin of material computing

        if(this.hasAlphaTest()) {
            pixelSrc += 'uniform float alphaTestRef;';
        }

        pixelSrc += 'uniform sampler2D u_texture;\n';
        pixelSrc += 'uniform vec3 u_color;\n' ;
        pixelSrc += 'uniform vec3 u_specular;\n' ;
        pixelSrc += 'uniform float u_shininess;\n' ;
        pixelSrc += 'uniform float u_opacity;\n' ;
        pixelSrc += 'PhongMaterial material;\n';
        pixelSrc += 'void getPhongMaterial() {\n';
        if(this.texture !==null) {
            pixelSrc += 'vec4 albedo = texture2D(u_texture, v_uv);\n ' +
                'material.albedo = albedo.rgb; \n ' +
                'material.opacity = albedo.a;\n';
        } else {
            pixelSrc += 'material.albedo = u_color;\n ' +
                'material.opacity = 1.0;\n';
        }

        pixelSrc += 'material.specular = u_specular;\n';
        pixelSrc += 'material.opacity = material.opacity * u_opacity;\n';
        pixelSrc += 'material.shininess = u_shininess;\n';
        pixelSrc += '}\n';

        pixelSrc += cc3d.ShaderChunks.shadowMap;
        //end of material computing

        //shadow map uniforms
        for(var index = 0; index < scene._directionalLights.length; ++index) {
            //
            var light = scene._directionalLights[index];
            if(light._castShadows) {
                //todo add uniforms here
                pixelSrc += 'uniform mat4 shadowMatrix_directional' + index + ';\n';
                pixelSrc += 'uniform sampler2D shadowTexture_directional' + index + ';\n';
            }
        }

        //for(var index = 0; index < scene._directionalLights.length; ++index) {
        //    //
        //}

        //end shadow map

        pixelSrc += 'void main () {\n' +
            'getPhongMaterial();';
        //shadow map
        for(var index = 0; index < scene._directionalLights.length; ++index) {
            //
            var light = scene._directionalLights[index];
            if(light._castShadows) {
                //float shadowSampling(mat4 shadowMatrix, vec3 position, sampler2D shadowMap)
                pixelSrc += 'shadow_directional[' + index + ']' + '= \n' +
                    'shadowSampling( shadowMatrix_directional' + index + ', v_position, shadowTexture_directional' + index + ');\n';
            } else {
                pixelSrc += 'shadow_directional[' + index + ']' + '= 0.0;\n';
            }
        }

        for(var index = 0; index < scene._pointLights.length; ++index) {
            //
            pixelSrc += 'shadow_point[' + index + ']' + '= 1.0;\n';
        }

        //end shadow map

        if(this.hasAlphaTest()) {
            pixelSrc += 'if(material.opacity < alphaTestRef * u_opacity) discard;';
        }

        pixelSrc += 'material.albedo = toLinear(material.albedo);\n';
        if(this.useLambertLighting) {
            pixelSrc += 'gl_FragColor.rgb = lightingLambert(v_normal,v_position, material);\n';
        } else {
            pixelSrc += 'gl_FragColor.rgb = lightingBlinnPhong(v_normal,v_position, material);\n';
        }

        pixelSrc += 'gl_FragColor.a = material.opacity;\n';

        pixelSrc += 'gl_FragColor = toGamma(gl_FragColor);\n';

        pixelSrc += '}';
        var attribs = {
            a_position: cc3dEnums.SEMANTIC_POSITION,
            a_uv: cc3dEnums.SEMANTIC_TEXCOORD0,
            a_normal: cc3dEnums.SEMANTIC_NORMAL
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
        this.shader = new cc3d.graphics.Shader(device,definition);
        this.shader.link();
        cc3d.ShaderLibs.addShader(this.shaderKey, this.shader);
    },
    updateShader: function (device, scene, objDefs) {
        var key = this._generateShaderKey(device, scene, objDefs);
        if(key === this.shaderKey) return;
        this.shaderKey = key;
        var shader = cc3d.ShaderLibs.getShaderByKey(key);
        if(shader) {
            this.shader = shader;
        } else {
            this._generateShader(device,scene, objDefs);
        }
        this._generateRenderKey();
    },

    update: function() {
        this.setParameter('u_texture',this.texture);
        this.setParameter('u_color',this.color.data);
        this.setParameter('u_specular',this.specularColor.data);
        this.setParameter('u_shininess',this.shininess);
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

var DepthMaterial = function() {
    //this.texture = null;
    //this.opacity = 1.0;
};

DepthMaterial = cc3d.inherits(DepthMaterial, cc3d.Material);

cc3d.extend( DepthMaterial.prototype, {
    _generateShaderKey: function (device, scene) {
        var key = 'DepthMaterialShader';
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
                'attribute vec4 a_position;\n' +
                'uniform mat4 matrix_worldviewprojection;\n' +
                'varying vec4 v_position_clip;\n' +
                'void main() {\n' +
                ' v_position_clip = matrix_worldviewprojection * a_position;\n' +
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
            pixelSrc += 'void main() {\n';
            pixelSrc += '//vec3 depth = gl_FragCoord.zzz/1000.0;\n' +
                'float depth = v_position_clip.z / v_position_clip.w * 0.5 + 0.5;\n' +
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

cc3d.BasicMaterial = BasicMaterial;
cc3d.BasicPhongMaterial = BasicPhongMaterial;
cc3d.ColorMaterial = ColorMaterial;
cc3d.DepthMaterial = DepthMaterial;
