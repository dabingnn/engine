
var packingsource = '';
packingsource += 'float unpackFloat(vec4 rgba) \n';
packingsource += '{\n';
packingsource += '    return dot( rgba, vec4(1.0 / (256.0 * 256.0 * 256.0 - 1.0), 1.0 / 65535.0, 1.0/255.0, 1.0) );\n';
packingsource += '}\n';

module.exports = packingsource +
    '/**\n' +
    'basic shadow sampling\n' +
    '*/\n' +
    'float shadowSampling(mat4 shadowMatrix, vec3 position, sampler2D shadowMap) {\n' +
    'vec4 shadowCoord = shadowMatrix * vec4(position, 1.0);\n' +
    'shadowCoord  = shadowCoord / shadowCoord.w;\n' +
    'shadowCoord.xy = shadowCoord.xy * 0.5 + 0.5;\n' +
    'float visible = 1.0;\n' +
    'float depth = unpackFloat(texture2D(shadowMap, shadowCoord.xy));' +
    'if(depth < (toLinearShadowDepth(shadowCoord.z) - 1.0 / (65536.0 * 10.0))) visible = 0.0;\n' +
    'return visible;' +
    '' +
    '}\n';