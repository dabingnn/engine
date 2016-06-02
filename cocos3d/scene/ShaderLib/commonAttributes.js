module.exports = '/**\n' +
    'including all of attributes used in vertex shader\n' +
    '*/\n' +
    '\n' +
    'attribute vec3 a_position;\n' +
    '\n' +
    '#ifdef USE_COLOR\n' +
    'attribute vec3 a_color;\n' +
    '#endif\n' +
    '\n' +
    '#ifdef USE_NORMAL\n' +
    'attribute vec3 a_normal;\n' +
    '#endif\n' +
    '\n' +
    '#ifdef USE_UV\n' +
    'attribute vec2 a_uv;\n' +
    '#endif\n' +
    '\n' +
    '#ifdef USE_UV2\n' +
    'attribute vec2 a_uv2;\n' +
    '#endif\n' +
    '\n';