/****************************************************************************
 Copyright (c) 2010-2012 cocos2d-x.org
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011      Zynga Inc.

 http://www.cocos2d-x.org


 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

/**
 * A brief explanation for "project.json":
 * Here is the content of project.json file, this is the global configuration for your game, you can modify it to customize some behavior.
 * The detail of each field is under it.
 {
    "debugMode"     : 1,
    // "debugMode" possible values :
    //      0 - No message will be printed.
    //      1 - cc.error, cc.assert, cc.warn, cc.log will print in console.
    //      2 - cc.error, cc.assert, cc.warn will print in console.
    //      3 - cc.error, cc.assert will print in console.
    //      4 - cc.error, cc.assert, cc.warn, cc.log will print on canvas, available only on web.
    //      5 - cc.error, cc.assert, cc.warn will print on canvas, available only on web.
    //      6 - cc.error, cc.assert will print on canvas, available only on web.

    "showFPS"       : true,
    // Left bottom corner fps information will show when "showFPS" equals true, otherwise it will be hide.

    "frameRate"     : 60,
    // "frameRate" set the wanted frame rate for your game, but the real fps depends on your game implementation and the running environment.

    "id"            : "gameCanvas",
    // "gameCanvas" sets the id of your canvas element on the web page, it's useful only on web.

    "renderMode"    : 0,
    // "renderMode" sets the renderer type, only useful on web :
    //      0 - Automatically chosen by engine
    //      1 - Forced to use canvas renderer
    //      2 - Forced to use WebGL renderer, but this will be ignored on mobile browsers

    "engineDir"     : "../../frameworks/cocos2d-html5/",
    // In debug mode, if you use the whole engine to develop your game, you should specify its relative path with "engineDir",
    // but if you are using a single engine file, you can ignore it.

    "modules"       : ["cocos2d", "extensions", "external"],
    // "modules" defines which modules you will need in your game, it's useful only on web,
    // using this can greatly reduce your game's resource size, and the cocos console tool can package your game with only the modules you set.
    // For details about modules definitions, you can refer to "../../frameworks/cocos2d-html5/modulesConfig.json".

    "plugin": {
        "facebook": {
            "appId" : "1426774790893461",
            "xfbml" : true,
            "version" : "v2.0"
        }
    },
    // "plugin" is used by plugin-x for its settings, if you don't use it, you can ignore it.

    "jsList"        : [
    ]
    // "jsList" sets the list of js files in your game.
 }
 *
 */

if(cc.sys){
    var scene3SearchPaths = cc.sys.localStorage.getItem("Scene3SearchPaths");
    if (scene3SearchPaths)
        jsb.fileUtils.setSearchPaths(JSON.parse(scene3SearchPaths));
}

function initSphereMesh( device, radius, widthSegments, heightSegments, phiStart, phiLength, thetaStart, thetaLength ) {


    radius = radius || 1;

    widthSegments = Math.max( 3, Math.floor( widthSegments ) || 8 );
    heightSegments = Math.max( 2, Math.floor( heightSegments ) || 6 );

    phiStart = phiStart !== undefined ? phiStart : 0;
    phiLength = phiLength !== undefined ? phiLength : Math.PI * 2;

    thetaStart = thetaStart !== undefined ? thetaStart : 0;
    thetaLength = thetaLength !== undefined ? thetaLength : Math.PI;

    var thetaEnd = thetaStart + thetaLength;

    var vertexCount = ( ( widthSegments + 1 ) * ( heightSegments + 1 ) );

    var positions = new Float32Array(vertexCount * 8);
    var normals = new Float32Array(vertexCount * 3);
    var uvs = new Float32Array(vertexCount * 2);

    var index = 0, vertices = [], normal = new pc.Vec3();

    for ( var y = 0; y <= heightSegments; y ++ ) {

        var verticesRow = [];

        var v = y / heightSegments;

        for ( var x = 0; x <= widthSegments; x ++ ) {

            var u = x / widthSegments;

            var px = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
            var py = radius * Math.cos( thetaStart + v * thetaLength );
            var pz = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

            normal.set( px, py, pz ).normalize();

            positions[8 * index] = px;
            positions[8 * index + 1] = py;
            positions[8 * index + 2] = pz;

            positions[8 * index + 3] = normal.x;
            positions[8 * index + 4] = normal.y;
            positions[8 * index + 5] = normal.z;

            positions[8 * index + 6] = u;
            positions[8 * index + 7] = 1-v;

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

    var mesh = new pc.Mesh();

    var vertexFormat = new pc.VertexFormat(device,
        [
            {semantic:pc.SEMANTIC_POSITION,type:pc.ELEMENTTYPE_FLOAT32, components:3},
            {semantic:pc.SEMANTIC_NORMAL,type:pc.ELEMENTTYPE_FLOAT32, components:3},
            {semantic:pc.SEMANTIC_TEXCOORD0,type:pc.ELEMENTTYPE_FLOAT32, components:2}
        ]
    );
    var vertexBuffer = new pc.VertexBuffer(device, vertexFormat,positions.length/8);
    vertexBuffer.setData(positions);


    mesh.vertexBuffer= vertexBuffer;

    var indexBuffer = new pc.IndexBuffer(device, pc.INDEXFORMAT_UINT16,indices.length);

    //var indexArray = new Uint16Array(indexBuffer.lock());
    //indexArray.set(indices);
    var indexArray = new Uint16Array(indices);
    //indexArray.set(indices);
    indexBuffer.storage = indexArray;

    indexBuffer.unlock();

    mesh.indexBuffer = [indexBuffer];
    mesh.primitive = [ {
        type: pc.PRIMITIVE_TRIANGLES,
        indexed: true,
        base: 0,
        count: indexBuffer.getNumIndices(),
    }];
    return mesh;

};
function initScene3D(rootNode, scene) {
    var lightNode1 = new pc.GraphNode();
    rootNode.addChild(lightNode1);
    lightNode1.setLocalRotation(new pc.Quat(1,1,0,0).normalize());
    var light = new pc.Light();
    light.setColor(0.8,0.0,0.6);
    light.setEnabled(true);
    scene.addLight(light);
    light._node = lightNode1;

    var lightNode2 = new pc.GraphNode();
    rootNode.addChild(lightNode2);
    lightNode2.setLocalRotation(new pc.Quat(1,-1,0,0).normalize());
    var light2 = new pc.Light();
    light2.setColor(0.0,1.0,0.0);
    light2.setEnabled(true);
    scene.addLight(light2);
    light2._node = lightNode2;

    var modelNode = new pc.GraphNode();
    modelNode.setLocalScale(1,2,1);
    modelNode.setLocalPosition(0,0,0);
    var mesh = initSphereMesh(cc._renderContext,10,32,32);
    var model = new pc.Model();
    var material = new pc.StandardMaterial();
    material.diffuse = new pc.Color(1.0,1,1);
    material.update();
    model.graph = modelNode;
    model.meshInstances.push(new pc.MeshInstance(modelNode,mesh, material));
    model.getGraph().syncHierarchy();
    scene.addModel(model);

    rootNode.addChild(modelNode);
}

cc.game3D.run({
    "debugMode"     : 1,
    "showFPS"       : true,
    "frameRate"     : 60,
    "id"            : "gameCanvas",
    "renderMode"    : 0,

    "jsList"        : []
}, function(){
    var scene = new cc.Scene3D();
    var camera = scene._addEditorCamera();
    var cameraNode = camera._node;
    cameraNode.setPosition(new pc.Vec3(0, 0, 50));
    camera._clearOptions.color[0] = 1.0;
    initScene3D(scene._sgNode, scene._sgScene);
    cc.director.runSceneImmediate3D(scene);
});
