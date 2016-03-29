
var canvas = null;

var rotX = 0, rotY = 0, rotZ = 0;
var scale = cc3d.math.Vec3.ONE.clone();
var position = new cc3d.math.Vec3(0,0,0);

var texture = null;
var device = null;
var cc3dEnums = cc3d.graphics.Enums;
var objectNodes = [];
var scene = null;
var renderer = null;
var camera = null;

function initTexture() {
    //var gl = device.gl;
    texture = new cc3d.graphics.Texture(device);
    //texture = gl.createTexture();
    var image = new Image();
    image.onload = function () {
        texture.setSource(image);
        //gl.bindTexture(gl.TEXTURE_2D, texture);
        //gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        //gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        //gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        ////gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
        //gl.generateMipmap(gl.TEXTURE_2D);
        //gl.bindTexture(gl.TEXTURE_2D, null);
    };
    image.src = './crate.gif';
};

function initMesh() {
    var mesh = new cc3d.Mesh();

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

    var normals = [
        // Front face
        0.0, 0.0,  1.0,
        0.0, 0.0,  1.0,
        0.0,  0.0,  1.0,
        0.0,  0.0,  1.0,

        // Back face
        0.0, 0.0,  -1.0,
        0.0, 0.0,  -1.0,
        0.0,  0.0,  -1.0,
        0.0,  0.0,  -1.0,

        // Top face
        0.0,  1.0, 0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0,  0.0,
        0.0,  1.0, 0.0,

        // Bottom face
        0.0,  -1.0, 0.0,
        0.0,  -1.0,  0.0,
        0.0,  -1.0,  0.0,
        0.0,  -1.0, 0.0,

        // Right face
        1.0, 0.0, 0.0,
        1.0,  0.0, 0.0,
        1.0,  0.0,  0.0,
        1.0, 0.0,  0.0,

        // Left face
        -1.0, 0.0, 0.0,
        -1.0,  0.0, 0.0,
        -1.0,  0.0,  0.0,
        -1.0, 0.0,  0.0,
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
    var vertexBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,vertices.length/3);
    vertexBuffer.setData(new Float32Array(vertices));

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_TEXCOORD0,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:2}]
    );
    var uvBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,uv.length/2);
    uvBuffer.setData(new Float32Array(uv));

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_NORMAL,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:3}]
    );
    var normalBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,uv.length/2);
    normalBuffer.setData(new Float32Array(normals));

    mesh.vertexBuffer.push(vertexBuffer);
    mesh.vertexBuffer.push(uvBuffer);
    mesh.vertexBuffer.push(normalBuffer);

    var indices = [
        0, 1, 2,      0, 2, 3,    // Front face
        4, 5, 6,      4, 6, 7,    // Back face
        8, 9, 10,     8, 10, 11,  // Top face
        12, 13, 14,   12, 14, 15, // Bottom face
        16, 17, 18,   16, 18, 19, // Right face
        20, 21, 22,   20, 22, 23  // Left face
    ];
    var indexBuffer = new cc3d.graphics.IndexBuffer(device, cc3dEnums.INDEXFORMAT_UINT16,indices.length);


    var indexArray = new Uint16Array(indexBuffer.lock());
    indexArray.set(indices);
    indexBuffer.unlock();

    mesh.indexBuffer = indexBuffer;
    mesh.primitive = {
        type: cc3dEnums.PRIMITIVE_TRIANGLES,
        indexed: true,
        base: 0,
        count: indexBuffer.getNumIndices(),
    };
    return mesh;
};

function initGLProgram() {
    var vertSrc,pixelSrc;
    vertSrc = '' +
        'attribute vec4 a_position;' +
        'attribute vec2 a_texCoord0;' +
        'attribute vec3 a_normal;' +
        'uniform mat4 world;' +
        'uniform mat4 view;' +
        'uniform mat4 projection;' +
        'uniform mat4 worldViewProjection;' +
        'varying vec2 v_texCoord0;' +
        'varying vec3 v_normal;' +
        'void main() {' +
        'gl_Position = worldViewProjection * a_position;' +
        'v_normal = (world * vec4(a_normal,0.0)).xyz;' +
        'v_texCoord0 = a_texCoord0;' +
        '}';
    fragSrc = 'precision mediump float;' +
        'varying vec2 v_texCoord0;' +
        'varying vec3 v_normal;' +
        'uniform sampler2D texture;' +
        'uniform vec3 lightDirInWorld;' +
        'uniform vec3 lightColor;' +
        'float computeLight(vec3 lightDir, vec3 normal) {' +
        'float dotLight = dot(lightDir, normal);' +
        'if(dotLight < 0.0) dotLight = 0.0;' +
        'return dotLight;' +
        '}' +
        'void main() {' +
        'float color = computeLight(-lightDirInWorld,v_normal);' +
        'vec4 diffuseColor = texture2D(texture, v_texCoord0);' +
        'gl_FragColor.xyz = color * diffuseColor.rgb * lightColor.rgb;' +
        'gl_FragColor.a = diffuseColor.a;' +
        '}';
    var attribs = {
        a_position: cc3dEnums.SEMANTIC_POSITION,
        a_texCoord0: cc3dEnums.SEMANTIC_TEXCOORD0,
        a_normal: cc3dEnums.SEMANTIC_NORMAL
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
    var gl = device.gl;
    gl.clearColor( 0.5, 0.5, 0.5, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    device.setViewport( 0, 0, canvas.width, canvas.height );
    gl.enable(gl.DEPTH_TEST);

    renderer.render(scene,camera);
};
var lastTime = null;
var animateAcc = 0;
var animateIndex = 0;
var animateInterval = 2000;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime) {
        var dt = timeNow - lastTime;

        rotX = (10 * dt) / 500.0;
        rotY = (10 * dt) / 500.0;
        // rotZ += (90 * dt) / 1000.0;
        //y += dt / 1000.0;
        animateAcc += dt;
    }
    lastTime = timeNow;
    if(animateAcc > animateInterval) {
        animateAcc = 0;
        animateInterval = Math.random() * 5000 + 5000;
        animateIndex++;
        if(animateIndex >= objectNodes.length) {
            animateIndex -= objectNodes.length;
        }
    }
    if(objectNodes.length > 0) {
        objectNodes[animateIndex].rotateLocal(rotX,rotY * Math.pow(-1,animateIndex),rotZ);
    }

};

function initCamera() {
    camera = new cc3d.Camera();
    camera.setProjection(cc3d.SceneEnums.PROJECTION_PERSPECTIVE);
    camera.setFov(45);
    camera.setFarClip(1000);
    camera.setNearClip(0.1);
    camera.setAspectRatio(canvas.width/canvas.height);
    var node = camera._node = new cc3d.GraphNode();
    node.setPosition(new cc3d.math.Vec3(10,10,10));
    node.lookAt(cc3d.math.Vec3.ZERO,cc3d.math.Vec3.UP);

};

function initObjectNode() {
    var node = new cc3d.GraphNode();
    node.setLocalPosition(position);
    node.setEulerAngles(rotX,rotY,rotZ);
    node.setLocalScale(scale);
    return node;
};

function initMaterial() {
    var material = new cc3d.BasicMaterial();
    material.texture = texture;
    return material;
}

function initScene() {
    initCamera();
    scene = new cc3d.Scene();

    var mesh = initMesh();
    var node = initObjectNode();
    node.translate(-1.5, 0, 0);
    objectNodes.push(node);
    scene.addMeshInstance(new cc3d.MeshInstance(node, mesh, initMaterial()));
    node = initObjectNode();
    node.translate(3.5, 0, 0);
    objectNodes.push(node);
    var material = new cc3d.BasicLambertMaterial();
    material.texture = texture;
    scene.addMeshInstance(new cc3d.MeshInstance(node, mesh, material));
    renderer = new cc3d.ForwardRenderer(device);

    //init light
    var light = new cc3d.Light();
    node = initObjectNode();
    objectNodes.push(node);
    light._node = node;
    light._direction = new cc3d.math.Vec3(0, -1, 0);
    scene.addLight(light);
};

function run3d() {
    canvas = document.getElementById("gameCanvas");
    device = new cc3d.graphics.GraphicsDevice(canvas);
    initTexture();
    initScene();
    setTimeout(function() {
        tick();
    },1000);
    //tick();
};
