'use strict';

module.exports = {
    drawGrid (scene) {
        let vertices = [];
        let colors = [];

        let width = 100;
        let length = 100;
        let seg = 100;

        let hw = width * 0.5;
        let hl = length * 0.5;
        let dw = width / seg;
        let dl = length / seg;

        for ( let x = -hw; x <= hw; x += dw ) {
            vertices.push( new cc.Vec3(x, 0, -hl) );
            vertices.push( new cc.Vec3(x, 0, hl) );

            colors.push( new cc.ColorF(0.5, 0.5, 0.5, 0.5) );
            colors.push( new cc.ColorF(0.5, 0.5, 0.5, 0.5) );
        }
        for ( let z = -hl; z <= hl; z += dl ) {
            vertices.push( new cc.Vec3(-hw, 0, z) );
            vertices.push( new cc.Vec3(hw, 0, z) );

            colors.push( new cc.Color(0.5, 0.5, 0.5, 0.5) );
            colors.push( new cc.Color(0.5, 0.5, 0.5, 0.5) );
        }

        // cc._renderContext;
        // scene._sgScene.renderLines( vertices, colors );
        scene.immediateRenderer.renderLines( vertices, colors );
    }
};
