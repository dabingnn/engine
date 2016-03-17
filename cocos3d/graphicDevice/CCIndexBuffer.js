require('./CCGraphicEnums');

'use strict';

var IndexBuffer = function (format, numIndices, usage) {
    // Initialize optional parameters
    // By default, index buffers are static (better for performance since buffer data can be cached in VRAM)
    this.usage = usage || cc3d.graphics.Enums.BUFFER_STATIC;

    // Store the index format
    this.format = format;

    // Store the number of indices
    this.numIndices = numIndices;

    // Create the WebGL buffer
    this.device = {};
    this.device.gl = cc._renderContext;
    var gl = this.device.gl;
    this.bufferId = gl.createBuffer();

    // Allocate the storage
    var bytesPerIndex;
    if (format === cc3d.graphics.Enums.INDEXFORMAT_UINT8) {
        bytesPerIndex = 1;
        this.glFormat = gl.UNSIGNED_BYTE;
    } else if (format === cc3d.graphics.Enums.INDEXFORMAT_UINT16) {
        bytesPerIndex = 2;
        this.glFormat = gl.UNSIGNED_SHORT;
    } else if (format === cc3d.graphics.Enums.INDEXFORMAT_UINT32) {
        bytesPerIndex = 4;
        this.glFormat = gl.UNSIGNED_INT;
    }
    this.bytesPerIndex = bytesPerIndex;

    var numBytes = this.numIndices * bytesPerIndex;
    this.storage = new ArrayBuffer(numBytes);

    //graphicsDevice._vram.ib += numBytes;
};

IndexBuffer.prototype = {

    destroy: function () {
        var gl = this.device.gl;
        gl.deleteBuffer(this.bufferId);
        //this.device._vram.ib -= this.storage.byteLength;
    },

    getFormat: function () {
        return this.format;
    },

    getNumIndices: function () {
        return this.numIndices;
    },

    lock: function () {
        return this.storage;
    },

    unlock: function () {
        // Upload the new index data
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

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.bufferId);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, this.storage, glUsage);
    }
};

cc3d.graphics.IndexBuffer = IndexBuffer;
