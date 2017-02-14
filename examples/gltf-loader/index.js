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
        'weight': cc3d.SEMANTIC_BLENDWEIGHT,
        'joint': cc3d.SEMANTIC_BLENDINDICES,
    },

    toTextureFormatCC3D: function ( format, type ) {
        if ( format === 6406 && type === 5121 ) {
            // ALPHA & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_A8;
        } else if ( format === 6409 && type === 5121 ) {
            // LUMINANCE & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_L8;
        } else if ( format === 6410 && type === 5121 ) {
            // LUMINANCE_ALPHA & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_L8_A8;
        } else if ( format === 6407 && type === 33635 ) {
            // RGB & UNSIGNED_SHORT_5_6_5
            return cc3d.PIXELFORMAT_R5_G6_B5;
        } else if ( format === 6408 && type === 32820 ) {
            // RGBA & UNSIGNED_SHORT_5_5_5_1
            return cc3d.PIXELFORMAT_R5_G5_B5_A1;
        } else if ( format === 6408 && type === 32819 ) {
            // RGBA & UNSIGNED_SHORT_4_4_4_4
            return cc3d.PIXELFORMAT_R4_G4_B4_A4;
        } else if ( format === 6407 && type === 5121 ) {
            // RGB & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_R8_G8_B8;
        } else if ( format === 6408 && type === 5121 ) {
            // RGBA & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_R8_G8_B8_A8;
        } else if ( format === 6408 && type === 5121 ) {
            // RGBA & UNSIGNED_BYTE
            return cc3d.PIXELFORMAT_R8_G8_B8_A8;
        }

        return cc3d.PIXELFORMAT_R8_G8_B8_A8;
    },

    toFilterCC3D: function ( type ) {
        if ( type === 9728 ) {
            return cc3d.FILTER_NEAREST;
        } else if ( type === 9729 ) {
            return cc3d.FILTER_LINEAR;
        } else if ( type === 9984 ) {
            return cc3d.FILTER_NEAREST_MIPMAP_NEAREST;
        } else if ( type === 9985 ) {
            return cc3d.FILTER_LINEAR_MIPMAP_NEAREST;
        } else if ( type === 9986 ) {
            return cc3d.FILTER_NEAREST_MIPMAP_LINEAR;
        } else if ( type === 9987 ) {
            return cc3d.FILTER_LINEAR_MIPMAP_LINEAR;
        }

        return cc3d.FILTER_LINEAR;
    },

    toAddressCC3D: function ( type ) {
        if ( type === 10497 ) {
            return cc3d.ADDRESS_REPEAT;
        } else if ( type === 33071 ) {
            return cc3d.ADDRESS_CLAMP_TO_EDGE;
        } else if ( type === 33648 ) {
            return cc3d.ADDRESS_MIRRORED_REPEAT;
        }

        return cc3d.ADDRESS_REPEAT;
    },
};
