'use strict';

var Input = require('./input');
var cameraUtils = require('./camera');
var gizmos = require('./gizmos');

var debugCamera;
var debugInput;

function addDebugCamera(scene, position, rotation) {
    if ( debugCamera ) {
        scene.addChild(debugCamera);
        return;
    }

    // debug camera
    var node = new cc.Node3D('Debug Camera');
    node.setWorldPosition(position);
    node.setWorldRotation(rotation);

    //
    var camera = node.addComponent('cc.CameraComponent');
    camera.projection = cc3d.PROJECTION_PERSPECTIVE;
    camera.fov = 60.0;
    camera.near = 0.01;
    camera.far = 1000.0;
    camera.clearColor = new cc.ColorF(0.3,0.3,0.3,1.0);

    scene.addChild(node);
    debugCamera = node;

    cameraUtils.init (debugCamera);
}

function removeDebugCamera() {
    if ( debugCamera ) {
        debugCamera.parent = null;
    }
}

function _tick() {
    var scene = cc.director.getScene();
    var dt = cc.director._deltaTime;

    cameraUtils.tick (dt, debugCamera, debugInput);
    debugInput.reset();

    gizmos.drawGrid(scene);
}

window.debug = function () {
    var debugMode = false;

    cc.game.canvas.addEventListener('debug', () => {
        debugMode = !debugMode;
        var scene = cc.director.getScene();
        var cameras = scene.getComponentsInChildren(cc.CameraComponent);

        // trun on/off debug mode
        if (debugMode) {
            cameras.forEach(cam => {
                cam.enabled = false;
            });

            var camPos = cc.Vec3.ZERO;
            var camRotation = cc.Quat.IDENTITY;

            if ( cameras.length > 0 ) {
                var camNode = cameras[0].node;
                camPos = camNode.getWorldPosition();
                camRotation = camNode.getWorldRotation();
            }

            camPos = new cc.Vec3(5.0, 5.0, 5.0);
            let rot = cc.Mat4.IDENTITY;
            rot.setLookAt(
                camPos,
                new cc.Vec3(0, 0, 0),
                new cc.Vec3(0, 1, 0)
            );
            camRotation.setFromMat4(rot);

            debugInput = new Input(cc.game.canvas);
            addDebugCamera(scene, camPos, camRotation);

            cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, _tick);
        } else {
            removeDebugCamera();
            if (debugInput) {
                debugInput.destroy();
                debugInput = null;
            }

            cameras.forEach(cam => {
                cam.enabled = true;
            });

            cc.director.off(cc.Director.EVENT_BEFORE_UPDATE, _tick);
        }
    });

    cc.game.canvas.addEventListener('pause', () => {
        cc.game.pause();
    });

    cc.game.canvas.addEventListener('play', () => {
        cc.game.resume();
    });
};
