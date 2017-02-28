var gltf = window.gltf;

function initScene () {
    cc.view.enableRetina(false);
    if (cc.sys.isNative) {
        var resolutionPolicy = (cc.sys.os == cc.sys.OS_WP8 || cc.sys.os == cc.sys.OS_WINRT) ? cc.ResolutionPolicy.SHOW_ALL : cc.ResolutionPolicy.FIXED_HEIGHT;
        cc.view.setDesignResolutionSize(800, 450, resolutionPolicy);
        cc.view.resizeWithBrowserSize(true);
    }

    var fontFile = 'assets/gltf-exports/fonts/Arial.json';
    var fontImage = 'assets/gltf-exports/fonts/Arial.png';
    var font;
    gltf.loader.loadFont(fontFile, fontImage, function (err, data) {
        var img = data.texture;
        var fontTexture = new cc3d.Texture({format: cc3d.PIXELFORMAT_R8_G8_B8_A8});
        fontTexture.setSource(img);
        font = new cc.MdsfFont(data.json, fontTexture);
    });


    window.debug();
    var url = 'assets/gltf-exports/scene.gltf';
    window.gltf.loader.loadScene(url, function (err, scene) {
        if (err) {
            console.error(`Failed to load ${url}: ${err}`);
            return;
        }
        cc.director.runSceneImmediate(scene);
        // node
        var node = new cc.Node3D();
        node.setLocalPosition(new cc.Vec3(0,0,-10));
        scene.addChild(node);

        // light
        var light = node.addComponent('cc.LightComponent');
        light.color = new cc.ColorF(0.8, 0.8, 0.8);

        node = new cc.Node3D();
        node.setLocalPosition(new cc.Vec3(0,50, 0));
        //node.setLocalRotation(new cc.Quat().setFromAxisAngle(cc.Vec3.UP, -90));
        scene.addChild(node);
        var label = node.addComponent('cc.LabelComponent');
        label.setText('Test label component');
        font.setBackgroundColor(new cc.ColorF(0, 1,0,0));
        font.setForegroundColor(new cc.ColorF(0.8, 0.5,0.8,1));
        label.setFont(font);
        label.screenSpace = true;
        // update input
        cc.director.on(cc.Director.EVENT_BEFORE_UPDATE, function () {
            // var dt = cc.director._deltaTime;
            // console.log(`foobar: ${dt}`);

            // TODO:
        });
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
