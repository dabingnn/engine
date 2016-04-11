var ShaderLibs = function() {

};

ShaderLibs.prototype = {
    hasShaderKey: function(key) {
        return this[key] !== undefined;
    },

    getShaderByKey: function(key) {
        return this[key];
    },

    addShader: function(key, shader) {
        if(this[key]) {
            //do nothing
        } else {
            this[key] = shader;
        }
    },

    removeShader: function(key) {
        delete this[key];
    }
};

cc3d.ShaderLibs = new ShaderLibs();
