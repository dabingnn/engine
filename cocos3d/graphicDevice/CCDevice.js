
require('./CCGraphicEnums');

'use strict';

var GraphicsDevice = function (canvas, options) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');
};
GraphicsDevice.prototype = {
    setViewport: function (x, y, width, height) {
        var gl = this.gl;
        gl.viewport(x, y, width, height);
    },
};
cc3d.graphics.GraphicsDevice = GraphicsDevice;
