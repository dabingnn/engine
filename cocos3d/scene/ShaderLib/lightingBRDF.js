module.exports = '' +
    '#define saturate(a) clamp( a, 0.0, 1.0 )\n' +
    'vec3 BRDF_BlinnPhong( in vec3 specularColor, in float shininess, in vec3 normal, in vec3 lightDir, in vec3 viewDir ) {\n' +
    'vec3 halfDir = normalize( lightDir + viewDir );\n' +
    'float dotNH = saturate( dot( normal, halfDir ) );\n' +
    'return specularColor * pow( dotNH, shininess );' +
    '}';