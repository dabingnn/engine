'use strict';

let cameraState = {
    theta: 0,
    phi: 0,
    eye: cc.Vec3.ZERO,
};

let df = 0;
let dr = 0;

let panX = 0;
let panY = 0;
let panZ = 0;

let moveSpeed = 10.0;
let damping = 10.0;

let curPhi = cameraState.phi;
let curTheta = cameraState.theta;
let curEye = cameraState.eye.clone();
let curEyeStep = cameraState.eye.clone();

let front = cc.Vec3.ZERO;
let up = cc.Vec3.ZERO;
let right = cc.Vec3.ZERO;

let tmpVec = cc.Vec3.ZERO;
let tmpMat = cc.Mat4.IDENTITY;
let tmpRot = cc.Quat.IDENTITY;

module.exports = {
    init (node) {
        // let euler = node.getWorldEulerAngles();
        let euler = node.getWorldRotation().getEulerAngles();
        let pos = node.getWorldPosition();

        cameraState.phi = euler.x * cc.MathUtils.DEG_TO_RAD;
        cameraState.theta = euler.y * cc.MathUtils.DEG_TO_RAD;
        cameraState.eye = pos.clone();

        curPhi = cameraState.phi;
        curTheta = cameraState.theta;
        curEye = cameraState.eye.clone();
    },

    tick (dt, node, input) {
        // handle input
        _handleInput(input);

        // update camera
        _tick(dt, node);
    }
};

function lerp(from, to, ratio) {
    return from + (to - from) * ratio;
}

function _handleInput(input) {
    df = 0, dr = 0;
    panX = 0, panY = 0, panZ = 0;

    if (input.keypress('mouse-left') && input.keypress('mouse-right')) {
        let dx = input.mouseDeltaX;
        let dy = input.mouseDeltaY;

        panX = dx;
        panY = -dy;

    } else if (input.keypress('mouse-left')) {
        let dx = input.mouseDeltaX;
        let dy = input.mouseDeltaY;

        cameraState.theta -= dx * 0.002;
        panZ = -dy;

    } else if (input.keypress('mouse-right')) {
        let dx = input.mouseDeltaX;
        let dy = input.mouseDeltaY;

        cameraState.theta -= dx * 0.002;
        cameraState.phi -= dy * 0.002;
    }

    if (input.keypress('w')) {
        df += 1;
    }
    if (input.keypress('s')) {
        df -= 1;
    }
    if (input.keypress('a')) {
        dr -= 1;
    }
    if (input.keypress('d')) {
        dr += 1;
    }

    if (input.mouseScrollY) {
        df -= input.mouseScrollY * 0.05;
    }
}

function _tick(dt, node) {
    //
    curPhi = lerp(curPhi, cameraState.phi, dt * damping);
    curTheta = lerp(curTheta, cameraState.theta, dt * damping);

    //
    let eye = cameraState.eye;
    let theta = curTheta;
    let phi = curPhi;

    // phi == rot_x, theta == rot_y

    tmpMat.setFromEulerAngles(
         phi * cc.MathUtils.RAD_TO_DEG,
         theta * cc.MathUtils.RAD_TO_DEG,
         0
    );

    front.set(0, 0, -1);
    tmpMat.transformVector(front,front);

    up.set(0, 1, 0);
    tmpMat.transformVector(up,up);

    right.set(1, 0, 0);
    tmpMat.transformVector(right,right);

    if (df !== 0) {
        tmpVec.copy(front);
        tmpVec.scale(df * dt * moveSpeed);
        eye.add(tmpVec);
    }

    if (dr !== 0) {
        tmpVec.copy(right);
        tmpVec.scale(dr * dt * moveSpeed);
        eye.add(tmpVec);
    }

    if (panZ !== 0) {
        tmpVec.copy(front);
        tmpVec.y = 0.0;
        tmpVec.normalize();
        tmpVec.scale(panZ * dt * moveSpeed);
        eye.add(tmpVec);
    }

    if (panX !== 0) {
        tmpVec.copy(right);
        tmpVec.y = 0.0;
        tmpVec.normalize();
        tmpVec.scale(panX * dt * moveSpeed);
        eye.add(tmpVec);
    }

    if (panY !== 0) {
        tmpVec.set(0,1,0);
        tmpVec.scale(panY * dt * moveSpeed);
        eye.add(tmpVec);
    }

    curEye.lerp(curEye, eye, dt * damping);

    //
    curEyeStep.copy(curEye).add(front);
    tmpMat.setLookAt(
        curEye,
        curEyeStep,
        up
    );
    tmpRot.setFromMat4(tmpMat);

    node.setWorldPosition(curEye);
    node.setWorldRotation(tmpRot);
}
