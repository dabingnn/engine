
'use strict';

var ShaderChunks = {};
ShaderChunks.commonAttributes = require('./commonAttributes');
ShaderChunks.commonUniforms = require('./commonUniforms');
ShaderChunks.commonVaryings = require('./commonVaryings');
ShaderChunks.lighting = require('./lighting');
ShaderChunks.gamma = require('./gamma');
ShaderChunks.transform = require('./transform');
ShaderChunks.transformSkinned = require('./transformSkinned');
ShaderChunks.linearShadowDepth = require('./linearShadowDepth');
ShaderChunks.shadowMap = ShaderChunks.linearShadowDepth + require('./shadowMap');
cc3d.ShaderChunks = ShaderChunks;
