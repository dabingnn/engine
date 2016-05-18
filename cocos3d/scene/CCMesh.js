'use strict';

var SkinInfo = function() {
    this.boneName = [];
    this.boneMatrix = [];
};

var Mesh = function() {
    this.vertexBuffer = [];
    this.indexBuffer = null;
    this.primitive = {
        type : 0,
        base : 0,
        count: 0
    };

};

var MeshInstance = function MeshInstance(node, mesh, material, skin) {
    this._node = node;
    this.mesh = mesh;
    this.material = material;
    //used for rendering sorting
    this.sortDistance = NaN;
    this.skinInstance = skin || null;
};

MeshInstance.prototype = {
    calculateDistance: function(targetPos) {
        var meshPos = this._node.getPosition().clone();
        this.sortDistance = meshPos.sub(targetPos).length();
    },

    resetDistance: function() {
        this.sortDistance = NaN;
    },

    isSkinned : function() {
        return !!this.skinInstance;
    }
};

cc3d.Mesh = Mesh;
cc3d.MeshInstance = MeshInstance;
cc3d.SkinInfo = SkinInfo;
