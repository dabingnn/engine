function initScene () {
    cc.view.enableRetina(false);
    if (cc.sys.isNative) {
        var resolutionPolicy = (cc.sys.os == cc.sys.OS_WP8 || cc.sys.os == cc.sys.OS_WINRT) ? cc.ResolutionPolicy.SHOW_ALL : cc.ResolutionPolicy.FIXED_HEIGHT;
        cc.view.setDesignResolutionSize(800, 450, resolutionPolicy);
        cc.view.resizeWithBrowserSize(true);
    }

    window.debug();

    var url = 'assets/gltf-exports/scene.gltf';
    window.gltf.loader.loadScene(url, function (err, scene) {
        if (err) {
            console.error(`Failed to load ${url}: ${err}`);
            return;
        }

        // node
        var node = new cc.Node3D();
        node.setLocalPosition(new cc.Vec3(0,0,-10));
        scene.addChild(node);

        // light
        var light = node.addComponent('cc.LightComponent');
        light.color = new cc.ColorF(0.8, 0.8, 0.8);
    });
}

cc.game._is3D = true;
cc.game.run({
    id : 'gameCanvas',
    debugMode: 1,
    renderMode: 2,
    showFPS: 1,
    frameRate: 60,
}, initScene);
