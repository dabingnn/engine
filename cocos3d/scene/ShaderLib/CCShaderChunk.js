
'use strict';

var ShaderChunks = {};
ShaderChunks.commonAttributes = require('./commonAttributes');
ShaderChunks.commonUniforms = require('./commonUniforms');
ShaderChunks.commonVaryings = require('./commonVaryings');
ShaderChunks.lighting = require('./lighting');
ShaderChunks.gamma = require('./gamma');
ShaderChunks.shadowMap = require('./shadowMap');
ShaderChunks.skin = require('./skin');

cc3d.ShaderChunks = ShaderChunks;
