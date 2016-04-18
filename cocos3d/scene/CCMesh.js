'use strict';

var Mesh = function() {
    this.vertexBuffer = [];
    this.indexBuffer = null;
    this.primitive = {
        type : 0,
        base : 0,
        count: 0
    };
};

var MeshInstance = function MeshInstance(node, mesh, material) {
    this._node = node;
    this.mesh = mesh;
    this.material = material;
    //used for rendering sorting
    this.sortDistance = NaN;
};

MeshInstance.prototype = {
    calculateDistance: function(targetPos) {
        var meshPos = this._node.getPosition().clone();
        this.sortDistance = meshPos.sub(targetPos).length();
    },

    resetDistance: function() {
        this.sortDistance = NaN;
    }
};

cc3d.Mesh = Mesh;
cc3d.MeshInstance = MeshInstance;
