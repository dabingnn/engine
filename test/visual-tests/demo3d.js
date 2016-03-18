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
var device = null;
var VertexBuffer = cc3d.graphics.VertexBuffer;
var IndexBuffer = cc3d.graphics.IndexBuffer;
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
    vertexBuffer = new VertexBuffer(device, vertexFormat,vertices.length/3);
    vertexBuffer.setData(new Float32Array(vertices));

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_TEXCOORD0,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:2}]
    );
    uvBuffer = new VertexBuffer(device, vertexFormat,uv.length/2);
    uvBuffer.setData(new Float32Array(uv));

    var indices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    indexBuffer = new IndexBuffer(device, cc3dEnums.INDEXFORMAT_UINT16,indices.length);

    //indexBuffer = gl.createBuffer();
    //gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
    var indexArray = new Uint16Array(indexBuffer.lock());
    indexArray.set(indices);
    indexBuffer.unlock();
    //gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
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
    var attribs = {
        a_position: cc3dEnums.SEMANTIC_POSITION,
        a_texCoord0: cc3dEnums.SEMANTIC_TEXCOORD0
    };
    var definition = {
        vshader: vertSrc,
        fshader: fragSrc,
        attributes: attribs
    };
    glProgram = new cc3d.graphics.Shader(device,definition);
    glProgram.link();

};

function tick() {
    window.requestAnimationFrame(tick);
    drawScene();
    animate();
}

function drawScene() {
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    device.setViewport( 0, 0, canvas.width, canvas.height );
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

    device.setShader(glProgram);

    // commit uniform
    var u_mat_p = gl.getUniformLocation(glProgram.program, 'worldViewProjection');
    gl.uniformMatrix4fv(u_mat_p, false, mat_mv.data);
    // commit texture
    var u_sampler = gl.getUniformLocation(glProgram.program, 'texture');
    gl.uniform1i(u_sampler, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    //set vertexBuffer and indexBuffer
    device.setVertexBuffer(vertexBuffer, 0);
    device.setVertexBuffer(uvBuffer,1);
    device.setIndexBuffer(indexBuffer);
    var primitive = {
        type: gl.TRIANGLES,
        indexed: true,
        base: 0,
        count: indexBuffer.numIndices
    };
    // draw
    device.draw(primitive);

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
    device = new cc3d.graphics.GraphicsDevice(canvas);
    gl = device.gl;

    initGLProgram();
    initBuffer();
    initTexture();
    setTimeout(function() {
        tick()
    },1000);
    //tick();
};
