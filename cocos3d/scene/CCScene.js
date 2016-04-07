'use strict';

var Scene = function (graphicDevice) {
    this._meshInstances = [];
    //only support one light now
    this._lights = [];
    this._directionalLights = [];
    this._pointLights = [];
    this._spotLights = [];
    this._sceneAmbient = new cc3d.math.Vec3(0,0,0);
};
Scene.prototype = {
    getMeshInstance: function() {
        return this._meshInstances;
    },

    addMeshInstance: function(meshInstance) {
        var index = this._meshInstances.indexOf(meshInstance);
        if(index === -1) {
            this._meshInstances.push(meshInstance);
        }
    },

    removeMeshInstance: function(meshInstace) {
        var index = this._meshInstances.indexOf(meshInstace);
        if(index !== -1) {
            this._meshInstances.splice(index, 1);
        }
    },

    //hack codes
    addLight: function(light) {
        var index = this._lights.indexOf(light);
        if(index === -1) {
            this._lights.push(light);
        }
    },
    removeLight: function(light) {
        var index = this._lights.indexOf(light);
        if(index !== -1) {
            this._lights.splice(index,1);
        }
    },
    getLights: function() {
      return this._lights;
    },

    updateLights: function() {
        this._directionalLights.length = 0;
        this._pointLights.length = 0;
        this._spotLights.length = 0;
        for(var index = 0, lightCount = this._lights.length; index < lightCount; ++index) {
            var lightType = this._lights[index]._type;
            if(lightType === cc3d.SceneEnums.LIGHTTYPE_DIRECTIONAL) {
                this._directionalLights.push(this._lights[index]);
            } else if(lightType === cc3d.SceneEnums.LIGHTTYPE_POINT) {
                this._pointLights.push(this._lights[index]);
            } else {
                this._spotLights.push(this._lights[index]);
            }
        }

    },

    update: function() {
        this.updateLights();
        for(var i = 0, len = this._lights.length; i < len;i++) {
            this._lights[i]._node.syncHierarchy();
        }
        for (var i = 0, len = this._meshInstances.length; i < len; i++) {
            this._meshInstances[i]._node.syncHierarchy();
        }
    },

    destroy: function() {
        this._meshInstances = [];
    }
};
cc3d.Scene = Scene;
