'use strict';

var ForwardRenderer = function (graphicDevice) {
    this.device = graphicDevice;
    var scope = this.device.scope;
    //'uniform mat4 world;' +
    //'uniform mat4 view;' +
    //'uniform mat4 projection;' +
    //'uniform mat4 worldViewProjection;' +
    //'uniform vec3 lightDirInWorld;' +
    //'uniform vec3 lightColor;' +
    this.worldID = scope.resolve('world');
    this.viewID = scope.resolve('view');
    this.projectionID = scope.resolve('projection');
    this.lightDirID = scope.resolve('lightDirInWorld');
    this.lightColorID = scope.resolve('lightColor');
    this.worldViewProjectionID = scope.resolve('worldViewProjection');
    this.normalMatrixID = scope.resolve('matrix_normal');
    this.sceneAmbientID = scope.resolve('sceneAmbient');
};

ForwardRenderer.prototype = {
    render: function(scene, camera) {
        var device = this.device;
        var meshes = scene.getMeshInstance();
        for(var index = 0, meshCount = meshes.length; index < meshCount; ++index ) {
            var meshInstance = meshes[index];
            var world_matrix = meshInstance.node.getWorldTransform().clone();
            var normal_matrix = world_matrix.clone();
            normal_matrix.invert();
            normal_matrix.transpose();
            var view_matrix = camera._node.getWorldTransform().clone().invert();
            var projection_matrix = camera.getProjectionMatrix();
            var wvp_matrix = world_matrix.clone();
            wvp_matrix.mul2(view_matrix,wvp_matrix);
            wvp_matrix.mul2(projection_matrix,wvp_matrix);

            this.worldID.setValue(world_matrix.data);
            this.normalMatrixID.setValue(normal_matrix.data);
            this.viewID.setValue(view_matrix.data);
            this.projectionID.setValue(projection_matrix.data);
            this.worldViewProjectionID.setValue(wvp_matrix.data);
            this.lightColorID.setValue(scene._light._color.data);
            this.sceneAmbientID.setValue(scene._sceneAmbient.data);
            var lightDir = scene._light._direction.clone();
            lightDir = scene._light._node.getWorldTransform().transformVector(lightDir);
            this.lightDirID.setValue(lightDir.data);
            meshInstance.material.updateShader(device, scene);
            meshInstance.material.update();
            device.setShader(meshInstance.material.getShader());
            meshInstance.material.setParameters(device);
            //apply vertexBuffer
            for(var vertNumber = meshInstance.mesh.vertexBuffer.length, vertIndex = vertNumber-1; vertIndex >= 0;--vertIndex ) {
                device.setVertexBuffer(meshInstance.mesh.vertexBuffer[vertIndex],vertIndex);
            }
            if(meshInstance.mesh.indexBuffer) {
                device.setIndexBuffer(meshInstance.mesh.indexBuffer);
            }
            device.draw(meshInstance.mesh.primitive);
        }
    }
};

cc3d.ForwardRenderer = ForwardRenderer;
