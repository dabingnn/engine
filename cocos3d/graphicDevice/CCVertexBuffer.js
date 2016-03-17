
require('./CCGraphicEnums');

'use strict';

var VertexBuffer = function (format, numVertices, usage, initialData) {
    // Initialize optional parameters
    // By default, vertex buffers are static (better for performance since buffer data can be cached in VRAM)
    this.usage = usage || cc3d.graphics.Enums.BUFFER_STATIC;

    // Store the vertex format
    this.format = format;

    // Store the number of vertices
    this.numVertices = numVertices;

    // Calculate the size
    this.numBytes = format.size * numVertices;
    //graphicsDevice._vram.vb += this.numBytes;

    // Create the WebGL vertex buffer object
    //this.device = graphicsDevice;
    this.device = {};
    this.device.gl = cc._renderContext;
    var gl = this.device.gl;
    this.bufferId = gl.createBuffer();

    // Allocate the storage
    if (initialData && this.setData(initialData)) {
        return;
    } else {
        this.storage = new ArrayBuffer(this.numBytes);
    }
};

VertexBuffer.prototype = {

    destroy: function () {
        var gl = this.device.gl;
        gl.deleteBuffer(this.bufferId);
        //this.device._vram.vb -= this.storage.byteLength;
    },

    getFormat: function () {
        return this.format;
    },

    getUsage: function () {
        return this.usage;
    },

    getNumVertices: function () {
        return this.numVertices;
    },

    lock: function () {
        return this.storage;
    },

    unlock: function () {
        // Upload the new vertex data
        var gl = this.device.gl;
        var glUsage;
        switch (this.usage) {
            case cc3d.graphics.Enums.BUFFER_STATIC:
                glUsage = gl.STATIC_DRAW;
                break;
            case cc3d.graphics.Enums.BUFFER_DYNAMIC:
                glUsage = gl.DYNAMIC_DRAW;
                break;
            case cc3d.graphics.Enums.BUFFER_STREAM:
                glUsage = gl.STREAM_DRAW;
                break;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.bufferId);
        gl.bufferData(gl.ARRAY_BUFFER, this.storage, glUsage);
    },

    setData: function (data) {
        if (data.byteLength!==this.numBytes) {
            console.error("VertexBuffer: wrong initial data size: expected " + this.numBytes + ", got " + data.byteLength);
            return false;
        }
        this.storage = data;
        this.unlock();
        return true;
    }
};

cc3d.graphics.VertexBuffer = VertexBuffer;
