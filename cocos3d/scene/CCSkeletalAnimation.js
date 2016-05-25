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
    },

    applyLocalPose : function(poses) {
        for(var boneName in poses) {
            var pose = poses[boneName];
            var bone = this._bones[boneName];
            if(bone) {
                bone.setLocalPosition(pose.translation);
                bone.setLocalScale(pose.scale);
                bone.setLocalRotation(pose.rotation);
            }
        }
    }
});

var AnimationClip = function() {
    this.boneKeys = {};
    this.duration = 0;
    this.name = '';
};

cc3d.extend(AnimationClip.prototype, {
    updatePoses : function(percentage) {
        var bonePoses = {};
        for(var boneName in this.boneKeys) {
            //todo add calculation here
            var bonePose = {};
            var curveT,curveR,curveS;
            curveT = this.boneKeys[boneName].translations;
            curveR = this.boneKeys[boneName].rotations;
            curveS = this.boneKeys[boneName].scales;
            var rotation, scale, translation;
            rotation = bonePose.rotation = new cc3d.math.Quat(0,0,0,1);
            scale = bonePose.scale =  new cc3d.math.Vec3(1,1,1);
            translation = bonePose.translation= new cc3d.math.Vec3(0,0,0);
            bonePoses[boneName] = bonePose;

            //get translation
            for(var index = 0; index < curveT.length; ++index) {
                if(curveT[index].time >= percentage) break;
            }

            if(index === 0) {
                translation.copy(curveT[index].key);
            } else {
                //do lerp
                var key1 = curveT[index - 1];
                var key2 = curveT[index];
                translation.lerp(key1.key, key2.key, (percentage - key1.time)/(key2.time - key1.time));
            }

            //get scale
            for(var index = 0; index < curveS.length; ++index) {
                if(curveS[index].time >= percentage) break;
            }

            if(index === 0) {
                scale.copy(curveS[index].key);
            } else {
                //do lerp
                var key1 = curveS[index - 1];
                var key2 = curveS[index];
                scale.lerp(key1.key, key2.key, (percentage - key1.time)/(key2.time - key1.time));
            }

            //get rotation
            for(var index = 0; index < curveR.length; ++index) {
                if(curveR[index].time >= percentage) break;
            }

            if(index === 0) {
                rotation.copy(curveR[index].key);
            } else {
                //do lerp
                var key1 = curveR[index - 1];
                var key2 = curveR[index];
                rotation.slerp(key1.key, key2.key, (percentage - key1.time)/(key2.time - key1.time));
            }


        }

        return bonePoses;
    }
});

cc3d.Bone = Bone;
cc3d.Skeleton = Skeleton;
cc3d.AnimationClip = AnimationClip;
