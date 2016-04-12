module.exports = '' +
    'vec3 F_Schlick( in vec3 specularColor, in float dotLH ) {\n' +
    'float fresnel = exp2( ( -5.55437 * dotLH - 6.98316 ) * dotLH );\n' +
    'return ( 1.0 - specularColor ) * fresnel + specularColor;\n' +
    '}\n' +
    '\n' +
    'float G_BlinnPhong_Implicit( /* in float dotNL, in float dotNV */ ) {\n' +
    '// geometry term is (n⋅l)(n⋅v) / 4(n⋅l)(n⋅v)\n' +
    'return 0.25;\n' +
    '}\n' +
    '\n' +
    'float D_BlinnPhong( in float shininess, in float dotNH ) {\n' +
    '// factor of 1/PI in distribution term omitted\n' +
    'return ( shininess * 0.5 + 1.0 ) * pow( dotNH, shininess );\n' +
    '}\n' +
    '\n' +
    'vec3 BRDF_BlinnPhong( in vec3 specularColor, in float shininess, in vec3 normal, in vec3 lightDir, in vec3 viewDir ) {\n' +
    'vec3 halfDir = normalize( lightDir + viewDir );\n' +
    'float dotNH = saturate( dot( normal, halfDir ) );\n' +
    'float dotLH = saturate( dot( lightDir, halfDir ) );\n' +
    'vec3 F = F_Schlick( specularColor, dotLH );\n' +
    'float G = G_BlinnPhong_Implicit( /* dotNL, dotNV */ );\n' +
    'float D = D_BlinnPhong( shininess, dotNH );\n' +
    'return F * G * D;\n\n' +
    '}';