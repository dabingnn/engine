
require('./CCGraphicEnums');

'use strict';
var _pixelFormat2Size = null;
function gpuTexSize(gl, tex) {
    var cc3dEnums = cc3d.graphics.Enums;
    if (!_pixelFormat2Size) {
        _pixelFormat2Size = {};
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_A8] = 1;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_L8] = 1;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_L8_A8] = 1;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_R5_G6_B5] = 2;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_R5_G5_B5_A1] = 2;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_R4_G4_B4_A4] = 2;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_R8_G8_B8] = 4;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_R8_G8_B8_A8] = 4;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_RGB16F] = 8;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_RGBA16F] = 8;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_RGB32F] = 16;
        _pixelFormat2Size[cc3dEnums.PIXELFORMAT_RGBA32F] = 16;
    }

    var mips = 1;
    if (tex.autoMipmap || tex._minFilter===gl.NEAREST_MIPMAP_NEAREST ||
        tex._minFilter===gl.NEAREST_MIPMAP_LINEAR || tex._minFilter===gl.LINEAR_MIPMAP_NEAREST ||
        tex._minFilter===gl.LINEAR_MIPMAP_LINEAR) {
        mips = Math.round(Math.log2(Math.max(tex._width, tex._height)) + 1);
    }
    var mipWidth = tex._width;
    var mipHeight = tex._height;
    var size = 0;

    for(var i=0; i<mips; i++) {
        if (!tex._compressed) {
            size += mipWidth * mipHeight * _pixelFormat2Size[tex._format];
        } else if (tex._format===cc3dEnums.PIXELFORMAT_ETC1) {
            size += Math.floor((mipWidth + 3) / 4) * Math.floor((mipHeight + 3) / 4) * 8;
        } else if (tex._format===cc3dEnums.PIXELFORMAT_PVRTC_2BPP_RGB_1 || tex._format===cc3dEnums.PIXELFORMAT_PVRTC_2BPP_RGBA_1) {
            size += Math.max(mipWidth, 16) * Math.max(mipHeight, 8) / 4;
        } else if (tex._format===cc3dEnums.PIXELFORMAT_PVRTC_4BPP_RGB_1 || tex._format===cc3dEnums.PIXELFORMAT_PVRTC_4BPP_RGBA_1) {
            size += Math.max(mipWidth, 8) * Math.max(mipHeight, 8) / 2;
        } else {
            var DXT_BLOCK_WIDTH = 4;
            var DXT_BLOCK_HEIGHT = 4;
            var blockSize = tex._format===cc3dEnums.PIXELFORMAT_DXT1? 8 : 16;
            var numBlocksAcross = Math.floor((mipWidth + DXT_BLOCK_WIDTH - 1) / DXT_BLOCK_WIDTH);
            var numBlocksDown = Math.floor((mipHeight + DXT_BLOCK_HEIGHT - 1) / DXT_BLOCK_HEIGHT);
            var numBlocks = numBlocksAcross * numBlocksDown;
            size += numBlocks * blockSize;
        }
        mipWidth = Math.max(mipWidth * 0.5, 1);
        mipHeight = Math.max(mipHeight * 0.5, 1);
    }

    if (tex._cubemap) size *= 6;
    return size;
}

var GraphicsDevice = function (canvas, options) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');
    this.indexBuffer = null;
    this.vertexBuffers = [];
    this.elements = {};
    this.boundShader = null;
    var gl = this.gl;
    var cc3dEnums = cc3d.graphics.Enums;
    this.currentBlending = false;
    this.currentBlendEquation = cc3dEnums.BLENDEQUATION_ADD;
    this.currentBlendSrc = cc3dEnums.BLENDMODE_ONE;
    this.currentBlendDst = cc3dEnums.BLENDMODE_ZERO;
    this.glType = [
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
        gl.FLOAT
    ];

    this.glPrimitive = [
        gl.POINTS,
        gl.LINES,
        gl.LINE_LOOP,
        gl.LINE_STRIP,
        gl.TRIANGLES,
        gl.TRIANGLE_STRIP,
        gl.TRIANGLE_FAN
    ];

    this.glAddress = [
        gl.REPEAT,
        gl.CLAMP_TO_EDGE,
        gl.MIRRORED_REPEAT
    ];

    this.glBlendFunction = [
        gl.ZERO,
        gl.ONE,
        gl.SRC_COLOR,
        gl.ONE_MINUS_SRC_COLOR,
        gl.DST_COLOR,
        gl.ONE_MINUS_DST_COLOR,
        gl.SRC_ALPHA,
        gl.SRC_ALPHA_SATURATE,
        gl.ONE_MINUS_SRC_ALPHA,
        gl.DST_ALPHA,
        gl.ONE_MINUS_DST_ALPHA
    ];

    this.glBlendEquation = [
        gl.FUNC_ADD,
        gl.FUNC_SUBTRACT,
        gl.FUNC_REVERSE_SUBTRACT
    ];

    this.glFilter = [
        gl.NEAREST,
        gl.LINEAR,
        gl.NEAREST_MIPMAP_NEAREST,
        gl.NEAREST_MIPMAP_LINEAR,
        gl.LINEAR_MIPMAP_NEAREST,
        gl.LINEAR_MIPMAP_LINEAR
    ];
    this.renderTarget = null;
    this.scope = new cc3d.graphics.ScopeSpace('GraphicsDevice');
    //uniform commit function;
    this.commitFunction = {};
    this.commitFunction[cc3dEnums.UNIFORMTYPE_BOOL ] = function (locationId, value) { gl.uniform1i(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_INT  ] = function (locationId, value) { gl.uniform1i(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_FLOAT] = function (locationId, value) {
        if (typeof value == "number")
            gl.uniform1f(locationId, value);
        else
            gl.uniform1fv(locationId, value);
    };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_VEC2]  = function (locationId, value) { gl.uniform2fv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_VEC3]  = function (locationId, value) { gl.uniform3fv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_VEC4]  = function (locationId, value) { gl.uniform4fv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_IVEC2] = function (locationId, value) { gl.uniform2iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_BVEC2] = function (locationId, value) { gl.uniform2iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_IVEC3] = function (locationId, value) { gl.uniform3iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_BVEC3] = function (locationId, value) { gl.uniform3iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_IVEC4] = function (locationId, value) { gl.uniform4iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_BVEC4] = function (locationId, value) { gl.uniform4iv(locationId, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_MAT2]  = function (locationId, value) { gl.uniformMatrix2fv(locationId, false, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_MAT3]  = function (locationId, value) { gl.uniformMatrix3fv(locationId, false, value); };
    this.commitFunction[cc3dEnums.UNIFORMTYPE_MAT4]  = function (locationId, value) { gl.uniformMatrix4fv(locationId, false, value); };
    this.textureUnits = [];
    for (var i = 0; i < 16; i++) {
        this.textureUnits[i] = null;
    }
};

GraphicsDevice.prototype = {
    setViewport: function (x, y, width, height) {
        var gl = this.gl;
        gl.viewport(x, y, width, height);
    },

    setVertexBuffer: function(vertexBuffer, stream) {
        if(this.vertexBuffers[stream] !== vertexBuffer) {
            this.vertexBuffers[stream] = vertexBuffer;
            var elements = vertexBuffer.getFormat().elements;
            for(var i = 0; i < elements.length; ++i) {
                var element = elements[i];
                element.stream = stream;
                this.elements[element.name] = element;
            }
        }
    },

    setIndexBuffer: function(indexBuffer) {
        if (this.indexBuffer !== indexBuffer) {
            this.indexBuffer = indexBuffer;

            // Set the active index buffer object
            var gl = this.gl;
            gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer ? indexBuffer.bufferId : null);
        }
    },

    setShader: function(shader) {
        //if(shader !== this.boundShader)
        {
            this.boundShader = shader;
            if (! shader.ready)
                shader.link();
            this.gl.useProgram(shader.program);
        }
    },

    setRenderTarget: function(renderTarget) {
        this.renderTarget = renderTarget;
        var gl = this.gl;
        //build renderTarget if it is not ready
        if(renderTarget && !renderTarget.ready) {
            var fbo = renderTarget._frameBufferObject = gl.createFramebuffer();
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget._frameBufferObject);

            var colorBuffer = null;
            if(renderTarget._textureColorBuffer) {
                colorBuffer = new cc3d.graphics.Texture(device, {
                    format: cc3d.graphics.PIXELFORMAT_R8_G8_B8_A8,
                    width: renderTarget.width,
                    height: renderTarget.height,
                    autoMipmap: false
                });
                //colorBuffer = gl.createTexture();
                colorBuffer.magFilter = cc3d.graphics.Enums.FILTER_NEAREST;
                colorBuffer.minFilter = cc3d.graphics.Enums.FILTER_NEAREST;
                colorBuffer.addressU = cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE;
                colorBuffer.addressV = cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE;
                renderTarget._colorBuffer = colorBuffer;

                this.initializeTexture(colorBuffer);
                gl.bindTexture(gl.TEXTURE_2D, colorBuffer._glTextureId);
                //gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);

                gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,renderTarget.width, renderTarget.height,0,gl.RGBA, gl.UNSIGNED_BYTE,null);

                for (var i = 0; i < 16; i++) {
                    this.textureUnits[i] = null;
                }

                gl.framebufferTexture2D(gl.FRAMEBUFFER,
                    gl.COLOR_ATTACHMENT0,
                    gl.TEXTURE_2D,
                    colorBuffer._glTextureId,
                    0);
            } else {
                renderTarget._colorBuffer = colorBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER,colorBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.RGBA4, renderTarget.width, renderTarget.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);
                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.RENDERBUFFER, colorBuffer);
            }

            if(renderTarget._depth) {
                var depthBuffer = renderTarget._depthBuffer = gl.createRenderbuffer();
                gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer);
                gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, renderTarget.width, renderTarget.height);
                gl.bindRenderbuffer(gl.RENDERBUFFER, null);

                gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer);
            }

            renderTarget.ready = (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE);
        }

        if(renderTarget) {
            gl.bindFramebuffer(gl.FRAMEBUFFER, renderTarget._frameBufferObject);
            gl.viewport(0, 0, renderTarget.width, renderTarget.height);
        } else {
            gl.bindFramebuffer(gl.FRAMEBUFFER, null);
            gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    },

    getRenderTarget: function() {
        return this.renderTarget;
    },

    setTexture: function (texture, textureUnit) {
        var gl = this.gl;

        if (!texture._glTextureId) {
            this.initializeTexture(texture);
        }

        if (this.activeTexture !== textureUnit) {
            gl.activeTexture(gl.TEXTURE0 + textureUnit);
            this.activeTexture = textureUnit;
        }

        var target = texture._glTarget;
        if (this.textureUnits[textureUnit] !== texture) {
            gl.bindTexture(target, texture._glTextureId);
            this.textureUnits[textureUnit] = texture;
        }

        if (texture._minFilterDirty) {
            gl.texParameteri(target, gl.TEXTURE_MIN_FILTER, this.glFilter[texture._minFilter]);
            texture._minFilterDirty = false;
        }
        if (texture._magFilterDirty) {
            gl.texParameteri(target, gl.TEXTURE_MAG_FILTER, this.glFilter[texture._magFilter]);
            texture._magFilterDirty = false;
        }
        if (texture._addressUDirty) {
            gl.texParameteri(target, gl.TEXTURE_WRAP_S, this.glAddress[texture._addressU]);
            texture._addressUDirty = false;
        }
        if (texture._addressVDirty) {
            gl.texParameteri(target, gl.TEXTURE_WRAP_T, this.glAddress[texture._addressV]);
            texture._addressVDirty = false;
        }
        if (texture._anisotropyDirty) {
            var ext = this.extTextureFilterAnisotropic;
            if (ext) {
                var maxAnisotropy = this.maxAnisotropy;
                var anisotropy = texture.anisotropy;
                anisotropy = Math.min(anisotropy, maxAnisotropy);
                gl.texParameterf(target, ext.TEXTURE_MAX_ANISOTROPY_EXT, anisotropy);
            }
            texture._anisotropyDirty = false;
        }

        if (texture._needsUpload) {
            this.uploadTexture(texture);
            texture._needsUpload = false;
        }
    },

    initializeTexture: function (texture) {
        var gl = this.gl;
        var cc3dEnums = cc3d.graphics.Enums;
        texture._glTextureId = gl.createTexture();

        texture._glTarget = texture._cubemap ? gl.TEXTURE_CUBE_MAP : gl.TEXTURE_2D;

        switch (texture._format) {
            case cc3dEnums.PIXELFORMAT_A8:
                texture._glFormat = gl.ALPHA;
                texture._glInternalFormat = gl.ALPHA;
                texture._glPixelType = gl.UNSIGNED_BYTE;
                break;
            case cc3dEnums.PIXELFORMAT_L8:
                texture._glFormat = gl.LUMINANCE;
                texture._glInternalFormat = gl.LUMINANCE;
                texture._glPixelType = gl.UNSIGNED_BYTE;
                break;
            case cc3dEnums.PIXELFORMAT_L8_A8:
                texture._glFormat = gl.LUMINANCE_ALPHA;
                texture._glInternalFormat = gl.LUMINANCE_ALPHA;
                texture._glPixelType = gl.UNSIGNED_BYTE;
                break;
            case cc3dEnums.PIXELFORMAT_R5_G6_B5:
                texture._glFormat = gl.RGB;
                texture._glInternalFormat = gl.RGB;
                texture._glPixelType = gl.UNSIGNED_SHORT_5_6_5;
                break;
            case cc3dEnums.PIXELFORMAT_R5_G5_B5_A1:
                texture._glFormat = gl.RGBA;
                texture._glInternalFormat = gl.RGBA;
                texture._glPixelType = gl.UNSIGNED_SHORT_5_5_5_1;
                break;
            case cc3dEnums.PIXELFORMAT_R4_G4_B4_A4:
                texture._glFormat = gl.RGBA;
                texture._glInternalFormat = gl.RGBA;
                texture._glPixelType = gl.UNSIGNED_SHORT_4_4_4_4;
                break;
            case cc3dEnums.PIXELFORMAT_R8_G8_B8:
                texture._glFormat = gl.RGB;
                texture._glInternalFormat = gl.RGB;
                texture._glPixelType = gl.UNSIGNED_BYTE;
                break;
            case cc3dEnums.PIXELFORMAT_R8_G8_B8_A8:
                texture._glFormat = gl.RGBA;
                texture._glInternalFormat = gl.RGBA;
                texture._glPixelType = gl.UNSIGNED_BYTE;
                break;
            //case pc.PIXELFORMAT_DXT1:
            //    ext = this.extCompressedTextureS3TC;
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = ext.COMPRESSED_RGB_S3TC_DXT1_EXT;
            //    break;
            //case pc.PIXELFORMAT_DXT3:
            //    ext = this.extCompressedTextureS3TC;
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = ext.COMPRESSED_RGBA_S3TC_DXT3_EXT;
            //    break;
            //case pc.PIXELFORMAT_DXT5:
            //    ext = this.extCompressedTextureS3TC;
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = ext.COMPRESSED_RGBA_S3TC_DXT5_EXT;
            //    break;
            //case pc.PIXELFORMAT_ETC1:
            //    ext = this.extCompressedTextureETC1;
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = ext.COMPRESSED_RGB_ETC1_WEBGL;
            //    break;
            //case pc.PIXELFORMAT_PVRTC_2BPP_RGB_1:
            //    ext = this.extCompressedTexturePVRTC;
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = ext.COMPRESSED_RGB_PVRTC_2BPPV1_IMG;
            //    break;
            //case pc.PIXELFORMAT_PVRTC_2BPP_RGBA_1:
            //    ext = this.extCompressedTexturePVRTC;
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = ext.COMPRESSED_RGBA_PVRTC_2BPPV1_IMG;
            //    break;
            //case pc.PIXELFORMAT_PVRTC_4BPP_RGB_1:
            //    ext = this.extCompressedTexturePVRTC;
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = ext.COMPRESSED_RGB_PVRTC_4BPPV1_IMG;
            //    break;
            //case pc.PIXELFORMAT_PVRTC_4BPP_RGBA_1:
            //    ext = this.extCompressedTexturePVRTC;
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = ext.COMPRESSED_RGBA_PVRTC_4BPPV1_IMG;
            //    break;
            //case pc.PIXELFORMAT_RGB16F:
            //    ext = this.extTextureHalfFloat;
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = gl.RGB;
            //    texture._glPixelType = ext.HALF_FLOAT_OES;
            //    break;
            //case pc.PIXELFORMAT_RGBA16F:
            //    ext = this.extTextureHalfFloat;
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = gl.RGBA;
            //    texture._glPixelType = ext.HALF_FLOAT_OES;
            //    break;
            //case pc.PIXELFORMAT_RGB32F:
            //    texture._glFormat = gl.RGB;
            //    texture._glInternalFormat = gl.RGB;
            //    texture._glPixelType = gl.FLOAT;
            //    break;
            //case pc.PIXELFORMAT_RGBA32F:
            //    texture._glFormat = gl.RGBA;
            //    texture._glInternalFormat = gl.RGBA;
            //    texture._glPixelType = gl.FLOAT;
            //    break;
        }
    },

    getBlending: function() {
        return this.currentBlending;
    },

    setBlending: function(blending) {
        if(this.currentBlending !== blending) {
            blending = !!blending;
            var gl = this.gl;
            if(blending) {
                gl.enable(gl.BLEND);
            } else {
                gl.disable(gl.BLEND);
            }

            this.currentBlending = blending;
        }
    },

    setBlendFunction: function (blendSrc, blendDst) {
        if(blendDst === undefined) {
            blendDst = blendSrc.blendDst;
            blendSrc = blendSrc.blendSrc;
        }
        if ((this.currentBlendSrc !== blendSrc) || (this.currentBlendDst !== blendDst)) {
            this.gl.blendFunc(this.glBlendFunction[blendSrc], this.glBlendFunction[blendDst]);
            this.currentBlendSrc = blendSrc;
            this.currentBlendDst = blendDst;
        }
    },

    setBlendEquation: function (blendEquation) {
        if (this.currentBlendEquation !== blendEquation) {
            var gl = this.gl;
            gl.blendEquation(this.glBlendEquation[blendEquation]);
            this.currentBlendEquation = blendEquation;
        }
    },

    uploadTexture: function (texture) {
        var gl = this.gl;

        var mipLevel = 0;
        var mipObject;
        var resMult;

        while (texture._levels[mipLevel] || mipLevel === 0) { // Upload all existing mip levels. Initialize 0 mip anyway.
            mipObject = texture._levels[mipLevel];

            if (mipLevel == 1 && ! texture._compressed) {
                // We have more than one mip levels we want to assign, but we need all mips to make
                // the texture complete. Therefore first generate all mip chain from 0, then assign custom mips.
                gl.generateMipmap(texture._glTarget);
            }

            if (texture._cubemap) {
                var face;

                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                if ((mipObject[0] instanceof HTMLCanvasElement) || (mipObject[0] instanceof HTMLImageElement) || (mipObject[0] instanceof HTMLVideoElement)) {
                    // Upload the image, canvas or video
                    for (face = 0; face < 6; face++) {
                        if (! texture._levelsUpdated[0][face])
                            continue;

                        var src = mipObject[face];
                        // Downsize images that are too large to be used as cube maps
                        if (src instanceof HTMLImageElement) {
                            if (src.width > this.maxCubeMapSize || src.height > this.maxCubeMapSize) {
                                src = _downsampleImage(src, this.maxCubeMapSize);
                                if (mipLevel===0) {
                                    texture.width = src.width;
                                    texture.height = src.height;
                                }
                            }
                        }

                        gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                            mipLevel,
                            texture._glInternalFormat,
                            texture._glFormat,
                            texture._glPixelType,
                            src);
                    }
                } else {
                    // Upload the byte array
                    resMult = 1 / Math.pow(2, mipLevel);
                    for (face = 0; face < 6; face++) {
                        if (! texture._levelsUpdated[0][face])
                            continue;

                        var texData = mipObject[face];
                        if (texture._compressed) {
                            gl.compressedTexImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                                mipLevel,
                                texture._glInternalFormat,
                                Math.max(texture._width * resMult, 1),
                                Math.max(texture._height * resMult, 1),
                                0,
                                texData);
                        } else {
                            gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X + face,
                                mipLevel,
                                texture._glInternalFormat,
                                Math.max(texture._width * resMult, 1),
                                Math.max(texture._height * resMult, 1),
                                0,
                                texture._glFormat,
                                texture._glPixelType,
                                texData);
                        }
                    }
                }
            } else {
                if ((mipObject instanceof HTMLCanvasElement) || (mipObject instanceof HTMLImageElement) || (mipObject instanceof HTMLVideoElement)) {
                    // Downsize images that are too large to be used as textures
                    if (mipObject instanceof HTMLImageElement) {
                        if (mipObject.width > this.maxTextureSize || mipObject.height > this.maxTextureSize) {
                            mipObject = _downsampleImage(mipObject, this.maxTextureSize);
                            if (mipLevel===0) {
                                texture.width = mipObject.width;
                                texture.height = mipObject.height;
                            }
                        }
                    }

                    // Upload the image, canvas or video
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                    gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
                    gl.texImage2D(gl.TEXTURE_2D,
                        mipLevel,
                        texture._glInternalFormat,
                        texture._glFormat,
                        texture._glPixelType,
                        mipObject);
                } else {
                    // Upload the byte array
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
                    resMult = 1 / Math.pow(2, mipLevel);
                    if (texture._compressed) {
                        gl.compressedTexImage2D(gl.TEXTURE_2D,
                            mipLevel,
                            texture._glInternalFormat,
                            Math.max(texture._width * resMult, 1),
                            Math.max(texture._height * resMult, 1),
                            0,
                            mipObject);
                    } else {
                        gl.texImage2D(gl.TEXTURE_2D,
                            mipLevel,
                            texture._glInternalFormat,
                            Math.max(texture._width * resMult, 1),
                            Math.max(texture._height * resMult, 1),
                            0,
                            texture._glFormat,
                            texture._glPixelType,
                            mipObject);
                    }
                }
            }
            mipLevel++;
        }

        if (texture._cubemap) {
            for(var i = 0; i < 6; i++)
                texture._levelsUpdated[0][i] = false;
        } else {
            texture._levelsUpdated[0] = false;
        }

        if (texture.autoMipmap && cc3d.math.powerOfTwo(texture._width) && cc3d.math.powerOfTwo(texture._height) && texture._levels.length === 1 && !texture._compressed) {
            gl.generateMipmap(texture._glTarget);
        }

        //if (texture._gpuSize) this._vram.tex -= texture._gpuSize;
        texture._gpuSize = gpuTexSize(gl, texture);
        //this._vram.tex += texture._gpuSize;
    },

    draw: function(primitive) {
        var gl = this.gl;
        var attributes = this.boundShader.attributes;
        var uniforms = this.boundShader.uniforms;
        var samplers = this.boundShader.samplers;
        for(var i = 0; i < 8; ++i) {
            gl.disableVertexAttribArray(i);
        }
        for(var i = 0, len = attributes.length; i< len; ++i) {
            var element = this.elements[attributes[i].name];
            if(element) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[element.stream].bufferId);
                gl.enableVertexAttribArray(attributes[i].locationId);
                gl.vertexAttribPointer(attributes[i].locationId,element.numComponents,this.glType[element.dataType],
                element.normalize, element.stride,element.offset);
            }
        }

        //apply uniforms
        for(i = 0, len = uniforms.length; i< uniforms.length; ++i) {
            var uniform = uniforms[i];
            var scopeId = this.scope.resolve(uniform.name);
            if(scopeId.value)
                this.commitFunction[uniform.dataType](uniform.locationId,scopeId.value);
        }

        //apply textures
        var textureUnit = 0;
        for (i = 0, len = samplers.length; i < len; i++) {
            var sampler = samplers[i];
            var samplerValue = this.scope.resolve(sampler.name).value;
            if(!samplerValue) {
                continue;
            }
            if(samplerValue) {
                this.setTexture(samplerValue,textureUnit);
                gl.uniform1i(sampler.locationId, textureUnit);
                //gl.activeTexture(gl.TEXTURE0 + textureUnit);
                //gl.bindTexture(gl.TEXTURE_2D,samplerValue.value);
                textureUnit++;
            } else {
                console.log('sampler array is not supported yet!');
            }
        }
        //draw
        //{
        //    type:
        //    indexed: false
        //    base:
        //    count:
        //};

        if(primitive.indexed) {
            gl.drawElements(this.glPrimitive[primitive.type], primitive.count,
                this.indexBuffer.glFormat, primitive.base * this.indexBuffer.bytesPerIndex);
        } else {
            gl.drawArrays(this.glPrimitive[primitive.type],
                primitive.base,
                primitive.count);
        }
    }
};
cc3d.graphics.GraphicsDevice = GraphicsDevice;
