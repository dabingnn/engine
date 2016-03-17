
require('./CCGraphicEnums');

'use strict';

var _typeSize = [];
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_INT8   ] = 1;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_UINT8  ] = 1;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_INT16  ] = 2;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_UINT16 ] = 2;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_INT32  ] = 4;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_UINT32 ] = 4;
_typeSize[cc3d.graphics.Enums.ELEMENTTYPE_FLOAT32] = 4;

var VertexFormat = function (description) {
    var i, len, element;

    this.elements = [];
    this.hasUv0 = false;
    this.hasUv1 = false;
    this.hasColor = false;

    this.size = 0;
    for (i = 0, len = description.length; i < len; i++) {
        var elementDesc = description[i];
        element = {
            name: elementDesc.semantic,
            offset: 0,
            stride: 0,
            stream: -1,
            dataType: elementDesc.type,
            numComponents: elementDesc.components,
            normalize: (elementDesc.normalize === undefined) ? false : elementDesc.normalize,
            size: elementDesc.components * _typeSize[elementDesc.type]
        };
        this.elements.push(element);

        this.size += element.size;
        if (elementDesc.semantic===cc3d.graphics.Enums.SEMANTIC_TEXCOORD0) {
            this.hasUv0 = true;
        } else if (elementDesc.semantic===cc3d.graphics.Enums.SEMANTIC_TEXCOORD1) {
            this.hasUv1 = true;
        } else if (elementDesc.semantic===cc3d.graphics.Enums.SEMANTIC_COLOR) {
            this.hasColor = true;
        }
    }

    var offset = 0;
    for (i = 0, len = this.elements.length; i < len; i++) {
        element = this.elements[i];

        element.offset = offset;
        element.stride = this.size;

        offset += element.size;
    }
};
