'use strict';

var Scene = function () {
    this._meshInstances = [];
    //only support one light now
    this._light = null;
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
       this._light = light;
    },

    getLight: function() {
      return this._light;
    },

    update: function() {
        this._light._node.syncHierarchy();
        for (var i = 0, len = this._models.length; i < len; i++) {
            this._meshInstances[i]._node.syncHierarchy();
        }
    },

    destroy: function() {
        this._meshInstances = [];
    }
};
cc3d.Scene = Scene;
