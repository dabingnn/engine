/****************************************************************************
 Copyright (c) 2013-2016 Chukong Technologies Inc.

 http://www.cocos.com

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated engine source code (the "Software"), a limited,
 worldwide, royalty-free, non-assignable, revocable and  non-exclusive license
 to use Cocos Creator solely to develop games on your target platforms. You shall
 not use Cocos Creator software for developing other software or tools that's
 used for developing games. You are not granted to publish, distribute,
 sublicense, and/or sell copies of Cocos Creator.

 The software or tools in this License Agreement are licensed, not sold.
 Chukong Aipu reserves all rights not expressly granted to you.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

var SgHelper = require('../core/utils/scene-graph-helper');
var Destroying = require('../core/platform/CCObject').Flags.Destroying;
var Misc = require('../core/utils/misc');
var DirtyFlags = Misc.DirtyFlags;
var IdGenerater = require('../core/platform/id-generater');

function updateOrder(node) {
    var parent = node._parent;
    parent._reorderChildDirty = true;
    parent._delaySort();
    if (!CC_JSB) {
        cc.eventManager._setDirtyForNode(node);
    }
}

var POSITION_CHANGED = 'position-changed';
var SIZE_CHANGED = 'size-changed';
var ANCHOR_CHANGED = 'anchor-changed';
var CHILD_ADDED = 'child-added';
var CHILD_REMOVED = 'child-removed';
var CHILD_REORDER = 'child-reorder';

var ERR_INVALID_NUMBER = CC_EDITOR && 'The %s is invalid';

var idGenerater = new IdGenerater('Node');

/**
 * A base node for CCNode and CCEScene, it will:
 * - provide the same api with origin cocos2d rendering node (SGNode)
 * - maintains properties of the internal SGNode
 * - retain and release the SGNode
 * - serialize datas for SGNode (but SGNode itself will not being serialized)
 * - notifications if some properties changed
 * - define some interfaces shares between CCNode and CCEScene
 *
 *
 * @class _BaseNode
 * @extends Object
 * @private
 */
var BaseNode3D = cc.Class(/** @lends cc.Node# */{
    name: 'cc._BaseNode',
    extends: cc.Object,
    mixins: [cc.EventTarget],

    properties: {

        // SERIALIZABLE
        _parent: null,
        _children: [],
        _rotation: null,
        _scale: null,
        _position: null,

        _tag: cc.macro.NODE_TAG_INVALID,

        // API

        /**
         * !#en Name of node.
         * !#zh 该节点名称。
         * @property name
         * @type {String}
         * @example
         * node.name = "New Node";
         * cc.log("Node Name: " + node.name);
         */
        name: {
            get: function () {
                return this._name;
            },
            set: function (value) {
                if (CC_DEV && value.indexOf('/') !== -1) {
                    cc.errorID(1632);
                    return;
                }
                this._name = value;
            },
        },

        /**
         * !#en The parent of the node.
         * !#zh 该节点的父节点。
         * @property parent
         * @type {Node}
         * @default null
         * @example
         * node.parent = newNode;
         */
        parent: {
            get: function () {
                return this._parent;
            },
            set: function (value) {
                if (this._parent === value) {
                    return;
                }
                //do not need it in 3d
                //if (CC_EDITOR && !cc.engine.isPlaying) {
                //    if (_Scene.DetectConflict.beforeAddChild(this)) {
                //        return;
                //    }
                //}
                var sgNode = this._sgNode;
                if (sgNode.parent) {
                    sgNode.parent.removeChild(sgNode, false);
                }
                //
                var oldParent = this._parent;
                this._parent = value || null;
                if (value) {
                    var parent = value._sgNode;
                    parent.addChild(sgNode);
                    value._children.push(this);
                    value.emit(CHILD_ADDED, this);
                }
                if (oldParent) {
                    if (!(oldParent._objFlags & Destroying)) {
                        var removeAt = oldParent._children.indexOf(this);
                        if (CC_DEV && removeAt < 0) {
                            return cc.errorID(1633);
                        }
                        oldParent._children.splice(removeAt, 1);
                        oldParent.emit(CHILD_REMOVED, this);
                        this._onHierarchyChanged(oldParent);
                    }
                }
                else if (value) {
                    this._onHierarchyChanged(null);
                }
            },
        },

        _id: {
            default: '',
            editorOnly: true
        },

        /**
         * !#en The uuid for editor, will be stripped before building project.
         * !#zh 用于编辑器使用的 uuid，在构建项目之前将会被剔除。
         * @property uuid
         * @type {String}
         * @readOnly
         * @example
         * cc.log("Node Uuid: " + node.uuid);
         */
        uuid: {
            get: function () {
                var id = this._id;
                if ( !id ) {
                    id = this._id = CC_EDITOR ? Editor.Utils.UuidUtils.uuid() : idGenerater.getNewId();
                }
                return id;
            }
        },


        rotation: {
            //todo add implementation here
            get: function () {
                return this._rotation;
            },
            set: function (value) {
                this._rotation.x = value.x;
                this._rotation.y = value.y;
                this._rotation.z = value.z;

                this._sgNode.setLocalEulerAngles(this._rotation);
            }
        },

        rotationX: {
            //todo add implementation here
            get: function () {
                return this._rotation.x;
            },
            set: function (value) {
                if (this._rotation.x !== value) {
                    this._rotation.x = value;
                    this._sgNode.setLocalEulerAngles(this._rotation);
                }
            },
        },

        rotationY: {
            get: function () {
                return this._rotation.y;
            },
            set: function (value) {
                if (this._rotation.y !== value) {
                    this._rotation.y = value;
                    this._sgNode.setLocalEulerAngles(this._rotation);
                }
            },
        },

        rotationZ: {
            get: function () {
                return this._rotation.z;
            },
            set: function (value) {
                if (this._rotation.z !== value) {
                    this._rotation.z = value;
                    this._sgNode.setLocalEulerAngles(this._rotation);
                }
            },
        },

        scale: {
            get: function () {
                return this._scale;
            },
            set: function (value) {
                this._scale.x = value.x;
                this._scale.y = value.y;
                this._scale.z = value.z;

                this._sgNode.setLocalScale(this._scale);
            },
        },

        scaleX: {
            get: function () {
                return this._scale.x;
            },
            set: function (value) {
                if (this._scale.x !== value) {
                    this._scale.x = value;
                    this._sgNode.setLocalScale(this._scale);
                }
            },
        },

        scaleY: {
            get: function () {
                return this._scale.y;
            },
            set: function (value) {
                if (this._scale.y !== value) {
                    this._scale.y = value;
                    this._sgNode.setLocalScale(this._scale);
                }
            },
        },

        scaleZ: {
            get: function () {
                return this._scale.z;
            },
            set: function (value) {
                if (this._scale.z !== value) {
                    this._scale.z = value;
                    this._sgNode.setLocalScale(this._scale);
                }
            },
        },


        position: {
            get: function () {
                return this._position;
            },
            set: function (value) {
                this._position.x = value.x;
                this._position.y = value.y;
                this._position.z = value.z;

                this._sgNode.setLocalPosition(this._position);
            },
        },

        x: {
            get: function () {
                return this._position.x;
            },
            set: function (value) {
                var localPosition = this._position;
                if (value !== localPosition.x) {
                    if (!CC_EDITOR || isFinite(value)) {
                        if (CC_EDITOR) {
                            var oldValue = localPosition.x;
                        }

                        localPosition.x = value;
                        this._sgNode.setLocalPosition(this._position);

                        // fast check event
                        var capListeners = this._capturingListeners &&
                            this._capturingListeners._callbackTable[POSITION_CHANGED];
                        var bubListeners = this._bubblingListeners &&
                            this._bubblingListeners._callbackTable[POSITION_CHANGED];
                        if ((capListeners && capListeners.length > 0) || (bubListeners && bubListeners.length > 0)) {
                            // send event
                            if (CC_EDITOR) {
                                this.emit(POSITION_CHANGED, new cc.Vec3(oldValue, localPosition.y, localPosition.z));
                            }
                            else {
                                this.emit(POSITION_CHANGED);
                            }
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new x');
                    }
                }
            },
        },

        y: {
            get: function () {
                return this._position.y;
            },
            set: function (value) {
                var localPosition = this._position;
                if (value !== localPosition.y) {
                    if (!CC_EDITOR || isFinite(value)) {
                        if (CC_EDITOR) {
                            var oldValue = localPosition.y;
                        }

                        localPosition.y = value;
                        this._sgNode.setLocalPosition(this._position);

                        // fast check event
                        var capListeners = this._capturingListeners &&
                            this._capturingListeners._callbackTable[POSITION_CHANGED];
                        var bubListeners = this._bubblingListeners &&
                            this._bubblingListeners._callbackTable[POSITION_CHANGED];
                        if ((capListeners && capListeners.length > 0) || (bubListeners && bubListeners.length > 0)) {
                            // send event
                            if (CC_EDITOR) {
                                this.emit(POSITION_CHANGED, new cc.Vec3(localPosition.x, oldValue, localPosition.z));
                            }
                            else {
                                this.emit(POSITION_CHANGED);
                            }
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new y');
                    }
                }
            },
        },

        z: {
            get: function () {
                return this._position.z;
            },
            set: function (value) {
                var localPosition = this._position;
                if (value !== localPosition.z) {
                    if (!CC_EDITOR || isFinite(value)) {
                        if (CC_EDITOR) {
                            var oldValue = localPosition.z;
                        }

                        localPosition.z = value;
                        this._sgNode.setLocalPosition(this._position);

                        // fast check event
                        var capListeners = this._capturingListeners &&
                            this._capturingListeners._callbackTable[POSITION_CHANGED];
                        var bubListeners = this._bubblingListeners &&
                            this._bubblingListeners._callbackTable[POSITION_CHANGED];
                        if ((capListeners && capListeners.length > 0) || (bubListeners && bubListeners.length > 0)) {
                            // send event
                            if (CC_EDITOR) {
                                this.emit(POSITION_CHANGED, new cc.Vec3(localPosition.x, localPosition.y, oldValue));
                            }
                            else {
                                this.emit(POSITION_CHANGED);
                            }
                        }
                    }
                    else {
                        cc.error(ERR_INVALID_NUMBER, 'new z');
                    }
                }
            },
        },
        //added for event manager, is not used in 3d
        zIndex: {
            set: function (value) {
                //do nothing
            },
            get: function () {
                return 0;
            }
        },
        children: {
            get: function () {
                return this._children;
            }
        },

        childrenCount: {
            get: function () {
                return this._children.length;
            }
        },

        tag: {
            get: function () {
                return this._tag;
            },
            set: function (value) {
                this._tag = value;
                //this._sgNode.tag = value;
            },
        },

    },

    ctor: function () {

        /**
         * Current scene graph node for this node.
         *
         * @property _sgNode
         * @type {_ccsg.Node}
         * @private
         */
        var sgNode = this._sgNode = new pc.GraphNode();
        sgNode._ccNode = this;
        this._position = new cc.Vec3();
        this._rotation = new cc.Vec3();
        this._scale = new cc.Vec3(1, 1, 1);

        this._worldPosition = new cc.Vec3();
        this._worldRotation = new cc.Vec3();
        this._worldScale = new cc.Vec3(1, 1, 1);
        //if (CC_JSB) {
        //    sgNode.retain();
        //    sgNode._entity = this;
        //    sgNode.onEnter = function () {
        //        _ccsg.Node.prototype.onEnter.call(this);
        //        if (this._entity && !this._entity._active) {
        //            cc.director.getActionManager().pauseTarget(this);
        //            cc.eventManager.pauseTarget(this);
        //        }
        //    };
        //}
        //if (!cc.game._isCloning) {
        //    sgNode.cascadeOpacity = true;
        //}


        // Support for ActionManager and EventManager
        this.__instanceId = this._id || cc.ClassManager.getNewInstanceId();

        /**
         * Register all related EventTargets,
         * all event callbacks will be removed in _onPreDestroy
         * @property __eventTargets
         * @type {EventTarget[]}
         * @private
         */
        this.__eventTargets = [];
    },

    _onPreDestroy: function () {
        //if (CC_JSB) {
        //    this._sgNode.release();
        //    this._sgNode._entity = null;
        //    this._sgNode = null;
        //}
        cc.eventManager.removeListeners(this);
        for (var i = 0, len = this.__eventTargets.length; i < len; ++i) {
            var target = this.__eventTargets[i];
            target && target.targetOff(this);
        }
    },

    _destruct: Misc.destructIgnoreId,

    // ABSTRACT INTERFACES

    // called when the node's parent changed
    _onHierarchyChanged: null,

    init: function () {
        return true;
    },

    attr: function (attrs) {
        for (var key in attrs) {
            this[key] = attrs[key];
        }
    },

    getScale: function () {
        return this._scale;
    },
    //support setScale(vec3), setScale(x,y,z), setScale(scale);
    setScale: function (scaleX, scaleY, scaleZ) {
        if (typeof scaleX === 'object') {
            scaleZ = scaleX.z;
            scaleY = scaleX.y;
            scaleX = scaleX.x;
        }
        else {
            scaleZ = scaleZ || scaleX;
            scaleY = scaleY || scaleX;
        }
        this._scale.x = scaleX;
        this._scale.y = scaleY;
        this._scale.z = scaleZ;
        this._sgNode.setLocalScale(this._scale);
    },

    getPosition: function () {
        return this._position;
    },

    //support setPosition(x,y,z) setPosition(vec3)
    setPosition: function (x, y, z) {
        if (typeof x === 'object') {
            z = x.z;
            y = x.y;
            x = x.x;
        }

        if (CC_EDITOR) {
            var oldPosition = new cc.Vec2(this._position);
        }

        this._position.x = x;
        this._position.y = y;
        this._position.z = z;

        this._sgNode.setLocalPosition(this._position);

        // fast check event
        var capListeners = this._capturingListeners &&
            this._capturingListeners._callbackTable[POSITION_CHANGED];
        var bubListeners = this._bubblingListeners &&
            this._bubblingListeners._callbackTable[POSITION_CHANGED];
        if ((capListeners && capListeners.length > 0) || (bubListeners && bubListeners.length > 0)) {
            // send event
            if (CC_EDITOR) {
                this.emit(POSITION_CHANGED, oldPosition);
            }
            else {
                this.emit(POSITION_CHANGED);
            }
        }
    },
    getWorldPosition: function () {
        var result = this._worldPosition;
        var pos = this._sgNode.getPosition();
        result.x = pos.x;
        result.y = pos.y;
        result.z = pos.z;
        return result;
    },

    setWorldPosition: function (x, y, z) {
        if (typeof x === 'object') {
            z = x.z;
            y = x.y;
            x = x.x;
        }
        this._sgNode.setPosition(x, y, z);
        var localPositon = this._sgNode.getLocalPosition();
        this._position.x = localPositon.x;
        this._position.y = localPositon.y;
        this._position.z = localPositon.z;
    },

    getWorldRotation: function () {
        var result = this._worldRotation;
        var rot = this._sgNode.getEulerAngles();
        result.x = rot.x;
        result.y = rot.y;
        result.z = rot.z;
        return result;
    },

    setWorldRotation: function (x, y, z) {
        if (typeof x === 'object') {
            z = x.z;
            y = x.y;
            x = x.x;
        }
        this._sgNode.setEulerAngles(x, y, z);
        var localRotation = this._sgNode.getLocalEulerAngles();
        this._rotation.x = localRotation.x;
        this._rotation.y = localRotation.y;
        this._rotation.z = localRotation.z;
    },

    getWorldScale: function () {
        var result = this._worldScale;
        var transform = this._sgNode.getWorldTransform();
        transform.getScale(result);
        return result;
    },

    setWorldScale: function (x, y, z) {
        if (typeof x === 'object') {
            z = x.z;
            y = x.y;
            x = x.x;
        }
        if (this._parent) {
            var parentScale = this._parent.getWorldScale();
            x /= parentScale.x;
            y /= parentScale.y;
            z /= parentScale.z;
        }
        this.scaleX = x;
        this.scaleY = y;
        this.scaleZ = z;
    },
    //getBoundingBox: function () {
    //    var size = this.getContentSize();
    //    var rect = cc.rect( 0, 0, size.width, size.height );
    //    return cc._rectApplyAffineTransformIn(rect, this.getNodeToParentTransform());
    //},

    cleanup: function () {
        // actions
        cc.director.getActionManager().removeAllActionsFromTarget(this);
        // event
        cc.eventManager.removeListeners(this);

        // children
        var i, len = this._children.length, node;
        for (i = 0; i < len; ++i) {
            node = this._children[i];
            if (node)
                node.cleanup();
        }
    },

    // composition: GET

    getChildByTag: function (aTag) {
        var children = this._children;
        if (children !== null) {
            for (var i = 0; i < children.length; i++) {
                var node = children[i];
                if (node && node.tag === aTag)
                    return node;
            }
        }
        return null;
    },

    getChildByUuid: function (uuid) {
        if (!uuid) {
            cc.log("Invalid uuid");
            return null;
        }

        var locChildren = this._children;
        for (var i = 0, len = locChildren.length; i < len; i++) {
            if (locChildren[i]._id === uuid)
                return locChildren[i];
        }
        return null;
    },

    getChildByName: function (name) {
        if (!name) {
            cc.log("Invalid name");
            return null;
        }

        var locChildren = this._children;
        for (var i = 0, len = locChildren.length; i < len; i++) {
            if (locChildren[i]._name === name)
                return locChildren[i];
        }
        return null;
    },

    // composition: ADD

    addChild: function (child, localZOrder, tag) {
        var name, setTag = false;
        if (typeof tag === 'undefined') {
            tag = undefined;
            name = child._name;
        } else if (cc.js.isString(tag)) {
            name = tag;
            tag = undefined;
        } else if (cc.js.isNumber(tag)) {
            setTag = true;
            name = "";
        }

        if (CC_DEV && !(child instanceof cc.Node)) {
            return cc.error('addChild: The child to add must be instance of cc.Node, not %s.', cc.js.getClassName(child));
        }
        cc.assertID(child, 1606);
        cc.assert(child._parent === null, "child already added. It can't be added again");

        // invokes the parent setter
        child.parent = this;

        if (setTag)
            child.setTag(tag);
        else
            child.setName(name);
    },

    // composition: REMOVE

    removeFromParent: function (cleanup) {
        if (this._parent) {
            if (cleanup === undefined)
                cleanup = true;
            this._parent.removeChild(this, cleanup);
        }
    },

    removeChild: function (child, cleanup) {
        if (this._children.indexOf(child) > -1) {
            // If you don't do cleanup, the child's actions will not get removed and the
            if (cleanup || cleanup === undefined) {
                child.cleanup();
            }
            // invoke the parent setter
            child.parent = null;
        }
    },

    removeChildByTag: function (tag, cleanup) {
        if (tag === cc.macro.NODE_TAG_INVALID)
            cc.logID(1609);

        var child = this.getChildByTag(tag);
        if (!child)
            cc.logID(1610, tag);
        else
            this.removeChild(child, cleanup);
    },

    removeAllChildren: function (cleanup) {
        // not using detachChild improves speed here
        var children = this._children;
        if (cleanup === undefined)
            cleanup = true;
        for (var i = children.length - 1; i >= 0; i--) {
            var node = children[i];
            if (node) {
                //if (this._running) {
                //    node.onExitTransitionDidStart();
                //    node.onExit();
                //}

                // If you don't do cleanup, the node's actions will not get removed and the
                //if (cleanup)
                //    node.cleanup();

                node.parent = null;
            }
        }
        this._children.length = 0;
    },

    setNodeDirty: function () {
        //do nothing
    },

    getNodeToWorldTransform: function () {
        return this._sgNode.getWorldTransform();
    },

    getWorldToNodeTransform: function () {
        var tm = new cc.Mat4();
        tm.copy(this._sgNode.getWorldTransform());
        tm.invert();
        return tm;
    },

    getParentToNodeTransform: function () {
        var tm = new cc.Mat4();
        tm.copy(this._sgNode.getLocalTransform());
        tm.invert();
        return tm;
    },

    getNodeToParentTransform: function () {
        return this._sgNode.getLocalTransform();
    },

    // HIERARCHY METHODS

    getSiblingIndex: function () {
        if (this._parent) {
            return this._parent._children.indexOf(this);
        }
        else {
            return 0;
        }
    },

    setSiblingIndex: function (index) {
        if (!this._parent) {
            return;
        }
        var array = this._parent._children;
        index = index !== -1 ? index : array.length - 1;
        var oldIndex = array.indexOf(this);
        if (index !== oldIndex) {
            array.splice(oldIndex, 1);
            if (index < array.length) {
                array.splice(index, 0, this);
            }
            else {
                array.push(this);
            }

        }
    },

    isChildOf: function (parent) {
        var child = this;
        do {
            if (child === parent) {
                return true;
            }
            child = child._parent;
        }
        while (child);
        return false;
    },

    sortAllChildren: function () {
        //do not need to do anything
    },

    _delaySort: function () {
        //do not need to do anything
    },

    _updateDummySgNode: function () {
        var self = this;
        var sgNode = self._sgNode;
        sgNode.setLocalPosition(self._position);
        sgNode.setLocalEulerAngles(self._rotation);
        sgNode.setLocalScale(self._scale);
        //sgNode.setTag(self._tag);
    },

    _updateSgNode: function () {
        this._updateDummySgNode();
        this._sgNode.enabled = this._active;

        // update ActionManager and EventManager because sgNode maybe changed
        if (this._activeInHierarchy) {
            cc.director.getActionManager().resumeTarget(this);
            cc.eventManager.resumeTarget(this);
        }
        else {
            cc.director.getActionManager().pauseTarget(this);
            cc.eventManager.pauseTarget(this);
        }
    },

    /*
     * The deserializer for sgNode which will be called before components onLoad
     * @param {Boolean} [skipChildrenInEditor=false]
     */
    _onBatchCreated: function () {
        this._updateDummySgNode();

        if (this._parent) {
            this._parent._sgNode.addChild(this._sgNode);
        }

        if (!this._activeInHierarchy) {
            // deactivate ActionManager and EventManager by default
            cc.director.getActionManager().pauseTarget(this);
            cc.eventManager.pauseTarget(this);
        }

        var children = this._children;
        for (var i = 0, len = children.length; i < len; i++) {
            children[i]._onBatchCreated();
        }
    },

    onRestore: CC_EDITOR && function () {
        this._updateDummySgNode();

        var sgParent = this._parent && this._parent._sgNode;
        if (this._sgNode._parent !== sgParent) {
            if (this._sgNode._parent) {
                this._sgNode._parent.removeChild(this._sgNode);
            }
            if (sgParent) {
                sgParent.addChild(this._sgNode);
            }
        }

        // check activity state
        var shouldActiveInHierarchy = (this._parent && this._parent._activeInHierarchy && this._active);
        if (shouldActiveInHierarchy !== this._activeInHierarchy) {
            this._onActivatedInHierarchy(shouldActiveInHierarchy);
            this.emit('active-in-hierarchy-changed', this);
        }

        if (this._activeInHierarchy) {
            cc.director.getActionManager().resumeTarget(this);
            cc.eventManager.resumeTarget(this);
        }
        else {
            cc.director.getActionManager().pauseTarget(this);
            cc.eventManager.pauseTarget(this);
        }
    },

    _removeSgNode: function () {
        var node = this._sgNode;
        if (node) {
            var parent = node._parent;
            if (parent) {
                parent.removeChild(node);
            }

            if (this._sgNode._entity) {
                this._sgNode._entity = null;
            }
        }
    },

    //added for event manager, is not used in 3d
    getGlobalZOrder: function () {
        return 0;
    },
    setGlobalZOrder: function (value) {

    },
});


// Define public getter and setter methods to ensure api compatibility.
//var SameNameGetSets = ['name', 'skewX', 'skewY', 'position', 'rotation', 'rotationX', 'rotationY',
//    'scale', 'scaleX', 'scaleY', 'children', 'childrenCount', 'parent', 'running',
//    /*'actionManager',*/ 'scheduler', /*'shaderProgram',*/ 'opacity', 'color', 'tag'];
//var DiffNameGetSets = {
//    x: ['getPositionX', 'setPositionX'],
//    y: ['getPositionY', 'setPositionY'],
//    zIndex: ['getLocalZOrder', 'setLocalZOrder'],
//    //running: ['isRunning'],
//    opacityModifyRGB: ['isOpacityModifyRGB'],
//    cascadeOpacity: ['isCascadeOpacityEnabled', 'setCascadeOpacityEnabled'],
//    cascadeColor: ['isCascadeColorEnabled', 'setCascadeColorEnabled'],
//    //// privates
//    //width: ['_getWidth', '_setWidth'],
//    //height: ['_getHeight', '_setHeight'],
//    //anchorX: ['_getAnchorX', '_setAnchorX'],
//    //anchorY: ['_getAnchorY', '_setAnchorY'],
//};

var SameNameGetSets = ['name', 'position', 'rotation', 'rotationX', 'rotationY', 'rotationZ',
    'scale', 'scaleX', 'scaleY', 'scaleZ', 'children', 'childrenCount', 'parent', 'tag'];
var DiffNameGetSets = {
    x: ['getPositionX', 'setPositionX'],
    y: ['getPositionY', 'setPositionY'],
    y: ['getPositionZ', 'setPositionZ'],
    zIndex: ['getLocalZOrder', 'setLocalZOrder'],
}
Misc.propertyDefine(BaseNode3D, SameNameGetSets, DiffNameGetSets);

cc._BaseNode = module.exports = BaseNode3D;
