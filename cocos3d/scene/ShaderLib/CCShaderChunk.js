
'use strict';

var ShaderChunks = {};
ShaderChunks.commonAttributes = require('./commonAttributes');
ShaderChunks.commonUniforms = require('./commonUniforms');
ShaderChunks.commonVaryings = require('./commonVaryings');
ShaderChunks.lighting = require('./lightingBRDF') + require('./lighting');
ShaderChunks.gamma = require('./gamma');
//ShaderChunks.commonAttributes = require('./commonAttributes');

cc3d.ShaderChunks = ShaderChunks;
