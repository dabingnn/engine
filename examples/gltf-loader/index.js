'use strict';

window.gltf = {
    resl: require('./resl'),

    typeToCompnents: function (bufferType) {
        if ( bufferType === 'SCALAR' ) {
            return 1;
        } else if ( bufferType === 'VEC2' ) {
            return 2;
        } else if ( bufferType === 'VEC3' ) {
            return 3;
        } else if ( bufferType === 'VEC4' ) {
            return 4;
        } else if ( bufferType === 'MAT2' ) {
            return 4;
        } else if ( bufferType === 'MAT3' ) {
            return 9;
        } else if ( bufferType === 'MAT4' ) {
            return 16;
        }
    },

    toComponentTypeCC3D: function ( compnentType ) {
        if ( compnentType === 5120 ) {
            return cc3d.ELEMENTTYPE_INT8;
        } else if ( compnentType === 5121 ) {
            return cc3d.ELEMENTTYPE_UINT8;
        } else if ( compnentType === 5122 ) {
            return cc3d.ELEMENTTYPE_INT16;
        } else if ( compnentType === 5123 ) {
            return cc3d.ELEMENTTYPE_UINT16;
        } else if ( compnentType === 5126 ) {
            return cc3d.ELEMENTTYPE_FLOAT32;
        }
    },

    semantics: {
        'position': cc3d.SEMANTIC_POSITION,
        'normal': cc3d.SEMANTIC_NORMAL,
        'tangent': cc3d.SEMANTIC_TANGENT,
        'color': cc3d.SEMANTIC_COLOR,
        'uv0': cc3d.SEMANTIC_TEXCOORD0,
        'uv1': cc3d.SEMANTIC_TEXCOORD1,
        'uv2': cc3d.SEMANTIC_TEXCOORD2,
        'uv3': cc3d.SEMANTIC_TEXCOORD3,
        'uv4': cc3d.SEMANTIC_TEXCOORD4,
        'uv5': cc3d.SEMANTIC_TEXCOORD5,
        'uv6': cc3d.SEMANTIC_TEXCOORD6,
        'uv7': cc3d.SEMANTIC_TEXCOORD7,
        // 'blendweight': cc3d.SEMANTIC_BLENDWEIGHT,
        // 'blendindices': cc3d.SEMANTIC_BLENDINDICES,
    },
};
