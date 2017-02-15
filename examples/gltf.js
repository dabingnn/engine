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
                    if ( gltfBufferView.target ) {
                        bufferViews[viewID] = new Uint8Array(
                            assets[id],
                            gltfBufferView.byteOffset,
                            gltfBufferView.byteLength
                        );
                    } else {
                        bufferViews[viewID] = assets[id].slice(
                            gltfBufferView.byteOffset,
                            gltfBufferView.byteOffset + gltfBufferView.byteLength
                        );
                    }
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

function _duplicate (node) {
    if ( !node ) {
        return null;
    }

    var newNode = new cc.Node3D();
    newNode._id = node._id;
    newNode.name = node.name;
    newNode.setLocalScale(node.getLocalScale());
    newNode.setLocalRotation(node.getLocalRotation());
    newNode.setLocalPosition(node.getLocalPosition());

    if ( node.children && node.children.length > 0 ) {
        node.children.forEach(function(child) {
            newNode.addChild(_duplicate(child));
        });
    }

    return newNode;
}

function walk ( node, fn ) {
    node.children.forEach(child => {
        fn ( node, child );
        walk( child, fn );
    });
}

function parseCurves(accessor, device, bufferViews ) {
    var result = [];
    var bufferView = bufferViews[accessor.bufferView];
    var componentType = accessor.componentType;
    var curverKeysView;
    var componentCount = gltf.typeToCompnents(accessor.type);

    if ( componentType === 5120 ) {
        curverKeysView = new Int8Array(bufferView, accessor.byteOffset, accessor.count * componentCount);
    } else if ( componentType === 5121 ) {
        curverKeysView = new Uint8Array(bufferView, accessor.byteOffset, accessor.count * componentCount);
    } else if ( componentType === 5122 ) {
        curverKeysView = new Int16Array(bufferView, accessor.byteOffset, accessor.count * componentCount);
    } else if ( componentType === 5123 ) {
        curverKeysView = new Uint16Array(bufferView, accessor.byteOffset, accessor.count * componentCount);
    } else if ( componentType === 5126 ) {
        curverKeysView = new Float32Array(bufferView, accessor.byteOffset, accessor.count * componentCount);
    }

    for(var i = 0; i < accessor.count; ++i) {
        if(componentCount === 1) {
            result.push(curverKeysView[i]);
        } else if(componentCount === 3) {
            result.push(new cc.Vec3(
                curverKeysView[3*i],
                curverKeysView[3*i + 1],
                curverKeysView[3*i + 2]
            ));
        } else if(componentCount === 4) {
            result.push(new cc.Quat(
                curverKeysView[4*i],
                curverKeysView[4*i + 1],
                curverKeysView[4*i + 2],
                curverKeysView[4*i + 3]
            ));
        }
    }

    return result;
}


function buildAnimations(json, device, bufferViews) {
    var animations = {};
    for (var aniInfoKey in json.animations) {
        var aniInfo = json.animations[aniInfoKey];
        var animation = animations[aniInfo.name] = new cc3d.Animation();
        animations[aniInfoKey] = animation;
        animation.name = aniInfo.name;

        // parse parameters
        var aniCurveTimes = [];
        var aniCurves = {};
        for (var aniCurveInfoKey in aniInfo.parameters) {
            var curve = parseCurves(
                json.accessors[aniInfo.parameters[aniCurveInfoKey]],
                device,
                bufferViews
            );

            if (aniCurveInfoKey === 'time') {
                aniCurveTimes = curve;
            } else {
                aniCurves[aniCurveInfoKey] = curve;
            }
        }

        // assign duration
        animation.duration = aniCurveTimes[aniCurveTimes.length - 1];

        // parse channels
        aniInfo.channels.forEach(function(channel) {
            var nodeName = json.nodes[channel.target.id].jointName;
            var boneCurve = animation._nodeDict[nodeName];
            if (!boneCurve) {
                boneCurve = new cc3d.Node();
                boneCurve._name = nodeName;
                aniCurveTimes.forEach(function(time) {
                    boneCurve._keys.push(new cc3d.Key(time, null, null, null));
                });
                animation._nodeDict[nodeName] = boneCurve;
                animation._nodes.push(boneCurve);
            }

            var curve = aniCurves[channel.sampler];
            for (var index = 0; index < boneCurve._keys.length; ++index) {
                if (channel.target.path === 'translation') {
                    boneCurve._keys[index].position = curve[index];
                } else if(channel.target.path === 'rotation') {
                    boneCurve._keys[index].rotation = curve[index];
                } else if(channel.target.path === 'scale') {
                    boneCurve._keys[index].scale = curve[index];
                }
            }

        });

        animation._nodes.forEach(function(node) {
            node._keys.forEach(function(key) {
                key.position = key.position || new cc.Vec3(0,0,0);
                key.rotation = key.rotation || new cc.Quat(0,0,0,1);
                key.scale = key.scale || new cc.Vec3(1,1,1);
            });
        });
    }

    return animations;
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
            accessor.name === 'uv7' ||
            accessor.name === 'joint' ||
            accessor.name === 'weight'
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
            'joint', 'weight',
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
        childNode._id = nodeID;
        childNode._meshIDs = gltfNode.meshes;
        childNode._skinID = gltfNode.skin;
        childNode._skeletonIDs = gltfNode.skeletons;
        childNode._cameraID = gltfNode.camera;
        childNode._extras = gltfNode.extras;

        node.addChild(childNode);

        if ( gltfNode.children ) {
            recurseNode ( json, childNode, gltfNode.children, meshes );
        }
    });
}

function buildSkins (json, device, bufferViews) {
    var skins = {};
    var skinId;

    function parseIbps (accessor, bufferViews) {
        if (
            accessor.componentType !== 5126 ||
            accessor.type !== 'MAT4'
        ) {
            console.error(
                'can not represent Inverse Bindind Matrix with type' +
                accessor.componentType +
                '(not float) and type ' +
                accessor.type +
                '(not mat4)'
            );
        }

        var bufferView = bufferViews[accessor.bufferView];
        var data = new Float32Array(bufferView, accessor.byteOffset, accessor.count * 16);

        var ibps = [];
        for (var index = 0; index < accessor.count; ++index) {
            var offset = 16 * index;
            var mat = new cc.Mat4(
                data[offset],
                data[offset + 1],
                data[offset + 2],
                data[offset + 3],
                data[offset + 4],
                data[offset + 5],
                data[offset + 6],
                data[offset + 7],
                data[offset + 8],
                data[offset + 9],
                data[offset + 10],
                data[offset + 11],
                data[offset + 12],
                data[offset + 13],
                data[offset + 14],
                data[offset + 15]
            );
            ibps.push(mat);
        }
        return ibps;
    }

    for ( skinId in json.skins ) {
        var gltfSkin = json.skins[skinId];
        var boneNames = gltfSkin.jointNames.slice(0);
        var ibps = parseIbps(json.accessors[gltfSkin.inverseBindMatrices], bufferViews);
        var skin = new cc3d.Skin(device, ibps, boneNames);
        skins[skinId] = skin;
    }

    return skins;
}

function buildJoints (json) {
    var joints = {};
    var id, node;

    for ( id in json.nodes ) {
        var gltfNode = json.nodes[id];
        if ( !gltfNode.jointName ) {
            continue;
        }

        node = new cc.Node3D();
        node.name = gltfNode.jointName;
        node._id = id;
        node._childrenIDs = gltfNode.children;

        // position
        if ( gltfNode.translation ) {
            node.setLocalPosition(new cc.Vec3(
                gltfNode.translation[0],
                gltfNode.translation[1],
                gltfNode.translation[2]
            ));
        } else {
            node.setLocalPosition(cc.Vec3.ZERO);
        }

        // rotation
        if ( gltfNode.rotation ) {
            node.setLocalRotation(new cc.Quat(
                gltfNode.rotation[0],
                gltfNode.rotation[1],
                gltfNode.rotation[2],
                gltfNode.rotation[3]
            ));
        } else {
            node.setLocalRotation(cc.Quat.IDENTITY);
        }

        // scale
        if ( gltfNode.scale ) {
            node.setLocalScale(new cc.Vec3(
                gltfNode.scale[0],
                gltfNode.scale[1],
                gltfNode.scale[2]
            ));
        } else {
            node.setLocalScale(cc.Vec3.ONE);
        }

        joints[id] = node;
    }

    for ( id in joints ) {
        node = joints[id];
        if ( node._childrenIDs && node._childrenIDs.length > 0 ) {
            node._childrenIDs.forEach(function(childID) {
                joints[childID] && node.addChild(joints[childID]);
            });
        }
        delete node._childrenIDs;
    }

    return joints;
}

function findJointByName (node, name) {
    if (node.name === name) {
        return node;
    }

    for ( var i = 0; i < node.children.length; ++i ) {
        var result = findJointByName(node.children[i], name);
        if (result) {
            return result;
        }
    }

    return null;
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
            var animations = buildAnimations(json, device, bufferViews);
            var skins = buildSkins(json, device, bufferViews);
            var joints = buildJoints(json);

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

                // add skeleton and animation
                if ( child._extras ) {
                    var skeletonRoot = null;
                    if ( child._extras.root ) {
                        var jointRoot = joints[child._extras.root];
                        skeletonRoot = _duplicate(jointRoot);

                        var cloneJoints = {};
                        walk(skeletonRoot, (parent, child) => {
                            cloneJoints[child._id] = child;
                        });

                        child.addChild(skeletonRoot);
                        skeletonRoot.syncHierarchy();
                        child._joints = cloneJoints;
                        child._graph = skeletonRoot;
                    }

                    if ( skeletonRoot && child._extras.animations ) {
                        var animation = animations[child._extras.animations[0]];
                        if (animation) {
                            var skeleton = new cc3d.Skeleton(skeletonRoot);
                            skeleton.setGraph(skeletonRoot);
                            skeleton.animation = animation;
                            skeleton.looping = true;
                            cc.director.getScheduler().scheduleUpdate(child, 0, false, function(dt) {
                                skeleton.addTime(dt);
                                skeleton.updateGraph();
                            });
                        }
                    }
                }

                // add model
                if ( child._meshIDs && child._meshIDs.length > 0 ) {
                    child._meshIDs.forEach(function (meshID) {
                        var modelComponent = child.addComponent('cc.ModelComponent');
                        var gltfMesh = json.meshes[meshID];
                        var model = new cc3d.Model();
                        var skinInstance = null;

                        // handle skin
                        if ( child._skinID ) {
                            var skin = skins[child._skinID];
                            var skeletonID = child._skeletonIDs && child._skeletonIDs[child._meshIDs.indexOf(meshID)];
                            var graph;

                            if ( child.parent && child.parent._graph ) {
                                graph = child.parent._graph;
                            } else {
                                graph = _duplicate(joints[skeletonID]);
                                child.addChild(graph);
                                graph.syncHierarchy();
                            }
                            model.graph = graph;

                            var bones = [];
                            skin.boneNames.forEach(function (name) {
                                var bone = findJointByName(graph, name);
                                if ( bone ) {
                                    bones.push(bone);
                                } else {
                                    console.error(`Can not find joint: ${name}`);
                                }
                            });

                            skinInstance = new cc3d.SkinInstance(skin, graph);
                            skinInstance.bones = bones;
                        }

                        //
                        gltfMesh.primitives.forEach(function (gltfPrimitive) {
                            var id = gltfPrimitive.indices;

                            var mesh = meshes[id];
                            var mtl = materials[gltfPrimitive.material];

                            var meshInst = new cc3d.MeshInstance(child, mesh, mtl);
                            meshInst.skinInstance = skinInstance;

                            model.meshInstances.push(meshInst);
                        });
                        modelComponent.setModel(model);
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
