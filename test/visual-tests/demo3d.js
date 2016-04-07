
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
var boxMesh = null;
var sphereMesh = null;
var lights = [];
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

function initSphereMesh( radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {


    radius = radius || 1;

    widthSegments = Math.max( 3, Math.floor( widthSegments ) || 8 );
    heightSegments = Math.max( 2, Math.floor( heightSegments ) || 6 );

    phiStart = phiStart !== undefined ? phiStart : 0;
    phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;

    thetaStart = thetaStart !== undefined ? thetaStart : 0;
    thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

    var thetaEnd = thetaStart + thetaLength;

    var vertexCount = ( ( widthSegments + 1 ) * ( heightSegments + 1 ) );

    var positions = new Float32Array(vertexCount * 3);
    var normals = new Float32Array(vertexCount * 3);
    var uvs = new Float32Array(vertexCount * 2);

    var index = 0, vertices = [], normal = new cc3d.math.Vec3();

    for ( var y = 0; y <= heightSegments; y ++ ) {

        var verticesRow = [];

        var v = y / heightSegments;

        for ( var x = 0; x <= widthSegments; x ++ ) {

            var u = x / widthSegments;

            var px = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
            var py = radius * Math.cos( thetaStart + v * thetaLength );
            var pz = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

            normal.set( px, py, pz ).normalize();

            positions[3 * index] = px;
            positions[3 * index + 1] = py;
            positions[3 * index + 2] = pz;

            normals[3 * index] = normal.x;
            normals[3 * index + 1] = normal.y;
            normals[3 * index + 2] = normal.z;

            uvs[2 * index] = u;
            uvs[2 * index + 1] = 1-v;

            verticesRow.push( index );

            index ++;

        }

        vertices.push( verticesRow );

    }

    var indices = [];

    for ( var y = 0; y < heightSegments; y ++ ) {

        for ( var x = 0; x < widthSegments; x ++ ) {

            var v1 = vertices[ y ][ x + 1 ];
            var v2 = vertices[ y ][ x ];
            var v3 = vertices[ y + 1 ][ x ];
            var v4 = vertices[ y + 1 ][ x + 1 ];

            if ( y !== 0 || thetaStart > 0 ) indices.push( v1, v2, v4 );
            if ( y !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( v2, v3, v4 );

        }

    }

    var mesh = new cc3d.Mesh();

    var vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_POSITION,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:3}]
    );
    var vertexBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,positions.length/3);
    vertexBuffer.setData(positions);

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_TEXCOORD0,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:2}]
    );
    var uvBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,uvs.length/2);
    uvBuffer.setData(uvs);

    vertexFormat = new cc3d.graphics.VertexFormat(
        [{semantic:cc3dEnums.SEMANTIC_NORMAL,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:3}]
    );
    var normalBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,normals.length/3);
    normalBuffer.setData(normals);

    mesh.vertexBuffer.push(vertexBuffer);
    mesh.vertexBuffer.push(uvBuffer);
    mesh.vertexBuffer.push(normalBuffer);

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
    var normalBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,normals.length/3);
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
function update_addLights() {
    var largeRange = 15;
    initPointLight(scene, new cc3d.math.Vec3(10,-2,0), new cc3d.math.Vec3(1.0,0.0,0.0), largeRange);

    initPointLight(scene, new cc3d.math.Vec3(0,-2,0), new cc3d.math.Vec3(0.0,1.0,0.0), largeRange);

    initPointLight(scene, new cc3d.math.Vec3(-10,-2,0), new cc3d.math.Vec3(0.0,0.0,1.0), largeRange);

    //initPointLight(scene, new cc3d.math.Vec3(-5,-2,0), new cc3d.math.Vec3(0,0.8,0.8), largeRange);

    //initPointLight(scene, new cc3d.math.Vec3(-10,-2,0), new cc3d.math.Vec3(0.8,0.8,0), largeRange);
};
function  update_removeLights() {
    for(var index = lights.length -1; index >= 5; --index) {
        scene.removeLight(lights[index].light);
        scene.removeMeshInstance(lights[index].mesh);
    }

    lights.splice(5,lights.length - 5);

}
var lastTime = null;
var animationInterval = 0;
function animate() {
    var timeNow = new Date().getTime();
    if (lastTime) {
        var dt = timeNow - lastTime;

        rotX = (10 * dt) / 500.0;
        rotY = (10 * dt) / 500.0;
        // rotZ += (90 * dt) / 1000.0;
        //y += dt / 1000.0;

        for(var index = 0; index < objectNodes.length; ++index) {
            var pos = objectNodes[index].getLocalPosition().clone();
            pos.x += 1.0 * dt/1000* (pos.y > 0 ?1.5 : 1);
            if(pos.x > 12) pos.x = -12;
            objectNodes[index].setLocalPosition(pos);
        }

        animationInterval += dt;
    }

    if(animationInterval >4000) {
        if(lights.length === 8) {
            update_removeLights();
        } else {
            update_addLights();
        }
        animationInterval = 0;
    }

    lastTime = timeNow;

    for(var rotIndex = 0; rotIndex < objectNodes.length; ++rotIndex)
    {
        objectNodes[rotIndex].rotateLocal(rotX,rotY * Math.pow(-1,rotIndex),rotZ);
    }


    scene.update();
};

function initCamera() {
    camera = new cc3d.Camera();
    camera.setProjection(cc3d.SceneEnums.PROJECTION_PERSPECTIVE);
    camera.setFov(45);
    camera.setFarClip(1000);
    camera.setNearClip(0.1);
    camera.setAspectRatio(canvas.width/canvas.height);
    var node = camera._node = new cc3d.GraphNode();
    node.setPosition(new cc3d.math.Vec3(0,0,20));
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

function initPointLight(scene, pos, color, range) {
    var light = new cc3d.Light();
    var node = initObjectNode();
    node.setPosition(cc3d.math.Vec3.ZERO);
    light._node = node;
    light.setColor(color);
    light.setType(cc3d.SceneEnums.LIGHTTYPE_POINT);
    light._attenuationEnd = range;
    light._position = pos.clone();
    scene.addLight(light);

    var node2 = initObjectNode();
    node2.setLocalPosition(pos);
    node2.setLocalScale(new cc3d.math.Vec3(0.1,0.1,0.1));
    var material = new cc3d.ColorMaterial();
    material.color = color.clone();
    var meshInstance = new cc3d.MeshInstance(node2, sphereMesh, material);
    scene.addMeshInstance(meshInstance);
    node.addChild(node2);

    lights.push({light:light, mesh: meshInstance});
    //objectNodes.push(node);
}

function initScene() {
    initCamera();
    scene = new cc3d.Scene();

    var node = initObjectNode();
    node.translate(0, -6.5, -3);
    objectNodes.push(node);
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, initMaterial()));
    node = initObjectNode();
    node.translate(3.5, 2, -3);
    //node.setLocalScale(3,3,3);
    objectNodes.push(node);
    var material = new cc3d.BasicLambertMaterial();
    material.texture = texture;
    scene.addMeshInstance(new cc3d.MeshInstance(node, sphereMesh, material));


    node = initObjectNode();
    node.translate(-3.5, 2, -3);
    //node.setLocalScale(3,3,3);
    objectNodes.push(node);
    material = new cc3d.BasicLambertMaterial();
    //material.texture = texture;
    scene.addMeshInstance(new cc3d.MeshInstance(node, sphereMesh, material));


    renderer = new cc3d.ForwardRenderer(device);

    //init light
    var light = new cc3d.Light();
    node = initObjectNode();
    //objectNodes.push(node);
    light._node = node;
    light._direction = new cc3d.math.Vec3(0, -1, 0);
    light.setColor(new cc3d.math.Vec3(0.6,0.6,0.6));
    scene.addLight(light);
    var generalRange = 10;
    initPointLight(scene, new cc3d.math.Vec3(-10,4,0), new cc3d.math.Vec3(1.0,0.0,0.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(-5,4,0), new cc3d.math.Vec3(0.0,1.0,0.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(0,4,0), new cc3d.math.Vec3(0.0,0.0,1.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(5,4,0), new cc3d.math.Vec3(0,0.5,0.5), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(10,4,0), new cc3d.math.Vec3(0.5,0.5,0), generalRange);

    scene._sceneAmbient = new cc3d.math.Vec3(0.6,0.6,0.6);

};

function run3d() {
    canvas = document.getElementById("gameCanvas");
    device = new cc3d.graphics.GraphicsDevice(canvas);
    initTexture();
    boxMesh = initMesh();
    sphereMesh = initSphereMesh(1.5, 20, 10);
    initScene();
    setTimeout(function() {
        tick();
    },1000);
    //tick();
};
