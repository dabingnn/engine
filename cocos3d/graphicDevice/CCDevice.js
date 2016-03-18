
require('./CCGraphicEnums');

'use strict';

var GraphicsDevice = function (canvas, options) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');
    this.indexBuffer = null;
    this.vertexBuffers = [];
    this.elements = {};
    this.boundShader = null;
    var gl = this.gl;
    var cc3dEnums = cc3d.graphics.Enums;
    this.glType = [
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
        gl.FLOAT
    ];

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


    draw: function(primitive) {
        var gl = this.gl;
        var attributes = this.boundShader.attributes;
        var uniforms = this.boundShader.uniforms;
        var samplers = this.boundShader.samplers;
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
            this.commitFunction[uniform.dataType](uniform.locationId,scopeId.value);
        }

        //apply textures
        var textureUnit = 0;
        for (i = 0, len = samplers.length; i < len; i++) {
            var sampler = samplers[i];
            var samplerValue = this.scope.resolve(sampler.name);
            if(!samplerValue) {
                continue;
            }
            if(samplerValue) {
                gl.uniform1i(sampler.locationId, textureUnit);
                gl.activeTexture(gl.TEXTURE0 + textureUnit);
                gl.bindTexture(gl.TEXTURE_2D,samplerValue.value);
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
            gl.drawElements(primitive.type, primitive.count,
                this.indexBuffer.glFormat, primitive.base * this.indexBuffer.bytesPerIndex);
        } else {
            gl.drawArrays(primitive.type,
                primitive.base,
                primitive.count);
        }
    }
};
cc3d.graphics.GraphicsDevice = GraphicsDevice;
