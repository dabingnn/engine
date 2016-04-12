module.exports = '' +
  'const float gamma = 2.2;\n' +
  'vec3 toLinear(vec3 v) {\n' +
  '  return pow(v, vec3(gamma));\n' +
  '}\n' +
  'vec4 toLinear(vec4 v) {\n' +
  '  return vec4(toLinear(v.rgb), v.a);\n' +
  '}\n' +
  'vec3 toGamma(vec3 v) {\n' +
  '  return pow(v, vec3(1.0 / gamma));\n' +
  '}\n' +
  'vec4 toGamma(vec4 v) {\n' +
  '  return vec4(toGamma(v.rgb), v.a);\n' +
  '}\n' +
  '';
