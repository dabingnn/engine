
var canvas = null;

var rotX = 0, rotY = 0, rotZ = 0;
var scale = cc3d.math.Vec3.ONE.clone();
var position = new cc3d.math.Vec3(0,0,0);

var texture = null;
var texture2 = null;
var device = null;
var cc3dEnums = cc3d.graphics.Enums;
var objectNodes = [];
var characterNode = null;
var scene = null;
var renderer = null;
var camera = null;
var boxMesh = null;
var sphereMesh = null;
var jsonMeshes = [];
var lights = [];
function initTexture(fileName) {
    var  texture = new cc3d.graphics.Texture(device);
    var image = new Image();
    image.onload = function () {
        texture.setSource(image);
    };
    image.src = fileName;
    return texture;
}
function initTextures() {

    texture = initTexture('./res3d/role_elf_warrior.png');
    //var gl = device.gl;
    texture2 = initTexture('./res3d/weapon_elf_warrior.png');
};

function initJasonMesh() {
    var request = new XMLHttpRequest();
    var loadedCallback = function() {
        console.log('jason mesh loaded');
        var jason = JSON.parse(request.responseText);
        //parse vertexFormat
        //[{semantic:cc3dEnums.SEMANTIC_POSITION,type:cc3dEnums.ELEMENTTYPE_FLOAT32, components:3}]
        var semanticMap = {
            VERTEX_ATTRIB_POSITION: cc3dEnums.SEMANTIC_POSITION,
            VERTEX_ATTRIB_NORMAL: cc3dEnums.SEMANTIC_NORMAL,
            VERTEX_ATTRIB_TEX_COORD: cc3dEnums.SEMANTIC_TEXCOORD0,
            VERTEX_ATTRIB_TEX_COORD1: cc3dEnums.SEMANTIC_TEXCOORD1,
            VERTEX_ATTRIB_BLEND_WEIGHT: cc3dEnums.SEMANTIC_BLENDWEIGHT,
            VERTEX_ATTRIB_BLEND_INDEX: cc3dEnums.SEMANTIC_BLENDINDICES,
            VERTEX_ATTRIB_COLOR: cc3dEnums.SEMANTIC_COLOR,
        };
        var typeMap = {
            GL_FLOAT: cc3dEnums.ELEMENTTYPE_FLOAT32,
            GL_BYTE: cc3dEnums.ELEMENTTYPE_INT8,
            GL_UNSIGNED_BYTE: cc3dEnums.ELEMENTTYPE_UINT8,
            GL_SHORT: cc3dEnums.ELEMENTTYPE_INT16,
            GL_UNSIGNED_SHORT: cc3dEnums.ELEMENTTYPE_UINT16,
            GL_INT: cc3dEnums.ELEMENTTYPE_INT32,
            GL_UNSIGNED_INT: cc3dEnums.ELEMENTTYPE_UINT32,
        };

        var vertexAttribs = [];
        for(var meshIndex = 0, meshLengh = jason.meshes.length; meshIndex < meshLengh; ++meshIndex) {
            var mesh = jason.meshes[meshIndex];
            //parse attributes
            var attribs_parsed = [];
            for(var attributeIndex = 0, attributeLength = mesh.attributes.length; attributeIndex < attributeLength; ++attributeIndex) {
                var attrib = mesh.attributes[attributeIndex];
                attribs_parsed.push({semantic:semanticMap[attrib.attribute],type:typeMap[attrib.type], components:attrib.size});
            }
            var vertexFormat = new cc3d.graphics.VertexFormat(attribs_parsed);
            //parse vertices/normals etc
            var vertices = new Float32Array(mesh.vertices);

            //generate vertexBuffers
            var vertexBuffer = new cc3d.graphics.VertexBuffer(device, vertexFormat,vertices.byteLength/vertexFormat.size);

            vertexBuffer.setData(vertices);

            //parse indices and generate meshes
            for(var partIndex = 0, partLength = mesh.parts.length; partIndex < partLength; ++partIndex) {

                var germesh = new cc3d.Mesh();
                germesh.vertexBuffer.push(vertexBuffer);

                var part = mesh.parts[partIndex];

                var indices = new Uint16Array(part.indices);
                var indexBuffer = new cc3d.graphics.IndexBuffer(device, cc3dEnums.INDEXFORMAT_UINT16,indices.length);
                indexBuffer.storage = indices;

                indexBuffer.unlock();
                germesh.indexBuffer = indexBuffer;

                germesh.primitive = {
                    type: cc3dEnums.PRIMITIVE_TRIANGLES,
                    indexed: true,
                    base: 0,
                    count: indexBuffer.getNumIndices(),
                };

                jsonMeshes.push(germesh);

            }


        }

        initCharacter();
    }
    request.addEventListener('load', loadedCallback);
    request.open('GET', './res3d/role_elf_warrior_run_001.c3t');
    request.send();
}

function initCharacter() {
    //init character
    var nodeTop = initObjectNode();
    nodeTop.translate(0,10,-8);
    nodeTop.rotate(0,0,0);
    nodeTop.rotate(-110,180,0);
    nodeTop.setLocalScale(0.02,0.02,0.02);
    for(var jsonMeshIndex = 0; jsonMeshIndex < jsonMeshes.length; ++jsonMeshIndex) {
        //objectNodes.push(node);
        var material = new cc3d.BasicPhongMaterial();
        material.texture = texture;
        material.useLambertLighting = true;
        scene.addMeshInstance(new cc3d.MeshInstance(nodeTop, jsonMeshes[jsonMeshIndex], material));
    }
}

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


    //var indexArray = new Uint16Array(indexBuffer.lock());
    //indexArray.set(indices);
    var indexArray = new Uint16Array(indices);
    //indexArray.set(indices);
    indexBuffer.storage = indexArray;

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


    var indexArray = new Uint16Array(indices);
    //indexArray.set(indices);
    indexBuffer.storage = indexArray;
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
    var shaderDefinition = {};
    var vertSrc = '';
    vertSrc += '#define USE_UV\n';
    vertSrc += '#define VARYING_UV\n';
    vertSrc += '#define USE_NORMAL\n';
    vertSrc += '#define VARYING_NORMAL\n';
    vertSrc += cc3d.ShaderChunks.commonAttributes;
    vertSrc += cc3d.ShaderChunks.commonUniforms;
    vertSrc += cc3d.ShaderChunks.commonVaryings;
    vertSrc += 'void main() {' +
        'gl_Position = matrix_worldviewprojection * vec4(a_position,1.0);' +
        'v_uv = a_uv;' +
        'v_normal = (matrix_normal * vec4(a_normal,0.0)).xyz;' +
        'v_normal = normalize(v_normal);' +
        '}';

    var fragSrc = 'precision mediump float;\n' +
        '#define VARYING_UV\n' +
        '#define VARYING_NORMAL\n' +
        'uniform sampler2D texture;\n' +
        cc3d.ShaderChunks.commonVaryings +
        'void main() {' +
        'vec4 albedo = texture2D(texture,v_uv);' +
        'gl_FragColor.xyz = v_normal;' +
        'gl_FragColor.w = albedo.w;' +
        '}';

    var attribs = {
        a_position: cc3dEnums.SEMANTIC_POSITION,
        a_uv: cc3dEnums.SEMANTIC_TEXCOORD0,
        a_normal: cc3dEnums.SEMANTIC_NORMAL
    };
    var definition = {
        vshader: vertSrc,
        fshader: fragSrc,
        attributes: attribs
    };
    var glProgram = new cc3d.graphics.Shader(device,definition);
    glProgram.link();

    return glProgram;

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

    //device.setViewport( 0, 0, canvas.width, canvas.height );
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
    camera.setNearClip(5);
    camera.setAspectRatio(canvas.width/canvas.height);
    var node = camera._node = new cc3d.GraphNode();
    node.setPosition(new cc3d.math.Vec3(0,20,-20));
    node.lookAt(cc3d.math.Vec3.ZERO,cc3d.math.Vec3.UP);

};

function initObjectNode() {
    var node = new cc3d.GraphNode();
    node.setLocalPosition(position);
    node.setEulerAngles(rotX,rotY,rotZ);
    node.setLocalScale(scale);
    return node;
};

function initPointLight(scene, pos, color, range) {
    return;
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
    node.translate(-3, -6.5, -3);
    objectNodes.push(node);

    var material = new cc3d.BasicMaterial();
    material.texture = texture2;
    material.alphaTest = 0.1;
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));

    material.blend = true;
    material.blendSrc = cc3dEnums.BLENDMODE_SRC_ALPHA;
    material.blendDst = cc3dEnums.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    material.opacity = 0.2;

    node = initObjectNode();
    node.translate(3.5, 2, -3);
    //node.setLocalScale(3,3,3);
    objectNodes.push(node);
    var material = new cc3d.BasicPhongMaterial();
    material.texture = texture;
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, sphereMesh, material));

    node = initObjectNode();
    node.translate(6.5, 2, -3);
    //node.setLocalScale(3,3,3);
    objectNodes.push(node);
    var material = new cc3d.BasicPhongMaterial();
    material.texture = texture;
    material.color = new cc3d.math.Vec3(1,1,1);
    material.shininess = 20;
    material.specularColor = new cc3d.math.Vec3(1,0,1);
    material.blend = true;
    material.blendSrc = cc3dEnums.BLENDMODE_SRC_ALPHA;
    material.blendDst = cc3dEnums.BLENDMODE_ONE_MINUS_SRC_ALPHA;
    material.opacity = 0.5;

    scene.addMeshInstance(new cc3d.MeshInstance(node, sphereMesh, material));

    {
        node = initObjectNode();
        node.translate(3, -6.5, -3);
        objectNodes.push(node);

        material = new cc3d.Material();
        material.setShader(initGLProgram());
        material._generateRenderKey();
        //material
        //material.texture = texture;
        scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));
    }


    node = initObjectNode();
    node.translate(-3.5, 2, -3);
    //node.setLocalScale(3,3,3);
    objectNodes.push(node);
    material = new cc3d.BasicPhongMaterial();
    //material.texture = texture;
    material.color = new cc3d.math.Vec3(1,0,1);
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, sphereMesh, material));


    node = initObjectNode();
    node.translate(-9.5, 2, -3);
    objectNodes.push(node);
    material = new cc3d.BasicPhongMaterial();
    material.texture = texture2;
    material.alphaTest = 0.1;
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));

    //init platform
    node = initObjectNode();
    node.translate(0,0,0);
    node.setLocalScale(10,0.1,10);
    //objectNodes.push(node);
    material = new cc3d.BasicPhongMaterial();
    //material.texture = texture2;
    material.alphaTest = 0.1;
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));

    //init right wall
    node = initObjectNode();
    node.translate(10,0,0);
    node.setLocalScale(0.1,10,10);
    //objectNodes.push(node);
    material = new cc3d.BasicPhongMaterial();
    //material.texture = texture2;
    material.alphaTest = 0.1;
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));

    //init left wall
    node = initObjectNode();
    node.translate(-8,-4,0);
    node.setLocalScale(0.1,10,10);
    var rotate = new cc3d.math.Quat();
    rotate.setFromAxisAngle(new cc3d.math.Vec3(0,1,0),45);
    node.setRotation(rotate);
    //objectNodes.push(node);
    material = new cc3d.BasicPhongMaterial();
    //material.texture = texture2;
    material.color = new cc3d.math.Vec3(0.2,0.8,0.3);
    material.useLambertLighting = true;
    scene.addMeshInstance(new cc3d.MeshInstance(node, boxMesh, material));

    renderer = new cc3d.ForwardRenderer(device);

    //init light
    var light = new cc3d.Light();
    node = initObjectNode();
    //objectNodes.push(node);
    node.rotate(0,90,0);
    node.rotate(0,0,-30);
    //node.setLocalEulerAngles(new cc3d.math.Vec3(0,90,-60));
    light._node = node;
    //light._direction = new cc3d.math.Vec3(0, -1, 0);
    light.setColor(new cc3d.math.Vec3(0.6,0.6,0.6));
    light.setCastShadows(true);
    scene.addLight(light);
    var generalRange = 10;
    initPointLight(scene, new cc3d.math.Vec3(-10,4,0), new cc3d.math.Vec3(1.0,0.0,0.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(-5,4,0), new cc3d.math.Vec3(0.0,1.0,0.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(0,4,0), new cc3d.math.Vec3(0.0,0.0,1.0), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(5,4,0), new cc3d.math.Vec3(0,0.5,0.5), generalRange);

    initPointLight(scene, new cc3d.math.Vec3(10,4,0), new cc3d.math.Vec3(0.5,0.5,0), generalRange);

    scene._sceneAmbient = new cc3d.math.Vec3(0.2,0.2,0.2);

};

function run3d() {
    canvas = document.getElementById("gameCanvas");
    device = new cc3d.graphics.GraphicsDevice(canvas);
    initTextures();
    initJasonMesh();
    boxMesh = initMesh();
    sphereMesh = initSphereMesh(1.5, 32, 32);
    initScene();
    setTimeout(function() {
        tick();
    },1000);
    //tick();
};
