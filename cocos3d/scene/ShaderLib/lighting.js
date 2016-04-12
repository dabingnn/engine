module.exports = '' +
    '/**\n' +
    'directional lighting chunk\n' +
    'defines:\n' +
    'DIRECTIONAL_LIGHT_COUNT\n' +
    'uniforms:\n' +
    'u_directional_light_direction[DIRECTIONAL_LIGHT_COUNT]\n' +
    'u_directional_light_color[DIRECTIONAL_LIGHT_COUNT]\n' +
    '*/\n' +
    '\n' +
    '#if DIRECTIONAL_LIGHT_COUNT>0\n' +
    'uniform vec3 u_directional_light_direction[DIRECTIONAL_LIGHT_COUNT];\n' +
    'uniform vec3 u_directional_light_color[DIRECTIONAL_LIGHT_COUNT];\n' +
    '#endif\n' +
    '\n' +
    '#if POINT_LIGHT_COUNT>0\n' +
    'uniform vec3 u_point_light_position[POINT_LIGHT_COUNT];\n' +
    'uniform vec3 u_point_light_color[POINT_LIGHT_COUNT];\n' +
    'uniform float u_point_light_range[POINT_LIGHT_COUNT];\n' +
    '#endif\n' +
    'vec3 totalDiffuseLight = vec3( 0.0 );\n' +
    'vec3 totalSpecularLight = vec3( 0.0 );\n' +
    '\n' +
    'float getFalloffLinear(float dist, float lightRange)\n' +
    '{\n' +
    'return max(((lightRange - dist) / lightRange), 0.0);\n' +
    '}\n' +
    '\n' +
    'void lighting(vec3 normal, vec3 position)\n' +
    '{\n' +
    '#if DIRECTIONAL_LIGHT_COUNT>0\n' +
    'for(int lightIndex = 0; lightIndex < DIRECTIONAL_LIGHT_COUNT; ++lightIndex)\n' +
    '	{\n' +
    'float ldotN = dot(normal, -u_directional_light_direction[lightIndex]);\n' +
    '		ldotN = ldotN >=0.0 ? ldotN : 0.0;\n' +
    '		totalDiffuseLight += ldotN * u_directional_light_color[lightIndex];\n' +
    '}\n' +
    '#endif\n' +
    '\n' +
    '#if POINT_LIGHT_COUNT>0\n' +
    'for(int lightIndex = 0; lightIndex < POINT_LIGHT_COUNT; ++lightIndex)\n' +
    '{\n' +
    'vec3 lightV = u_point_light_position[lightIndex] - position;\n' +
    'float ldotN = dot(normal, normalize(lightV));\n' +
    '		ldotN = ldotN >=0.0 ? ldotN : 0.0;\n' +
    '		float falloff = getFalloffLinear(length(lightV), u_point_light_range[lightIndex]);\n' +
    '		totalDiffuseLight += ldotN * falloff *u_point_light_color[lightIndex];\n' +
    '	}\n' +
    '#endif\n' +
    '}';
