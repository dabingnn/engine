/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and  non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Chukong Aipu reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var Component = require('../../core/components/CCComponent');

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

var Model = cc.Class({
    name: 'cc.Model',
    extends: Component,

    editor: CC_EDITOR && {
        executeInEditMode: true,
    },

    ctor: function () {
        var material = this.material = new pc.StandardMaterial();
        material.diffuse = new pc.Color(1.0,1,1);
        material.update();
        this.model = new pc.Model();
        this.mesh = initSphereMesh(cc._renderContext,10,32,32);
    },

    start: function() {
    },
    firstEnableTest: function() {
        if(!this._firstEnableCalled) {
            var modelNode = this.node;
            var model = this.model;
            model.graph = modelNode._sgNode;
            model.meshInstances.push(new pc.MeshInstance(modelNode._sgNode,this.mesh, this.material));
            model.getGraph().syncHierarchy();
            this._firstEnableCalled = true;
        }
    },
    onEnable: function() {
        this.firstEnableTest();
        var scene = cc.director.getScene();
        scene._sgScene.addModel(this.model);
    },
    onDisable: function() {
        var scene = cc.director.getScene();
        scene._sgScene.removeModel(this.model);
    },
    onDestroy: function() {

    },
    onFocusInEditor: function() {

    },
    onLostFocusInEditor: function() {

    }

});

cc.Model = module.exports = Model;