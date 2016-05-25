'use strict';

var Bone = function () {

};

Bone = cc3d.inherits(Bone, cc3d.GraphNode);

var Skeleton = function () {
    //root bone
    this._rootBone = null;
    //all bones
    this._bones = {};
};

cc3d.extend(Skeleton.prototype, {
    getPose : function() {
        this._rootBone.syncHierarchy();
        var pose = {};
        for(var boneName in this._bones) {
            pose[boneName] = this._bones[boneName].getWorldTransform();
        }

        return pose;
    }
});

var AnimationClip = function() {
    this.boneKeys = {};
    this.duration = 0;
    this.name = '';
};

cc3d.Bone = Bone;
cc3d.Skeleton = Skeleton;
cc3d.AnimationClip = AnimationClip;
