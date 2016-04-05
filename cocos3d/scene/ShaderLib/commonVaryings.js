module.exports = '/**\n' +
    'common varying used\n' +
    '*/\n' +
    '#ifdef VARYING_POSITION\n' +
    'varying vec3 v_position; //pos in view\n' +
    '#endif\n' +
    '\n' +
    '#ifdef VARYING_COLOR\n' +
    'varying vec3 v_color;\n' +
    '#endif\n' +
    '\n' +
    '#ifdef VARYING_NORMAL\n' +
    'varying vec3 v_normal; //normal in view\n' +
    '#endif\n' +
    '\n' +
    '#ifdef VARYING_UV\n' +
    'varying vec2 v_uv;\n' +
    '#endif\n' +
    '\n' +
    '#ifdef VARYING_UV1\n' +
    'varying vec2 v_uv1;\n' +
    '#endif\n';
