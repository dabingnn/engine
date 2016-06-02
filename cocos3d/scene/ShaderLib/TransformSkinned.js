var skinSource = 'attribute vec4 a_skinIndex;\n' +
    'attribute vec4 a_skinWeight;\n' +
    '#define BONE_COUNT 50\n' +
    'uniform mat4 matrix_skin[BONE_COUNT];\n' +
    'mat4 getSkinMatrix(vec4 skinIndex, vec4 skinWeight) {\n' +
    'return skinWeight.x * matrix_skin[int(skinIndex.x)] + \n' +
    'skinWeight.y * matrix_skin[int(skinIndex.y)] + \n' +
    'skinWeight.z * matrix_skin[int(skinIndex.z)] + \n' +
    'skinWeight.w * matrix_skin[int(skinIndex.w)];\n' +
    '}\n';
skinSource += 'vec4 getTransformedPos(vec4 position) { \n';
skinSource += ' return getSkinMatrix(a_skinIndex, a_skinWeight) * position;\n';
skinSource += '} \n';
module.exports = skinSource;
