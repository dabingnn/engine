
'use strict';

var defaultOptions = {
    depth: true,
    face: 0
};

var RenderTarget = function (graphicsDevice, width, height, options) {
    this._device = graphicsDevice;

    // Process optional arguments
    options = (options !== undefined) ? options : defaultOptions;
    this._face = (options.face !== undefined) ? options.face : 0;
    this._depth = (options.depth !== undefined) ? options.depth : true;
    this.ready = false;
    this._width = width;
    this._height = height;
    this._textureColorBuffer = !!options.textureColorBuffer;
    //openGL handle
    this._colorBuffer = null;
    this._depthBuffer = null;
    this._frameBufferObject = null;
};

RenderTarget.prototype = {
    destroy: function () {
        var gl = this._device.gl;
        gl.deleteFramebuffer(this._frameBuffer);
        if (this._depthBuffer) {
            gl.deleteRenderbuffer(this._depthBuffer);
        }
    }
};

Object.defineProperty(RenderTarget.prototype, 'colorBuffer', {
    get: function() { return this._colorBuffer; }
});

Object.defineProperty(RenderTarget.prototype, 'face', {
    get: function() { return this._face; },
});

Object.defineProperty(RenderTarget.prototype, 'width', {
    get: function() { return this._width; }
});

Object.defineProperty(RenderTarget.prototype, 'height', {
    get: function() { return this._height; }
});

cc3d.graphics.RenderTarget = RenderTarget;