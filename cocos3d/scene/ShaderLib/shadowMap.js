module.exports = '/**\n' +
    'basic shadow sampling\n' +
    '*/\n' +
    'float shadowSampling(mat4 shadowMatrix, vec3 position, sampler2D shadowMap) {\n' +
    'vec4 shadowCoord = shadowMatrix * vec4(position, 1.0);\n' +
    'float visible = 1.0;\n' +
    'if(texture2D(shadowMap, shadowCoord.xy).z < shadowCoord.z) visible = 0.0;\n' +
    'return visible;' +
    '' +
    '}\n';
