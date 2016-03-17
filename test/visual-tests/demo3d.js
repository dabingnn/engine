var gl = null;
var canvas = null;
var glProgram = null;

var vertexBuffer = null;
var uvBuffer = null;
var indexBuffer = null;
var rotX = 0, rotY = 0, rotZ = 0;
var rotation = cc3d.math.Quat.IDENTITY.clone();
var scale = cc3d.math.Vec3.ONE.clone();
var position = new cc3d.math.Vec3(0,0,0);
var texture = null;
var VertexBuffer = cc3d.graphics.VertexBuffer;
var cc3dEnums = cc3d.graphics.Enums;
function initTexture() {
    texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function () {
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        gl.generateMipmap(gl.TEXTURE_2D);
        gl.bindTexture(gl.TEXTURE_2D, null);
    };
    texture.image.src = './crate.gif';
};

function initBuffer() {
    var vertices = [
        // Front face
        -1.0, -1.0,  1.0,
        1.0, -1.0,  1.0,
        1.0,  1.0,  1.0,
        -1.0,  1.0,  1.0,

        // Back face
        -1.0, -1.0, -1.0,
        -1.0,  1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0, -1.0, -1.0,

        // Top face
        -1.0,  1.0, -1.0,
        -1.0,  1.0,  1.0,
        1.0,  1.0,  1.0,
        1.0,  1.0, -1.0,

        // Bottom face
        -1.0, -1.0, -1.0,
        1.0, -1.0, -1.0,
        1.0, -1.0,  1.0,
        -1.0, -1.0,  1.0,

        // Right face
        1.0, -1.0, -1.0,
        1.0,  1.0, -1.0,
        1.0,  1.0,  1.0,
        1.0, -1.0,  1.0,

        // Left face
        -1.0, -1.0, -1.0,
        -1.0, -1.0,  1.0,
        -1.0,  1.0,  1.0,
        -1.0,  1.0, -1.0,
    ];

    // uv
    var uv = [
        // Front face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,

        // Back face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Top face
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,

        // Bottom face
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,
        1.0, 0.0,

        // Right face
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
        0.0, 0.0,

        // Left face
        0.0, 0.0,
        1.0, 0.0,
        1.0, 1.0,
        0.0, 1.0,
    ];
    var vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_POSITION,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:3}]
    );
    vertexBuffer = new VertexBuffer(vertexFormat,vertices.length/3);
    vertexBuffer.setData(new Float32Array(vertices));

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_TEXCOORD0,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:2}]
    );
    uvBuffer = new VertexBuffer(vertexFormat,uv.length/2);
    uvBuffer.setData(new Float32Array(uv));


    indexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    var indices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
};

function initGLProgram() {
    var vertSrc,pixelSrc;
    vertSrc = '' +
        'attribute vec4 a_position;' +
        'attribute vec2 a_texCoord0;' +
        //'uniform mat4 world;' +
        //'uniform mat4 viewProjection;' +
        'uniform mat4 worldViewProjection;' +
        'varying vec2 v_texCoord0;' +
        'void main() {' +
        'gl_Position = worldViewProjection * a_position;' +
        'v_texCoord0 = a_texCoord0;' +
        '}';
    fragSrc = 'precision mediump float;' +
        'varying vec2 v_texCoord0;' +
        'uniform sampler2D texture;' +
        'void main() {' +
        'gl_FragColor = texture2D(texture, v_texCoord0);' +
        //'gl_FragColor = vec4(1,0,0,1);' +
        '}';

    var vertexShader = gl.createShader(gl.VERTEX_SHADER);
    var pixelShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(vertexShader,vertSrc);
    gl.shaderSource(pixelShader,fragSrc);
    gl.compileShader(vertexShader);
    gl.compileShader(pixelShader);
    if ( !gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS) ) {
        console.log("Error when compile shader: \n" + gl.getShaderInfoLog(vertexShader));
    }
    if ( !gl.getShaderParameter(pixelShader, gl.COMPILE_STATUS) ) {
        console.log("Error when compile shader: \n" + gl.getShaderInfoLog(pixelShader));
    }

    glProgram = gl.createProgram();
    gl.attachShader(glProgram, vertexShader);
    gl.attachShader(glProgram, pixelShader);
    gl.linkProgram(glProgram);

    // If creating the shader program failed, alert

    if (!gl.getProgramParameter(glProgram, gl.LINK_STATUS)) {
        console.error('Failed to link shader program: \n' + gl.getProgramInfoLog(glProgram));
    }
};

function tick() {
    window.requestAnimationFrame(tick);
    drawScene();
    animate();
}

function drawScene() {
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    gl.viewport( 0, 0, canvas.width, canvas.height );
    gl.enable(gl.DEPTH_TEST);
    // setup mvp
    var mat_p = new cc3d.math.Mat4().setPerspective(
        45, canvas.width/canvas.height, 0.1, 1000.0
    );
    var mat_v = new cc3d.math.Mat4().setLookAt(
        new cc3d.math.Vec3(10,10,10),
        cc3d.math.Vec3.ZERO,
        cc3d.math.Vec3.UP
    );
    mat_v.invert();

    var mat_m = new cc3d.math.Mat4().setTRS(
        position, rotation.setFromEulerAngles(rotX,rotY,rotZ), scale
    );

    var mat_mv = new cc3d.math.Mat4();
    mat_mv.mul2(mat_v, mat_m);
    mat_mv.mul2(mat_p, mat_mv);

    gl.useProgram(glProgram);
    var attribs = {};
    // commit uniform
    var u_mat_p = gl.getUniformLocation(glProgram, 'worldViewProjection');
    gl.uniformMatrix4fv(u_mat_p, false, mat_mv.data);

    // commit vb & attr
    var attr_pos = gl.getAttribLocation(glProgram, 'a_position');
    var attr_tex_coord = gl.getAttribLocation(glProgram, 'a_texCoord0');
    attribs[cc3dEnums.SEMANTIC_POSITION] = attr_pos;
    attribs[cc3dEnums.SEMANTIC_TEXCOORD0] = attr_tex_coord;
    var glType = [
        gl.BYTE,
        gl.UNSIGNED_BYTE,
        gl.SHORT,
        gl.UNSIGNED_SHORT,
        gl.INT,
        gl.UNSIGNED_INT,
        gl.FLOAT
    ];
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer.bufferId);
    for(var index = 0; index < vertexBuffer.format.elements.length; ++index) {
        var element = vertexBuffer.format.elements[index];
        if(attribs[element.name] !== undefined) {
            gl.enableVertexAttribArray(attribs[element.name]);
            gl.vertexAttribPointer(attribs[element.name], element.numComponents, glType[element.dataType], element.normalize, element.stride, element.offset);
        }
    }

    gl.bindBuffer(gl.ARRAY_BUFFER, uvBuffer.bufferId);
    for(var index = 0; index < uvBuffer.format.elements.length; ++index) {
        var element = uvBuffer.format.elements[index];
        if(attribs[element.name] !== undefined) {
            gl.enableVertexAttribArray(attribs[element.name]);
            gl.vertexAttribPointer(attribs[element.name], element.numComponents, glType[element.dataType], element.normalize, element.stride, element.offset);
        }
    }

    // commit ib
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);

    // commit texture
    var u_sampler = gl.getUniformLocation(glProgram, 'texture');
    gl.uniform1i(u_sampler, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // draw
    gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);

};
var lastTime = null;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime) {
        var dt = timeNow - lastTime;

        rotX += (10 * dt) / 1000.0;
        rotY += (10 * dt) / 1000.0;
        // rotZ += (90 * dt) / 1000.0;
        //y += dt / 1000.0;
    }
    lastTime = timeNow;
};

function run3d() {
    canvas = document.getElementById("gameCanvas");
    gl = canvas.getContext('webgl');
    initGLProgram();
    initBuffer();
    initTexture();
    setTimeout(function() {
        tick()
    },1000);
    //tick();
};
