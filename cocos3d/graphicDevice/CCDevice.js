
require('./CCGraphicEnums');

'use strict';

var GraphicsDevice = function (canvas, options) {
    this.canvas = canvas;
    this.gl = this.canvas.getContext('webgl');
};

cc3d.graphics.GraphicsDevice = GraphicsDevice;
