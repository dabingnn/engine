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
};

cc3d.Mesh = Mesh;
cc3d.MeshInstance = MeshInstance;
