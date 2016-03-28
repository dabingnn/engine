'use strict';

var ForwardRenderer = function (graphicDevice) {
    this.device = graphicDevice;
    var scope = this.device.scope;
    this.worldViewProjectionID = scope.resolve('worldViewProjection');
};

ForwardRenderer.prototype = {
    render: function(scene, camera) {
        var device = this.device;
        var scope = this.device.scope;
        var meshes = scene.getMeshInstance();
        for(var index = 0, meshCount = meshes.length; index < meshCount; ++index ) {
            var meshInstance = meshes[index];
            var wvp_mat = meshInstance.node.getWorldTransform().clone();
            var view_matrix = camera._node.getWorldTransform().clone().invert();
            var projection_matrix = camera.getProjectionMatrix();
            wvp_mat.mul2(view_matrix,wvp_mat);
            wvp_mat.mul2(projection_matrix,wvp_mat);

            this.worldViewProjectionID.setValue(wvp_mat.data);
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
