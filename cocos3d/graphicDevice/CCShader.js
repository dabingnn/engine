
'use strict';

require('./CCGraphicEnums');

var ShaderInput = function (graphicsDevice, name, type, locationId) {
    // Set the shader attribute location
    this.locationId = locationId;

    // Resolve the ScopeId for the attribute name
    //this.scopeId = graphicsDevice.scope.resolve(name);
    this.name = name;
    // Create the version
    //this.version = new pc.Version();

    // Set the data type
    this.dataType = type;

    // Array to hold texture unit ids
    this.array = [];
};

function createShader(gl, type, src) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    return shader;
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    return program;
}

var Shader = function (graphicsDevice, definition) {
    this.device = graphicsDevice;
    this.definition = definition;
    this.ready = false;

    var gl = this.device.gl;
    this.vshader = createShader(gl, gl.VERTEX_SHADER, definition.vshader);
    this.fshader = createShader(gl, gl.FRAGMENT_SHADER, definition.fshader);
    this.program = createProgram(gl, this.vshader, this.fshader);

};

Shader.prototype = {
    link: function () {
        var gl = this.device.gl;

        gl.linkProgram(this.program);
        //var logERROR = ;
        // check for errors
        // vshader
        if (! gl.getShaderParameter(this.vshader, gl.COMPILE_STATUS))
            console.log("Failed to compile vertex shader:\n\n" + gl.getShaderInfoLog(this.vshader));
        // fshader
        if (! gl.getShaderParameter(this.fshader, gl.COMPILE_STATUS))
            console.log("Failed to compile fragment shader:\n\n" + gl.getShaderInfoLog(this.fshader));
        // program
        if (! gl.getProgramParameter(this.program, gl.LINK_STATUS))
            console.log("Failed to link shader program. Error: " + gl.getProgramInfoLog(this.program));

        gl.deleteShader(this.vshader);
        gl.deleteShader(this.fshader);

        this.attributes = [];
        this.uniforms = [];
        this.samplers = [];

        // Query the program for each vertex buffer input (GLSL 'attribute')
        var i = 0;
        var info, location;

        var _typeToPc = {};
        var cc3dEnums = cc3d.graphics.Enums;
        _typeToPc[gl.BOOL]         = cc3dEnums.UNIFORMTYPE_BOOL;
        _typeToPc[gl.INT]          = cc3dEnums.UNIFORMTYPE_INT;
        _typeToPc[gl.FLOAT]        = cc3dEnums.UNIFORMTYPE_FLOAT;
        _typeToPc[gl.FLOAT_VEC2]   = cc3dEnums.UNIFORMTYPE_VEC2;
        _typeToPc[gl.FLOAT_VEC3]   = cc3dEnums.UNIFORMTYPE_VEC3;
        _typeToPc[gl.FLOAT_VEC4]   = cc3dEnums.UNIFORMTYPE_VEC4;
        _typeToPc[gl.INT_VEC2]     = cc3dEnums.UNIFORMTYPE_IVEC2;
        _typeToPc[gl.INT_VEC3]     = cc3dEnums.UNIFORMTYPE_IVEC3;
        _typeToPc[gl.INT_VEC4]     = cc3dEnums.UNIFORMTYPE_IVEC4;
        _typeToPc[gl.BOOL_VEC2]    = cc3dEnums.UNIFORMTYPE_BVEC2;
        _typeToPc[gl.BOOL_VEC3]    = cc3dEnums.UNIFORMTYPE_BVEC3;
        _typeToPc[gl.BOOL_VEC4]    = cc3dEnums.UNIFORMTYPE_BVEC4;
        _typeToPc[gl.FLOAT_MAT2]   = cc3dEnums.UNIFORMTYPE_MAT2;
        _typeToPc[gl.FLOAT_MAT3]   = cc3dEnums.UNIFORMTYPE_MAT3;
        _typeToPc[gl.FLOAT_MAT4]   = cc3dEnums.UNIFORMTYPE_MAT4;
        _typeToPc[gl.SAMPLER_2D]   = cc3dEnums.UNIFORMTYPE_TEXTURE2D;
        _typeToPc[gl.SAMPLER_CUBE] = cc3dEnums.UNIFORMTYPE_TEXTURECUBE;

        var numAttributes = gl.getProgramParameter(this.program, gl.ACTIVE_ATTRIBUTES);
        while (i < numAttributes) {
            info = gl.getActiveAttrib(this.program, i++);
            location = gl.getAttribLocation(this.program, info.name);

            // Check attributes are correctly linked up
            if (this.definition.attributes[info.name] === undefined) {
                console.error('Vertex shader attribute "' + info.name + '" is not mapped to a semantic in shader definition.');
            }

            var attr = new ShaderInput(this.device, this.definition.attributes[info.name], _typeToPc[info.type], location);
            this.attributes.push(attr);
        }

        // Query the program for each shader state (GLSL 'uniform')
        i = 0;
        var numUniforms = gl.getProgramParameter(this.program, gl.ACTIVE_UNIFORMS);
        while (i < numUniforms) {
            info = gl.getActiveUniform(this.program, i++);
            location = gl.getUniformLocation(this.program, info.name);
            if ((info.type === gl.SAMPLER_2D) || (info.type === gl.SAMPLER_CUBE)) {
                this.samplers.push(new ShaderInput(this.device, info.name, _typeToPc[info.type], location));
            } else {
                this.uniforms.push(new ShaderInput(this.device, info.name, _typeToPc[info.type], location));
            }
        }

        this.ready = true;

    },

    destroy: function () {
        var gl = this.device.gl;
        gl.deleteProgram(this.program);
    }
};

cc3d.graphics.ShaderInput = ShaderInput;
cc3d.graphics.Shader = Shader;
