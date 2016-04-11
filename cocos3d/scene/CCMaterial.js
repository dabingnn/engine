'use strict';

var materialID = 0;
//generate a sortable key for rendering

var Material = function () {
    this.name = "Untitled";
    this.materialID = materialID++;
    this.shader = null;
    this.shaderKey = undefined;
    //this.variants = {};

    this.renderID = NaN;

    this.parameters = {};

    // Render states
    this.alphaTest = 0;

    this.blend = false;
    this.blendSrc = cc3d.graphics.Enums.BLENDMODE_ONE;
    this.blendDst = cc3d.graphics.Enums.BLENDMODE_ZERO;
    this.blendEquation = cc3d.graphics.Enums.BLENDEQUATION_ADD;

    this.cull = cc3d.graphics.Enums.CULLFACE_BACK;

    this.depthTest = true;
    this.depthWrite = true;

    this.redWrite = true;
    this.greenWrite = true;
    this.blueWrite = true;
    this.alphaWrite = true;

    //this.meshInstances = []; // The mesh instances referencing this material
};

Material.prototype = {
    _cloneInternal: function (clone) {
        clone.name = this.name;
        clone.id = id++;
        clone.shader = null;
        //clone.variants = {}; // ?

        clone.parameters = {};

        // Render states
        clone.alphaTest = this.alphaTest;

        clone.blend = this.blend;
        clone.blendSrc = this.blendSrc;
        clone.blendDst = this.blendDst;
        clone.blendEquation = this.blendEquation;

        clone.cull = this.cull;

        clone.depthTest = this.depthTest;
        clone.depthWrite = this.depthWrite;

        clone.redWrite = this.redWrite;
        clone.greenWrite = this.greenWrite;
        clone.blueWrite = this.blueWrite;
        clone.alphaWrite = this.alphaWrite;

        //clone.meshInstances = [];
    },

    clone: function () {
        var clone = new Material();
        this._cloneInternal(clone);
        return clone;
    },

    updateShader: function (device, scene, objDefs) {
        //interface functions
    },

    update: function() {
        //interface functions
    },

    clearParameters: function () {
        this.parameters = {};
    },

    deleteParameter: function (name) {
        if (this.parameters[name]) {
            delete this.parameters[name];
        }
    },

    getParameters: function () {
        return this.parameters;
    },

    getParameter: function (name) {
        return this.parameters[name];
    },

    setParameter: function (arg, data) {

        var name;
        if (data === undefined) {
            var uniformObject = arg;
            if (uniformObject.length) {
                for (var i = 0; i < uniformObject.length; i++) this.setParameter(uniformObject[i]);
                return;
            } else {
                name = uniformObject.name;
                data = uniformObject.value;
            }
        } else {
            name = arg;
        }

        var param = this.parameters[name];
        if (param) {
            param.data = data;
        } else {
            this.parameters[name] = {
                scopeId: null,
                data: data
            };
        }
    },

    setParameters: function (device) {
        // Push each shader parameter into scope
        for (var paramName in this.parameters) {
            var parameter = this.parameters[paramName];
            if (!parameter.scopeId) {
                parameter.scopeId = device.scope.resolve(paramName);
            }
            parameter.scopeId.setValue(parameter.data);
        }
    },

    getName: function () {
        return this.name;
    },

    setName: function (name) {
        this.name = name;
    },

    getShader: function () {
        return this.shader;
    },

    setShader: function (shader) {
        this.shader = shader;
    },

    _generateRenderKey: function() {
        this.renderID =  ((this.shader ? this.shader.shaderID : NaN) << 16) + this.materialID;
    }
};

cc3d.Material = Material;
