module.exports = '' +
    '/**\n' +
    'directional lighting chunk\n' +
    'defines:\n' +
    'DIRECTIONAL_LIGHT_COUNT\n' +
    'uniforms:\n' +
    'u_directional_light_direction[DIRECTIONAL_LIGHT_COUNT]\n' +
    'u_directional_light_color[DIRECTIONAL_LIGHT_COUNT]\n' +
    '*/\n' +
    '/**\n' +
    'defines: \n' +
    'LIGHTING_PHONG\n' +
    'calculate specular lighting and diffuse light as phong models.\n' +
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
    'vec3 totalAmbientLight = vec3( 0.0 );\n' +
    '//uniforms for specular lighting\n' +
    'uniform vec3 u_camera_position;\n' +
    'uniform vec3 u_material_specular;\n' +
    'uniform float u_material_shininess;\n' +
    '//uniform for ambient\n' +
    'uniform vec3 u_scene_ambient;\n' +
    '\n' +
    '#define saturate(a) clamp( a, 0.0, 1.0 )\n' +
    'vec3 BlinnPhongSpecular( in vec3 specularColor, in float shininess, in vec3 normal, in vec3 lightDir, in vec3 viewDir ) {\n' +
    'vec3 halfDir = normalize( lightDir + viewDir );\n' +
    'float dotNH = saturate( dot( normal, halfDir ) );\n' +
    'return specularColor * pow( dotNH, shininess );' +
    '}\n' +
    'float getFalloffLinear(float dist, float lightRange)\n' +
    '{\n' +
    '\n' +
    'return max(((lightRange - dist) / lightRange), 0.0);\n' +
    '}\n' +
    '\n' +
    'void lighting(vec3 normal, vec3 position)\n' +
    '{\n' +
    'totalAmbientLight = u_scene_ambient;\n' +
    'float shininess = u_material_shininess;\n' +
    'vec3 specular = u_material_specular;\n' +
    'vec3 viewDir = normalize(u_camera_position - position);\n' +
    '#if DIRECTIONAL_LIGHT_COUNT>0\n' +
    'for(int lightIndex = 0; lightIndex < DIRECTIONAL_LIGHT_COUNT; ++lightIndex)\n' +
    '	{\n' +
    'vec3 lightDir = normalize(-u_directional_light_direction[lightIndex]);\n' +
    'vec3 lightColor = u_directional_light_color[lightIndex];\n' +
    'float ldotN = dot(normal, lightDir);\n' +
    '		ldotN = ldotN >=0.0 ? ldotN : 0.0;\n' +
    '		totalDiffuseLight += ldotN * lightColor;\n' +
    '#ifdef LIGHTING_PHONG\n' +
    'vec3 brdf = BlinnPhongSpecular( specular, shininess, normal, lightDir, viewDir );\n' +
    'totalSpecularLight += brdf * /*specularStrength **/ lightColor;\n' +
    '#endif\n' +
    '}\n' +
    '#endif\n' +
    '\n' +
    '#if POINT_LIGHT_COUNT>0\n' +
    'for(int lightIndex = 0; lightIndex < POINT_LIGHT_COUNT; ++lightIndex)\n' +
    '{\n' +
    'vec3 lightDir = u_point_light_position[lightIndex] - position;\n' +
    'float lightDist = length(lightDir);\n' +
    'lightDir = normalize(lightDir);\n' +
    'vec3 lightColor = u_point_light_color[lightIndex];' +
    'float ldotN = dot(normal, lightDir);\n' +
    '		ldotN = ldotN >=0.0 ? ldotN : 0.0;\n' +
    '		float falloff = getFalloffLinear(lightDist, u_point_light_range[lightIndex]);\n' +
    '		totalDiffuseLight += ldotN * falloff *lightColor;\n' +
    '#ifdef LIGHTING_PHONG\n' +
    'vec3 brdf = BlinnPhongSpecular( specular, shininess, normal, lightDir, viewDir );\n' +
    'totalSpecularLight += brdf  * lightColor * falloff;\n' +
    '#endif\n' +
    '	}\n' +
    '#endif\n' +
    '}';
