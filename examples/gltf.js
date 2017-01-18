var gltf = window.gltf;

function loadGLTF (url, callback) {
    gltf.resl({
        manifest: {
            'json': {
                type: 'text',
                src: url,
                parser: JSON.parse
            },
        },

        onDone: function (assets) {
            callback(null, assets.json);
        },

        onError: function (err) {
            console.error(err);
            callback(err);
        }
    });
}

function loadTextures (json, callback) {
    var manifest = {};
    var id;

    for ( id in json.textures ) {
        var gltfTexture = json.textures[id];
        var gltfImage = json.images[gltfTexture.source];

        manifest[id] = {
            type: 'image',
            src: 'assets/gltf-exports/' + gltfImage.uri
        };
    }

    gltf.resl({
        manifest: manifest,

        onDone: (assets) => {
            callback(null, assets);
        },

        onError: function (err) {
            console.error(err);
            callback(err);
        }
    });
}

function loadMaterials (json, textures) {
    var materials = {};

    for ( var id in json.materials ) {
        var gltfMaterial = json.materials[id];
        var mtl;

        if ( gltfMaterial.technique === 'diffuse' ) {
            mtl = new cc3d.StandardMaterial();

            var color = gltfMaterial.values.color;
            if ( color !== undefined ) {
                mtl.diffuse = new cc.ColorF(color[0], color[1], color[2]);
            }

            var mainTexture = gltfMaterial.values.mainTexture;
            if ( mainTexture !== undefined ) {
                mtl.diffuseMap = textures[mainTexture];
            }
        } else {
            mtl = new cc3d.StandardMaterial();
        }

        mtl.update();
        materials[id] = mtl;
    }

    return materials;
}

function loadBuffers (json, callback) {
    var manifest = {};
    var buffer2viewIDs = {};
    var bufferViews = {};
    var id;

    for ( id in json.buffers ) {
        var gltfBuffer = json.buffers[id];
        buffer2viewIDs[id] = [];

        manifest[id] = {
            type: 'binary',
            src: 'assets/gltf-exports/' + gltfBuffer.uri
        };
    }

    for ( id in json.bufferViews ) {
        var gltfBufferView = json.bufferViews[id];
        buffer2viewIDs[gltfBufferView.buffer].push(id);
    }

    gltf.resl({
        manifest: manifest,

        onDone: (assets) => {
            for ( var id in assets ) {
                var viewIDs = buffer2viewIDs[id];
                viewIDs.forEach(viewID => {
                    var gltfBufferView = json.bufferViews[viewID];
                    bufferViews[viewID] = new Uint8Array(
                        assets[id],
                        gltfBufferView.byteOffset,
                        gltfBufferView.byteLength
                    );
                });
            }

            callback(null, bufferViews);
        },

        onError: function (err) {
            console.error(err);
            callback(err);
        }
    });
}

function walk ( node, fn ) {
  node.children.forEach(child => {
    fn ( node, child );
    walk( child, fn );
  });
}

function buildVertexAndIndexBuffers (json, device, bufferViews) {
    var vbInfos = {}; // key: buffer_view_id, value: { id: position_accessor_id, position: accessor, normal: accessor, .... }
    var id;
    var vertexBuffers = {};
    var indexBuffers = {};
    var accessor, buffer;

    function updateVB ( accessorID, accessor ) {
        var info = {};
        if ( vbInfos[accessor.bufferView] === undefined ) {
            vbInfos[accessor.bufferView] = info;
        } else {
            info = vbInfos[accessor.bufferView];
        }

        info[accessor.name] = accessor;

        if ( accessor.name === 'position' ) {
            info.id = accessorID;
        }
    }

    for ( id in json.accessors ) {
        accessor = json.accessors[id];
        if (
            accessor.name === 'position' ||
            accessor.name === 'normal' ||
            accessor.name === 'tangent' ||
            accessor.name === 'color' ||
            accessor.name === 'uv0' ||
            accessor.name === 'uv1' ||
            accessor.name === 'uv2' ||
            accessor.name === 'uv3' ||
            accessor.name === 'uv4' ||
            accessor.name === 'uv5' ||
            accessor.name === 'uv6' ||
            accessor.name === 'uv7'
           ) {
            updateVB(id, accessor);
        } else if ( accessor.name.indexOf('indices') === 0 ) {
            buffer = bufferViews[accessor.bufferView];
            var bytes = new Uint8Array(buffer, accessor.byteOffset, accessor.count * 2);
            var indexBuffer = new cc3d.IndexBuffer(device, cc3d.INDEXFORMAT_UINT16, bytes.length);

            var dst = new Uint8Array(indexBuffer.lock());
            dst.set(bytes);
            indexBuffer.unlock();

            indexBuffers[id] = indexBuffer;
        }
    }

    // create vertex buffers
    for ( id in vbInfos ) {
        var info = vbInfos[id];

        if ( !info.position ) {
            console.warn('Invalid vertex buffer for ' + id);
            continue;
        }

        buffer = bufferViews[id];
        var numVertices = info.position.count;
        var vertexDesc = [];

        [
            'position', 'normal', 'tangent', 'color',
            'uv0', 'uv1', 'uv2', 'uv3', 'uv4', 'uv5', 'uv6', 'uv7',
        ].forEach(function (name) {
            var accessor = info[name];
            if ( accessor ) {
                vertexDesc.push({
                    semantic: gltf.semantics[name],
                    components: gltf.typeToCompnents(accessor.type),
                    type: gltf.toComponentTypeCC3D(accessor.componentType)
                });
            }
        });

        var format = new cc3d.VertexFormat(device, vertexDesc);
        vertexBuffers[info.id] = new cc3d.VertexBuffer(
            device,
            format,
            numVertices,
            cc3d.BUFFER_STATIC,
            buffer
        );
    }

    return {
        vertexBuffers: vertexBuffers,
        indexBuffers: indexBuffers,
    };
}

function buildMeshes (json, device, vertexBuffers, indexBuffers) {
    var result = {};
    var min = new cc.Vec3();
    var max = new cc.Vec3();

    for ( var id in json.meshes ) {
        var gltfMesh = json.meshes[id];
        gltfMesh.primitives.forEach(function (gltfPrimitive) {
            var vbID = gltfPrimitive.attributes.POSITION;
            var ibID = gltfPrimitive.indices;

            var vb = vertexBuffers[vbID];
            var ib = indexBuffers[ibID];

            var accessor = json.accessors[vbID];
            min.set(accessor.min[0], accessor.min[1], accessor.min[2]);
            max.set(accessor.max[0], accessor.max[1], accessor.max[2]);

            var aabb = new cc3d.BoundingBox();
            aabb.setMinMax(min, max);

            var idx = cc3d.RENDERSTYLE_SOLID;
            var mesh = new cc3d.Mesh();

            mesh.vertexBuffer = vb;
            if ( ib ) {
                mesh.indexBuffer[idx] = ib;
            }
            mesh.primitive[idx].type = cc3d.PRIMITIVE_TRIANGLES;
            mesh.primitive[idx].base = 0;
            mesh.primitive[idx].count = ib ? ib.numIndices : vb.numVertices;
            mesh.primitive[idx].indexed = ib !== undefined;
            mesh.aabb = aabb;

            result[ibID] = mesh;
        });
    }

    return result;
}

function recurseNode (json, node, childrenIDs, meshes ) {
    childrenIDs.forEach(nodeID => {
        var gltfNode = json.nodes[nodeID];

        // node
        var childNode = new cc.Node3D();
        childNode.name = gltfNode.name;

        // position
        if ( gltfNode.translation ) {
            childNode.setLocalPosition(new cc.Vec3(
                gltfNode.translation[0],
                gltfNode.translation[1],
                gltfNode.translation[2]
            ));
        } else {
            childNode.setLocalPosition(cc.Vec3.ZERO);
        }

        // rotation
        if ( gltfNode.rotation ) {
            childNode.setLocalRotation(new cc.Quat(
                gltfNode.rotation[0],
                gltfNode.rotation[1],
                gltfNode.rotation[2],
                gltfNode.rotation[3]
            ));
        } else {
            childNode.setLocalRotation(cc.Quat.IDENTITY);
        }

        // scale
        if ( gltfNode.scale ) {
            childNode.setLocalScale(new cc.Vec3(
                gltfNode.scale[0],
                gltfNode.scale[1],
                gltfNode.scale[2]
            ));
        } else {
            childNode.setLocalScale(cc.Vec3.ONE);
        }

        // extra information
        childNode._meshIDs = gltfNode.meshes;
        childNode._cameraID = gltfNode.camera;

        node.addChild(childNode);

        if ( gltfNode.children ) {
            recurseNode ( json, childNode, gltfNode.children, meshes );
        }
    });
}

function initScene () {
    cc.view.enableRetina(false);
    if (cc.sys.isNative) {
        var resolutionPolicy = (cc.sys.os == cc.sys.OS_WP8 || cc.sys.os == cc.sys.OS_WINRT) ? cc.ResolutionPolicy.SHOW_ALL : cc.ResolutionPolicy.FIXED_HEIGHT;
        cc.view.setDesignResolutionSize(800, 450, resolutionPolicy);
        cc.view.resizeWithBrowserSize(true);
    }

    var device = cc.game._renderDevice;
    var scene = new cc.Scene3D();

    // load scene.gltf
    loadGLTF('assets/gltf-exports/scene.gltf', function (err, json) {
        let gltfScene = json.scenes[json.scene];
        loadBuffers(json, function (err, bufferViews) {
            // pre-cache textures
            var textures = {};
            for ( var id in json.textures ) {
                var gltfTexture = json.textures[id];

                textures[id] = new cc3d.Texture(device, {
                    format: gltf.toTextureFormatCC3D(gltfTexture.format, gltfTexture.type),
                });
            }

            loadTextures(json, function (err, images) {
                for ( var id in images ) {
                    var img = images[id];

                    var gltfTexture = json.textures[id];
                    var gltfSampler = json.samplers[gltfTexture.sampler];

                    var texture = textures[id];

                    texture.minFilter = gltf.toFilterCC3D(gltfSampler.minFilter);
                    texture.magFilter = gltf.toFilterCC3D(gltfSampler.magFilter);
                    texture.addressU = gltf.toAddressCC3D(gltfSampler.wrapS);
                    texture.addressV = gltf.toAddressCC3D(gltfSampler.wrapT);
                    texture.autoMipmap = true;
                    texture.setSource(img);
                }
            });

            var materials = loadMaterials(json, textures);

            var info = buildVertexAndIndexBuffers(json, device, bufferViews);
            var meshes = buildMeshes(json, device, info.vertexBuffers, info.indexBuffers);

            recurseNode(json, scene, gltfScene.nodes, meshes);

            walk(scene, (parent, child) => {
                // add camera
                if ( child._cameraID  ) {
                    var cameraComp = child.addComponent('cc.CameraComponent');
                    var gltfCamera = json.cameras[child._cameraID];
                    var isOrtho = gltfCamera.type === 'orthographic';

                    cameraComp.projection = isOrtho ? cc3d.PROJECTION_ORTHOGRAPHIC : cc3d.PROJECTION_PERSPECTIVE;

                    if ( isOrtho ) {
                        cameraComp.nearClip = gltfCamera.orthographic.znear;
                        cameraComp.farClip = gltfCamera.orthographic.zfar;
                        cameraComp.orthoHeight = gltfCamera.ymag * 0.5;
                    } else {
                        cameraComp.nearClip = gltfCamera.perspective.znear;
                        cameraComp.farClip = gltfCamera.perspective.zfar;
                        cameraComp.fov = gltfCamera.perspective.yfov;
                    }
                }

                // add model
                if ( child._meshIDs && child._meshIDs.length > 0 ) {
                    child._meshIDs.forEach(function (meshID) {
                        var gltfMesh = json.meshes[meshID];
                        var model = new cc3d.Model();

                        gltfMesh.primitives.forEach(function (gltfPrimitive) {
                            var id = gltfPrimitive.indices;

                            var mesh = meshes[id];
                            var mtl = materials[gltfPrimitive.material];

                            var meshInst = new cc3d.MeshInstance(child, mesh, mtl);
                            model.meshInstances.push(meshInst);
                        });

                        scene._sgScene.addModel(model);
                    });
                }
            });

            // DISABLE
            // var node2 = new cc.Node3D();
            // node2.setLocalPosition(new cc.Vec3(2,-2,-10));
            // scene.addChild(node2);

            // var mesh = meshes.accessor_position_Plane_internal;

            // // var texture = new cc3d.Texture(device, options);
            // var mtl = new cc3d.StandardMaterial();
            // // mtl.diffuse = new cc3d.Color(1.0, 1.0, 0);
            // // mtl.diffuseMap = texture;
            // mtl.update();

            // var meshIns = new cc3d.MeshInstance(node2, mesh, mtl);
            // var model = new cc3d.Model();
            // model.meshInstances.push(meshIns);
            // scene._sgScene.addModel(model);
            // DISABLE
        });

        // node
        var node = new cc.Node3D();
        node.setLocalPosition(new cc.Vec3(0,0,-10));
        scene.addChild(node);

        // light
        var light = node.addComponent('cc.LightComponent');
        light.color = new cc.ColorF(0.8, 0.8, 0.8);

    });

    cc.director.runSceneImmediate(scene);
}

cc.game._is3D = true;
cc.game.run({
    id : 'gameCanvas',
    debugMode: 1,
    renderMode: 2,
    showFPS: 1,
    frameRate: 60,
}, initScene);
