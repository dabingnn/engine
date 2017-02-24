var gltf = window.gltf;
var Font = function (data, texture) {
    this.data = data;
    this.texture = texture;
    var shaderDefinition = {
        attributes: {
            aPosition: cc3d.SEMANTIC_POSITION,
            aUv0: cc3d.SEMANTIC_TEXCOORD0
        },
        vshader: cc3d.shaderChunks.msdfVS,
        fshader: cc3d.shaderChunks.msdfPS.replace("[PRECISION]", "precision highp float;"),
    };
    var shaderDefinition = {
        attributes: {
            aPosition: cc3d.SEMANTIC_POSITION,
            aUv0: cc3d.SEMANTIC_TEXCOORD0
        },
        vshader: cc3d.shaderChunks.msdfVS,
        fshader: cc3d.shaderChunks.msdfPS.replace("[PRECISION]", "precision highp float;"),
    };

    var shader = new cc3d.Shader(cc.renderer.device, shaderDefinition);

    var material = new cc3d.Material();
    material.setShader(shader);

    material.setParameter("texture_atlas", texture);
    material.setParameter("material_background", [0,0,0,0]);
    material.setParameter("material_foreground", [1.0,1.0,1.0,1]);
    material.blendType = cc3d.BLEND_PREMULTIPLIED;
    material.cull = cc3d.CULLFACE_NONE;
    material.depthWrite = false;
    material.depthTest = false;

    this.material = material;
    this.em = 1;
    this._lineHeight = 1;
};

Font.prototype.getUv = function(json, char) {
    var data = json;
    var width = data.info.width;
    var height = data.info.height;

    if (!data.chars[char]) {
        // missing char
        return [0,0,1,1];
    }

    var x = data.chars[char].x;
    var y =  data.chars[char].y;

    var x1 = x;
    var y1 = y;
    var x2 = (x + data.chars[char].width);
    var y2 = (y - data.chars[char].height);
    var edge = 1 - (data.chars[char].height / height)
    return [
        x1 / width,
        edge - (y1 / height), // bottom left

        (x2 / width),
        edge - (y2 / height)  // top right
    ];
};

Font.prototype.createMesh = function (testString, lineHeight) {
    lineHeight = lineHeight || 1.0;
    var l = testString.length;
    // create empty arrays
    var positions = new Array(l*3*4);
    var normals = new Array(l*3*4);
    var uvs = new Array(l*2*4);
    var indices = new Array(l*3*2);

    // create index buffer now
    // index buffer doesn't change as long as text length stays the same
    for (var i = 0; i < l; i++) {
        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var cursorX = 0;
    var cursorY = 0;
    var cursorZ = 0;
    var miny = Number.MAX_VALUE;
    var maxy = Number.MIN_VALUE;
    var json = this.data;
    var lines = 0;
    for(var i = 0; i < l; ++i) {
        var char = testString.charCodeAt(i);
        var data = json.chars[char];

        if (char === 10 || char === 13) {
            // add forced line-break
            cursorY -= lineHeight * this.em;
            cursorX = 0;
            lines++;
            continue;
        }

        var x = 0;
        var y = 0;
        var scale = 0;
        var advance = 0;
        if (data && data.scale) {
            scale = 1 / data.scale;
            advance = data.xadvance / data.width;
            x = data.xoffset / data.width;
            y = data.yoffset / data.height;
        } else {
            // missing character
            advance = 0.5;
            x = 0;
            y = 0;
            scale = 0.01;
        }
        //fill positions and calculate width
        positions[i*4*3+0] = cursorX + x;
        positions[i*4*3+1] = cursorY - y;
        positions[i*4*3+2] = cursorZ;

        positions[i*4*3+3] = cursorX + x - scale;
        positions[i*4*3+4] = cursorY - y;
        positions[i*4*3+5] = cursorZ;

        positions[i*4*3+6] = cursorX + x - scale;
        positions[i*4*3+7] = cursorY - y + scale;
        positions[i*4*3+8] = cursorZ;

        positions[i*4*3+9]  = cursorX + x;
        positions[i*4*3+10] = cursorY - y + scale;
        positions[i*4*3+11] = cursorZ;

        if (positions[i*4*3+7] > maxy) maxy = positions[i*4*3+7];
        if (positions[i*4*3+1] < miny) miny = positions[i*4*3+1];

        // advance cursor
        var spacing = 1;
        cursorX = cursorX - (spacing*advance);

        normals[i*4*3+0] = 0;
        normals[i*4*3+1] = 0;
        normals[i*4*3+2] = -1;

        normals[i*4*3+3] = 0;
        normals[i*4*3+4] = 0;
        normals[i*4*3+5] = -1;

        normals[i*4*3+6] = 0;
        normals[i*4*3+7] = 0;
        normals[i*4*3+8] = -1;

        normals[i*4*3+9] = 0;
        normals[i*4*3+10] = 0;
        normals[i*4*3+11] = -1;
        var uv = this.getUv(json, char);

        uvs[i*4*2+0] = uv[0];
        uvs[i*4*2+1] = uv[1];

        uvs[i*4*2+2] = uv[2];
        uvs[i*4*2+3] = uv[1];

        uvs[i*4*2+4] = uv[2];
        uvs[i*4*2+5] = uv[3];

        uvs[i*4*2+6] = uv[0];
        uvs[i*4*2+7] = uv[3];

        indices.push((i*4), (i*4)+1, (i*4)+3);
        indices.push((i*4)+2, (i*4)+3, (i*4)+1);
    }

    var mesh = cc3d.createMesh(cc.renderer.device, positions, {uvs: uvs, normals: normals, indices: indices});

    return mesh;
};

function initScene () {
    cc.view.enableRetina(false);
    if (cc.sys.isNative) {
        var resolutionPolicy = (cc.sys.os == cc.sys.OS_WP8 || cc.sys.os == cc.sys.OS_WINRT) ? cc.ResolutionPolicy.SHOW_ALL : cc.ResolutionPolicy.FIXED_HEIGHT;
        cc.view.setDesignResolutionSize(800, 450, resolutionPolicy);
        cc.view.resizeWithBrowserSize(true);
    }

    var fontFile = 'assets/gltf-exports/fonts/Arial.json';
    var fontImage = 'assets/gltf-exports/fonts/Arial.png';
    var labelMesh;
    var labelMtl;
    gltf.loader.loadFont(fontFile, fontImage, function (err, data) {
        var testString = 'Hello \nLabel';
        var json = data.json;
        var img = data.texture;
        var texture = new cc3d.Texture({format: cc3d.PIXELFORMAT_R8_G8_B8_A8});
        texture.setSource(img);

        var font = new Font(json, texture);

        labelMesh = font.createMesh(testString, 1.1);

        labelMtl = font.material;

    });

    var url = 'assets/gltf-exports/scene.gltf';
    gltf.loader.loadScene(url, function (err, scene) {
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
        node.setLocalPosition(new cc.Vec3(-23.34,8.49,-32));
        node.setLocalRotation(new cc.Quat().setFromAxisAngle(cc.Vec3.UP, -90));
        node.setLocalScale(3,3,3);
        scene.addChild(node);
        scene._sgScene.drawCalls.push(new cc3d.MeshInstance(node, labelMesh, labelMtl));
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
