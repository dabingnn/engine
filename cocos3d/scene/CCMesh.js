'use strict';

var Skin = function() {
    this.boneName = [];
    this.boneMatrix = [];
};

var SkinInstance = function(skin, skeleton) {
    this.skin = skin;
    this.skeleton = skeleton;

    this.poseMatrix = [];
    for(var index = 0; index < skin.boneMatrix.length; ++index) {
        this.poseMatrix.push(cc3d.math.Mat4.IDENTITY);
    }
};

cc3d.extend(SkinInstance.prototype, {
    updatePose : function() {
        var pose = this.skeleton.getPose();
        var skinBone = this.skin.boneName;
        var skinMatrix = this.skin.boneMatrix;
        for(var index = 0; index < this.poseMatrix.length; ++index) {
            this.poseMatrix[index].mul2(pose[skinBone[index]], skinMatrix[index]);
        }
    }
});

var Mesh = function() {
    this.vertexBuffer = [];
    this.indexBuffer = null;
    this.primitive = {
        type : 0,
        base : 0,
        count: 0
    };

};

var MeshInstance = function MeshInstance(node, mesh, material, skinInstance) {
    this._node = node;
    this.mesh = mesh;
    this.material = material;
    //used for rendering sorting
    this.sortDistance = NaN;
    this.skinInstance = skinInstance || null;
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
cc3d.Skin = Skin;
cc3d.SkinInstance = SkinInstance;
