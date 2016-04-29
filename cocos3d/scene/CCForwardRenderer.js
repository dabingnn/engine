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
    this.worldID = scope.resolve('matrix_world');
    this.viewID = scope.resolve('matrix_view');
    this.projectionID = scope.resolve('matrix_projection');
    this.lightDirID = scope.resolve('lightDirInWorld');
    this.lightColorID = scope.resolve('lightColor');
    this.worldViewProjectionID = scope.resolve('matrix_worldviewprojection');
    this.normalMatrixID = scope.resolve('matrix_normal');
    this.worldViewID = scope.resolve('matrix_worldview');
    this.sceneAmbientID = scope.resolve('u_scene_ambient');
    this.cameraPosID = scope.resolve('u_camera_position');
};

function sortDrawCalls(drawCallA, drawCallB) {
    if(drawCallA.material.blend && drawCallB.material.blend) {
        return drawCallA.sortDistance - drawCallB.sortDistance;
    } else if (drawCallA.material.blend) {
        return 1;
    } else if(drawCallB.material.blend) {
        return -1;
    } else {
        return drawCallB.material.renderID - drawCallA.material.renderID;
    }
}
var shadowCameraResulotion = 1024;
function createShadowMap(forwardRender ,scene, light) {
    var device = forwardRender.device;

    var camera = new cc3d.Camera();
    camera.setClearOptions({
        color: [1.0, 1.0, 1.0, 1.0],
        depth: 1.0,
        flags: cc3d.graphics.Enums.CLEARFLAG_COLOR | cc3d.graphics.Enums.CLEARFLAG_DEPTH
    });
    camera._node = new cc3d.GraphNode();
    var renderTarget = new cc3d.graphics.RenderTarget(device, shadowCameraResulotion, shadowCameraResulotion, {
        face: 0, depth: true, textureColorBuffer: true
    });
    camera.setRenderTarget(renderTarget);
    return camera;
}

ForwardRenderer.prototype = {
    dispatchLights: function(scene) {
        var scope = this.device.scope;
        var index = 0, lightCount = scene._directionalLights.length;
        var lightColor = new Float32Array(3 * lightCount);
        var lightdirection = new Float32Array(3 * lightCount); //used for
        //update scopeID
        for(; index < lightCount; ++index) {
            var light = scene._directionalLights[index];
            lightColor[3* index + 0] = light._color.x;
            lightColor[3* index + 1] = light._color.y;
            lightColor[3* index + 2] = light._color.z;
            var lightDir = cc3d.math.Vec3.FORWARD;
            lightDir = light._node.getWorldTransform().transformVector(lightDir);
            lightdirection[3* index + 0] = lightDir.x;
            lightdirection[3* index + 1] = lightDir.y;
            lightdirection[3* index + 2] = lightDir.z;
        }

        scope.resolve('u_directional_light_color[0]').setValue(lightColor);
        scope.resolve('u_directional_light_direction[0]').setValue(lightdirection);
        index = 0; lightCount = scene._pointLights.length;
        lightColor = new Float32Array(3 * lightCount);
        var lightPos = new Float32Array(3 * lightCount);
        var lightRange = new Float32Array(lightCount);
        for(;index <lightCount; ++index) {
            var light = scene._pointLights[index];
            lightColor[3* index + 0] = light._color.x;
            lightColor[3* index + 1] = light._color.y;
            lightColor[3* index + 2] = light._color.z;

            var lightPosition = light._position.clone();
            lightPosition = light._node.getWorldTransform().transformPoint(lightPosition);

            lightPos[3* index + 0] = lightPosition.x;
            lightPos[3* index + 1] = lightPosition.y;
            lightPos[3* index + 2] = lightPosition.z;
            lightRange[index] = light._attenuationEnd;
        }

        //'uniform vec3 u_point_light_position[POINT_LIGHT_COUNT];' +
        //'uniform vec3 u_point_light_color[POINT_LIGHT_COUNT];' +
        //'uniform float u_point_light_range[POINT_LIGHT_COUNT];' +

        scope.resolve('u_point_light_color[0]').setValue(lightColor);
        scope.resolve('u_point_light_position[0]').setValue(lightPos);
        scope.resolve('u_point_light_range[0]').setValue(lightRange);
    },

    renderShadowMap: function(scene, light) {
        if(!light.shadowMapCamera) {
            light.shadowMapCamera = createShadowMap(this,scene, light);
        }
        var device = this.device;
        //update shadow camera, hard coded
        //todo: add shadow camera calculation here
        var shadowCam = light.shadowMapCamera;
        shadowCam._node.setPosition(light._node.getPosition());
        shadowCam._node.setRotation(light._node.getRotation());
        //shadowCam._node.rotateLocal(-90, 0, 0);

        shadowCam.setProjection(cc3d.SceneEnums.PROJECTION_ORTHOGRAPHIC);
        shadowCam.setNearClip(0);
        shadowCam.setFarClip(2e6);
        shadowCam.setAspectRatio(1.0);
        shadowCam.setOrthoHeight(20);
        var material = this.depthMaterial;
        if(!this.depthMaterial) {
            material = this.depthMaterial = new cc3d.DepthMaterial();
        }
        device.setRenderTarget(shadowCam.getRenderTarget());
        var gl = device.gl;
        gl.clearColor( 1.0, 1.0, 1.0, 1.0 );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        var meshes = scene.getMeshInstance();
        for(var index = 0, meshCount = meshes.length; index < meshCount; ++index ) {
            var meshInstance = meshes[index];
            var world_matrix = meshInstance._node.getWorldTransform().clone();
            var normal_matrix = world_matrix.clone();
            normal_matrix.invert();
            normal_matrix.transpose();
            var view_matrix = shadowCam._node.getWorldTransform().clone().invert();
            var projection_matrix = shadowCam.getProjectionMatrix();
            var wvp_matrix = world_matrix.clone();
            var wv_matrix = world_matrix.clone();
            wv_matrix.mul2(view_matrix, wv_matrix);
            wvp_matrix.mul2(view_matrix, wvp_matrix);
            wvp_matrix.mul2(projection_matrix, wvp_matrix);

            this.worldID.setValue(world_matrix.data);
            this.viewID.setValue(view_matrix.data);
            this.projectionID.setValue(projection_matrix.data);
            this.worldViewID.setValue(wv_matrix.data);
            this.worldViewProjectionID.setValue(wvp_matrix.data);
            this.normalMatrixID.setValue(normal_matrix.data);

            material.updateShader(device, scene);
            material.update();

            device.setShader(material.getShader());

            material.setParameters(device);
            //apply vertexBuffer
            for(var vertNumber = meshInstance.mesh.vertexBuffer.length, vertIndex = vertNumber-1; vertIndex >= 0;--vertIndex ) {
                device.setVertexBuffer(meshInstance.mesh.vertexBuffer[vertIndex],vertIndex);
            }
            if(meshInstance.mesh.indexBuffer) {
                device.setIndexBuffer(meshInstance.mesh.indexBuffer);
            }
            device.draw(meshInstance.mesh.primitive);
        }
    },

    render: function(scene, camera) {
        var device = this.device;
        var meshes = scene.getMeshInstance();
        var cameraPos = camera._node.getPosition();
        for (var i = 0, len = meshes.length; i < len; i++) {
            if(meshes[i].material.blend) {
                meshes[i].calculateDistance(cameraPos);
            }
        }

        //rendering to shadow map
        var lightCount = scene._directionalLights.length;
        for(var dirLightIndex = 0; dirLightIndex < lightCount; ++dirLightIndex) {
            var light = scene._directionalLights[dirLightIndex];
            if(light && light.getCastShadows()) {
                this.renderShadowMap(scene, light);
            }
        }

        device.setRenderTarget(camera.getRenderTarget());
        //normal rendering
        meshes.sort(sortDrawCalls);
        for(var index = 0, meshCount = meshes.length; index < meshCount; ++index ) {
            var meshInstance = meshes[index];
            var world_matrix = meshInstance._node.getWorldTransform().clone();
            var normal_matrix = world_matrix.clone();
            normal_matrix.invert();
            normal_matrix.transpose();
            var view_matrix = camera._node.getWorldTransform().clone().invert();
            var projection_matrix = camera.getProjectionMatrix();
            var wvp_matrix = world_matrix.clone();
            var wv_matrix = world_matrix.clone();
            wv_matrix.mul2(view_matrix,wv_matrix);
            wvp_matrix.mul2(view_matrix,wvp_matrix);
            wvp_matrix.mul2(projection_matrix,wvp_matrix);
            this.cameraPosID.setValue(cameraPos.data);

            this.worldID.setValue(world_matrix.data);
            this.viewID.setValue(view_matrix.data);
            this.projectionID.setValue(projection_matrix.data);
            this.worldViewID.setValue(wv_matrix.data);
            this.worldViewProjectionID.setValue(wvp_matrix.data);
            this.normalMatrixID.setValue(normal_matrix.data);
            this.sceneAmbientID.setValue(scene._sceneAmbient.data);
            this.dispatchLights(scene);
            var material = meshInstance.material;
            material.updateShader(device, scene);
            material.update();
            device.setShader(material.getShader());
            device.setBlending(material.blend);
            device.setBlendFunction(material.blendSrc, material.blendDst);
            device.setBlendEquation(material.blendEquation);
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
