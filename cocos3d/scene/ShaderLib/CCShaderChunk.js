
'use strict';

var ShaderChunks = {};
ShaderChunks.commonAttributes = require('./commonAttributes');
ShaderChunks.commonUniforms = require('./commonUniforms');
ShaderChunks.commonVaryings = require('./commonVaryings');
ShaderChunks.lighting = require('./lighting');
//ShaderChunks.commonAttributes = require('./commonAttributes');

cc3d.ShaderChunks = ShaderChunks;
