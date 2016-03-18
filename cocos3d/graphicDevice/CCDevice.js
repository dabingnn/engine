
require('./CCGraphicEnums');

'use strict';

var GraphicsDevice = function (canvas, options) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');
    this.indexBuffer = null;
    this.vertexBuffers = [];
    this.elements = {};
    this.boundShader = null;
    this.glType = [
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
        gl.FLOAT
    ];
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
        for(var i = 0; i< attributes.length; ++i) {
            var element = this.elements[attributes[i].name];
            if(element) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffers[element.stream].bufferId);
                gl.enableVertexAttribArray(attributes[i].locationId);
                gl.vertexAttribPointer(attributes[i].locationId,element.numComponents,this.glType[element.dataType],
                element.normalize, element.stride,element.offset);
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
