/****************************************************************************
 Copyright (c) 2015 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

'use strict';

var EventTarget = require('./event/event-target');

var JS = cc.js;
var Flags = cc.Object.Flags;
var Destroying = Flags.Destroying;
var DontDestroy = Flags.DontDestroy;
//var RegisteredInEditor = Flags.RegisteredInEditor;

/**
 * !#en The event type supported by Node
 * !#zh Node 支持的事件类型
 * @enum Node.EventType
 * @static
 * @namespace Node
 */
var EventType = cc.Enum({
    /**
     * !#en The event type for touch start event, you can use its value directly: 'touchstart'
     * !#zh 当手指触摸到屏幕时。
     * @property TOUCH_START
     * @type {String}
     * @static
     */
    TOUCH_START: 'touchstart',
    /**
     * !#en The event type for touch move event, you can use its value directly: 'touchmove'
     * !#zh 当手指在屏幕上目标节点区域内移动时。
     * @property TOUCH_MOVE
     * @type {String}
     * @value 1
     * @static
     */
    TOUCH_MOVE: 'touchmove',
    /**
     * !#en The event type for touch end event, you can use its value directly: 'touchend'
     * !#zh 当手指在目标节点区域内离开屏幕时。
     * @property TOUCH_END
     * @type {String}
     * @static
     */
    TOUCH_END: 'touchend',
    /**
     * !#en The event type for touch end event, you can use its value directly: 'touchcancel'
     * !#zh 当手指在目标节点区域外离开屏幕时。
     * @property TOUCH_CANCEL
     * @type {String}
     * @static
     */
    TOUCH_CANCEL: 'touchcancel',

    /**
     * !#en The event type for mouse down events, you can use its value directly: 'mousedown'
     * !#zh 当鼠标按下时触发一次。
     * @property MOUSE_DOWN
     * @type {String}
     * @static
     */
    MOUSE_DOWN: 'mousedown',
    /**
     * !#en The event type for mouse move events, you can use its value directly: 'mousemove'
     * !#zh 当鼠标在目标节点在目标节点区域中移动时，不论是否按下。
     * @property MOUSE_MOVE
     * @type {String}
     * @static
     */
    MOUSE_MOVE: 'mousemove',
    /**
     * !#en The event type for mouse enter target events, you can use its value directly: 'mouseenter'
     * !#zh 当鼠标移入目标节点区域时，不论是否按下。
     * @property MOUSE_ENTER
     * @type {String}
     * @static
     */
    MOUSE_ENTER: 'mouseenter',
    /**
     * !#en The event type for mouse leave target events, you can use its value directly: 'mouseleave'
     * !#zh 当鼠标移出目标节点区域时，不论是否按下。
     * @property MOUSE_LEAVE
     * @type {String}
     * @static
     */
    MOUSE_LEAVE: 'mouseleave',
    /**
     * !#en The event type for mouse up events, you can use its value directly: 'mouseup'
     * !#zh 当鼠标从按下状态松开时触发一次。
     * @property MOUSE_UP
     * @type {String}
     * @static
     */
    MOUSE_UP: 'mouseup',
    /**
     * !#en The event type for mouse wheel events, you can use its value directly: 'mousewheel'
     * !#zh 当鼠标滚轮滚动时。
     * @property MOUSE_WHEEL
     * @type {String}
     * @static
     */
    MOUSE_WHEEL: 'mousewheel',
});

var _touchEvents = [
    EventType.TOUCH_START,
    EventType.TOUCH_MOVE,
    EventType.TOUCH_END,
    EventType.TOUCH_CANCEL,
];
var _mouseEvents = [
    EventType.MOUSE_DOWN,
    EventType.MOUSE_ENTER,
    EventType.MOUSE_MOVE,
    EventType.MOUSE_LEAVE,
    EventType.MOUSE_UP,
    EventType.MOUSE_WHEEL,
];

var currentHovered = null;

var _touchStartHandler = function (touch, event) {
    var pos = touch.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.TOUCH_START;
        event.touch = touch;
        event.bubbles = true;
        node.dispatchEvent(event);
        return true;
    }
    return false;
};
var _touchMoveHandler = function (touch, event) {
    var node = this.owner;
    event.type = EventType.TOUCH_MOVE;
    event.touch = touch;
    event.bubbles = true;
    node.dispatchEvent(event);
};
var _touchEndHandler = function (touch, event) {
    var pos = touch.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.TOUCH_END;
    }
    else {
        event.type = EventType.TOUCH_CANCEL;
    }
    event.touch = touch;
    event.bubbles = true;
    node.dispatchEvent(event);
};

var _mouseDownHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_DOWN;
        node.dispatchEvent(event);
        event.stopPropagation();
    }
};
var _mouseMoveHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;
    if (node._hitTest(pos, this)) {
        event.stopPropagation();
        if (!this._previousIn) {
            // Fix issue when hover node switched, previous hovered node won't get MOUSE_LEAVE notification
            if (currentHovered) {
                event.type = EventType.MOUSE_LEAVE;
                currentHovered.owner.dispatchEvent(event);
                currentHovered._previousIn = false;
            }
            currentHovered = this;
            event.type = EventType.MOUSE_ENTER;
            node.dispatchEvent(event);
            this._previousIn = true;
        }
        event.type = EventType.MOUSE_MOVE;
        node.dispatchEvent(event);
    }
    else if (this._previousIn) {
        event.type = EventType.MOUSE_LEAVE;
        node.dispatchEvent(event);
        this._previousIn = false;
        currentHovered = null;
    }
};
var _mouseUpHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_UP;
        node.dispatchEvent(event);
        event.stopPropagation();
    }
};
var _mouseWheelHandler = function (event) {
    var pos = event.getLocation();
    var node = this.owner;

    if (node._hitTest(pos, this)) {
        event.type = EventType.MOUSE_WHEEL;
        node.dispatchEvent(event);
        //FIXME: separate wheel event and other mouse event.
        // event.stopPropagation();
    }
};

var _searchMaskParent = function (node) {
    if (cc.Mask) {
        var index = 0;
        var mask = null;
        for (var curr = node; curr && curr instanceof cc.Node; curr = curr.parent, ++index) {
            mask = curr.getComponent(cc.Mask);
            if (mask) {
                return {
                    index: index,
                    node: curr
                };
            }
        }
    }

    return null;
};

function getConstructor (typeOrClassName) {
    if ( !typeOrClassName ) {
        cc.error('getComponent: Type must be non-nil');
        return null;
    }
    if (typeof typeOrClassName === 'string') {
        return JS.getClassByName(typeOrClassName);
    }

    return typeOrClassName;
}

function findComponent (node, constructor) {
    for (var i = 0; i < node._components.length; ++i) {
        var comp = node._components[i];
        if (comp instanceof constructor) {
            return comp;
        }
    }
    return null;
}

function findComponents (node, constructor, components) {
    for (var i = 0; i < node._components.length; ++i) {
        var comp = node._components[i];
        if (comp instanceof constructor) {
            components.push(comp);
        }
    }
}

function findChildComponent (children, constructor) {
    for (var i = 0; i < children.length; ++i) {
        var node = children[i];
        var comp = findComponent(node, constructor);
        if (comp) {
            return comp;
        }
        else if (node.children.length > 0) {
            comp = findChildComponent(node.children, constructor);
            if (comp) {
                return comp;
            }
        }
    }
    return null;
}

function findChildComponents (children, constructor, components) {
    for (var i = 0; i < children.length; ++i) {
        var node = children[i];
        findComponents(node, constructor, components);
        if (node._children.length > 0) {
            findChildComponents(node._children, constructor, components);
        }
    }
}

/**
 * Class of all entities in Cocos Creator scenes.
 * Node also inherits from {{#crossLink "EventTarget"}}Event Target{{/crossLink}}, it permits Node to dispatch events.
 * For events supported by Node, please refer to {{#crossLink "Node.EventType"}}{{/crossLink}}
 *
 * @class Node
 * @extends _BaseNode
 */
var Node = cc.Class({
    name: 'cc.Node',
    extends: require('./utils/base-node'),
    mixins: [EventTarget],

    properties: {
        /**
         * The local active state of this node.
         * @property active
         * @type {Boolean}
         * @default true
         */
        active: {
            get: function () {
                return this._active;
            },
            set: function (value) {
                value = !!value;
                if (this._active !== value) {
                    this._active = value;
                    var canActiveInHierarchy = (this._parent && this._parent._activeInHierarchy);
                    if (canActiveInHierarchy) {
                        this._onActivatedInHierarchy(value);
                        this.emit('active-in-hierarchy-changed', this);
                    }
                }
            }
        },

        /**
         * Indicates whether this node is active in the scene.
         * @property activeInHierarchy
         * @type {Boolean}
         */
        activeInHierarchy: {
            get: function () {
                return this._activeInHierarchy;
            }
        },

        // internal properties

        _active: true,

        /**
         * @property _components
         * @type {Component[]}
         * @default []
         * @readOnly
         * @private
         */
        _components: [],

        /**
         * The PrefabInfo object
         * @property _prefab
         * @type {PrefabInfo}
         * @private
         */
        _prefab: {
            default: null,
            editorOnly: true
        },

        /**
         * If true, the node is an persist node which won't be destroyed during scene transition.
         * If false, the node will be destroyed automatically when loading a new scene. Default is false.
         * @property _persistNode
         * @type {Boolean}
         * @default false
         * @private
         */
        _persistNode: {
            get: function () {
                return (this._objFlags & DontDestroy) > 0;
            },
            set: function (value) {
                if (value) {
                    this._objFlags |= DontDestroy;
                }
                else {
                    this._objFlags &= ~DontDestroy;
                }
            }
        }
    },

    ctor: function () {
        var name = arguments[0];
        this._name = typeof name !== 'undefined' ? name : 'New Node';
        this._activeInHierarchy = false;

        // Support for ActionManager and EventManager
        this.__instanceId = this._id || cc.ClassManager.getNewInstanceId();

        // cache component
        this._widget = null;

        // Touch event listener
        this._touchListener = null;

        // Mouse event listener
        this._mouseListener = null;

        /**
         * Register all related EventTargets,
         * all event callbacks will be removed in _onPreDestroy
         * @property __eventTargets
         * @type {EventTarget[]}
         * @private
         */
        this.__eventTargets = [];

        // Retained actions for JSB
        if (cc.sys.isNative) {
            this._retainedActions = [];
        }
    },

    statics: {
        _DirtyFlags: require('./utils/misc').DirtyFlags
    },

    // OVERRIDES

    destroy: function () {
        if (cc.Object.prototype.destroy.call(this)) {
            // disable hierarchy
            if (this._activeInHierarchy) {
                this._deactivateChildComponents();
            }
        }
    },

    _onPreDestroy: function () {
        var i, len;

        // marked as destroying
        this._objFlags |= Destroying;

        // detach self and children from editor
        var parent = this._parent;
        var destroyByParent = parent && (parent._objFlags & Destroying);
        if ( !destroyByParent ) {
            if (CC_DEV) {
                this._registerIfAttached(false);
            }
        }

        // destroy children
        var children = this._children;
        for (i = 0, len = children.length; i < len; ++i) {
            // destroy immediate so its _onPreDestroy can be called
            children[i]._destroyImmediate();
        }

        // destroy self components
        for (i = 0, len = this._components.length; i < len; ++i) {
            var component = this._components[i];
            // destroy immediate so its _onPreDestroy can be called
            component._destroyImmediate();
        }
        
        // Actions
        this.stopAllActions();
        this._releaseAllActions();

        // Remove all listeners
        cc.eventManager.removeListeners(this);
        for (i = 0, len = this.__eventTargets.length; i < len; ++i) {
            var target = this.__eventTargets[i];
            target && target.targetOff(this);
        }
        this.__eventTargets.length = 0;

        // remove from persist
        if (this._persistNode) {
            cc.game.removePersistRootNode(this);
        }

        if ( !destroyByParent ) {
            // remove from parent
            if (parent) {
                var childIndex = parent._children.indexOf(this);
                parent._children.splice(childIndex, 1);
                parent.emit('child-removed', this);
            }

            this._removeSgNode();

            // simulate some destruct logic to make undo system work correctly
            if (CC_EDITOR) {
                // ensure this node can reattach to scene by undo system
                this._parent = null;
            }
        }
        else {
            this._sgNode.release();
        }
    },

    // COMPONENT

    /**
     * Returns the component of supplied type if the node has one attached, null if it doesn't.
     * You can also get component in the node by passing in the name of the script.
     *
     * @method getComponent
     * @param {Function|String} typeOrClassName
     * @returns {Component}
     */
    getComponent: function (typeOrClassName) {
        var constructor = getConstructor(typeOrClassName);
        if (constructor) {
            return findComponent(this, constructor);
        }
        return null;
    },

    /**
     * Returns all components of supplied Type in the node.
     *
     * @method getComponents
     * @param {Function|String} typeOrClassName
     * @returns {Component[]}
     */
    getComponents: function (typeOrClassName) {
        var constructor = getConstructor(typeOrClassName), components = [];
        if (constructor) {
            findComponents(this, constructor, components);
        }

        return components;
    },

    /**
     * Returns the component of supplied type in any of its children using depth first search.
     *
     * @method getComponentInChildren
     * @param {Function|String} typeOrClassName
     * @returns {Component}
     */
    getComponentInChildren: function (typeOrClassName) {
        var constructor = getConstructor(typeOrClassName);
        if (constructor) {
            return findChildComponent(this._children, constructor);
        }

        return null;
    },

    /**
     * Returns the components of supplied type in any of its children using depth first search.
     *
     * @method getComponentsInChildren
     * @param {Function|String} typeOrClassName
     * @returns {Component[]}
     */
    getComponentsInChildren: function (typeOrClassName) {
        var constructor = getConstructor(typeOrClassName), components = [];
        if (constructor) {
            findChildComponents(this._children, constructor, components);
        }

        return components;
    },

    _checkMultipleComp: CC_EDITOR && function (ctor) {
        var err, existing = this.getComponent(ctor._disallowMultiple);
        if (existing) {
            if (existing.constructor === ctor) {
                err = 'Can\'t add component "%s" because %s already contains the same component.';
                cc.error(err, JS.getClassName(ctor), this._name);
            }
            else {
                err = 'Can\'t add component "%s" to %s because it conflicts with the existing "%s" derived component.';
                cc.error(err, JS.getClassName(ctor), this._name, JS.getClassName(existing));
            }
            return false;
        }
        return true;
    },

    /**
     * Adds a component class to the node. You can also add component to node by passing in the name of the script.
     *
     * @method addComponent
     * @param {Function|String} typeOrClassName - The constructor or the class name of the component to add
     * @returns {Component} - The newly added component
     */
    addComponent: function (typeOrClassName) {

        if ((this._objFlags & Destroying) && CC_EDITOR) {
            cc.error('isDestroying');
            return null;
        }

        // get component

        var constructor;
        if (typeof typeOrClassName === 'string') {
            constructor = JS.getClassByName(typeOrClassName);
            if ( !constructor ) {
                cc.error('addComponent: Failed to get class "%s"', typeOrClassName);
                if (cc._RFpeek()) {
                    cc.error('addComponent: Should not add component ("%s") when the scripts are still loading.', typeOrClassName);
                }
                return null;
            }
        }
        else {
            if ( !typeOrClassName ) {
                cc.error('addComponent: Type must be non-nil');
                return null;
            }
            constructor = typeOrClassName;
        }

        // check component

        if (typeof constructor !== 'function') {
            cc.error('addComponent: The component to add must be a constructor');
            return null;
        }
        if (!cc.isChildClassOf(constructor, cc.Component)) {
            cc.error('addComponent: The component to add must be child class of cc.Component');
            return null;
        }

        if (constructor._disallowMultiple && CC_EDITOR) {
            if (!this._checkMultipleComp(constructor)) {
                return null;
            }
        }

        // check requirement

        var ReqComp = constructor._requireComponent;
        if (ReqComp && !this.getComponent(ReqComp)) {
            var depended = this.addComponent(ReqComp);
            if (!depended) {
                // depend conflicts
                return null;
            }
        }

        //// check conflict
        //
        //if (CC_EDITOR && !_Scene.DetectConflict.beforeAddComponent(this, constructor)) {
        //    return null;
        //}

        //

        var component = new constructor();
        component.node = this;
        this._components.push(component);

        if (this._activeInHierarchy) {
            // call onLoad/onEnable
            component.__onNodeActivated(true);
        }

        return component;
    },

    /**
     * This api should only used by undo system
     * @method _addComponentAt
     * @param {Component} comp
     * @param {Number} index
     * @private
     */
    _addComponentAt: CC_EDITOR && function (comp, index) {
        if (this._objFlags & Destroying) {
            return cc.error('isDestroying');
        }
        if ( !(comp instanceof cc.Component) ) {
            return cc.error('_addComponentAt: The component to add must be a constructor');
        }
        if (index > this._components.length) {
            return cc.error('_addComponentAt: Index out of range');
        }

        // recheck attributes because script may changed
        var ctor = comp.constructor;
        if (ctor._disallowMultiple) {
            if (!this._checkMultipleComp(ctor)) {
                return;
            }
        }
        if (ctor._requireComponent) {
            var depend = this.addComponent(ctor._requireComponent);
            if (!depend) {
                // depend conflicts
                return null;
            }
        }

        comp.node = this;
        this._components.splice(index, 0, comp);

        if (this._activeInHierarchy) {
            // call onLoad/onEnable
            comp.__onNodeActivated(true);
        }
    },

    /**
     * Removes a component identified by the given name or removes the component object given.
     * You can also use component.destroy() if you already have the reference.
     * @method removeComponent
     * @param {String|Function|Component} component - The need remove component.
     * @deprecated please destroy the component to remove it.
     */
    removeComponent: function (component) {
        if ( !component ) {
            cc.error('removeComponent: Component must be non-nil');
            return;
        }
        if (typeof component !== 'object') {
            component = this.getComponent(component);
        }
        if (component) {
            component.destroy();
        }
    },

    /**
     * @method _getDependComponent
     * @param {Component} depended
     * @return {Component}
     * @private
     */
    _getDependComponent: CC_EDITOR && function (depended) {
        for (var i = 0; i < this._components.length; i++) {
            var comp = this._components[i];
            if (comp !== depended && comp.isValid && !cc.Object._willDestroy(comp)) {
                var depend = comp.constructor._requireComponent;
                if (depend && depended instanceof depend) {
                    return comp;
                }
            }
        }
        return null;
    },

    // do remove component, only used internally
    _removeComponent: function (component) {
        if (!component) {
            cc.error('Argument must be non-nil');
            return;
        }

        if (!(this._objFlags & Destroying)) {
            var i = this._components.indexOf(component);
            if (i !== -1) {
                this._components.splice(i, 1);
            }
            else if (component.node !== this) {
                cc.error('Component not owned by this entity');
            }
        }
    },

    // INTERNAL

    _registerIfAttached: CC_DEV && function (register) {
        if (register) {
            cc.engine.attachedObjsForEditor[this.uuid] = this;
            cc.engine.emit('node-attach-to-scene', {target: this});
            //this._objFlags |= RegisteredInEditor;
        }
        else {
            cc.engine.emit('node-detach-from-scene', {target: this});
            delete cc.engine.attachedObjsForEditor[this._id];
        }
        var children = this._children;
        for (var i = 0, len = children.length; i < len; ++i) {
            var child = children[i];
            child._registerIfAttached(register);
        }
    },

    _onActivatedInHierarchy: function (newActive) {
        this._activeInHierarchy = newActive;

        // component maybe added during onEnable, and the onEnable of new component is already called
        // so we should record the origin length
        var originCount = this._components.length;
        for (var c = 0; c < originCount; ++c) {
            var component = this._components[c];
            if ( !(component instanceof cc.Component) ) {
                if (CC_EDITOR) {
                    cc.error('Sorry, the component of "%s" which with an index of %s is corrupted! It has been removed.', this.name, c);
                    console.log('Corrupted component value:', component);
                }
                if (component) {
                    this._removeComponent(component);
                }
                else {
                    this._components.splice(c, 1);
                }
                --c;
                --originCount;
            }
            else {
                component.__onNodeActivated(newActive);
            }
        }
        // activate children recursively
        for (var i = 0, len = this.childrenCount; i < len; ++i) {
            var child = this._children[i];
            if (child._active) {
                child._onActivatedInHierarchy(newActive);
            }
        }
        // activate or desactivate ActionManager, EventManager
        // Activate
        if (newActive) {
            cc.director.getActionManager().resumeTarget(this);
            cc.eventManager.resumeTarget(this);
        }
        // Desactivate
        else {
            cc.director.getActionManager().pauseTarget(this);
            cc.eventManager.pauseTarget(this);
        }
    },

    _onHierarchyChanged: function (oldParent) {
        var newParent = this._parent;
        if (this._persistNode && !(newParent instanceof cc.Scene)) {
            cc.game.removePersistRootNode(this);
            if (CC_EDITOR) {
                cc.warn('Set "%s" to normal node (not persist root node).');
            }
        }
        var activeInHierarchyBefore = this._active && !!(oldParent && oldParent._activeInHierarchy);
        var shouldActiveNow = this._active && !!(newParent && newParent._activeInHierarchy);
        if (activeInHierarchyBefore !== shouldActiveNow) {
            this._onActivatedInHierarchy(shouldActiveNow);
        }
        if (CC_DEV) {
            var scene = cc.director.getScene();
            var inCurrentSceneBefore = oldParent && oldParent.isChildOf(scene);
            var inCurrentSceneNow = newParent && newParent.isChildOf(scene);
            if (!inCurrentSceneBefore && inCurrentSceneNow) {
                // attached
                this._registerIfAttached(true);
            }
            else if (inCurrentSceneBefore && !inCurrentSceneNow) {
                // detached
                this._registerIfAttached(false);
            }

            // update prefab
            var newPrefabRoot = newParent && newParent._prefab && newParent._prefab.root;
            var myPrefabInfo = this._prefab;
            if (myPrefabInfo) {
                if (newPrefabRoot) {
                    // change prefab
                    _Scene.PrefabUtils.linkPrefab(newPrefabRoot._prefab.asset, newPrefabRoot, this);
                }
                else if (myPrefabInfo.root !== this) {
                    // detach from prefab
                    _Scene.PrefabUtils.unlinkPrefab(this);
                }
            }
            else if (newPrefabRoot) {
                // attach to prefab
                _Scene.PrefabUtils.linkPrefab(newPrefabRoot._prefab.asset, newPrefabRoot, this);
            }

            // conflict detection
            _Scene.DetectConflict.afterAddChild(this);
        }
    },

    _deactivateChildComponents: function () {
        // 和 _onActivatedInHierarchy 类似但不修改 this._activeInHierarchy
        var originCount = this._components.length;
        for (var c = 0; c < originCount; ++c) {
            var component = this._components[c];
            component.__onNodeActivated(false);
        }
        // deactivate children recursively
        for (var i = 0, len = this.childrenCount; i < len; ++i) {
            var entity = this._children[i];
            if (entity._active) {
                entity._deactivateChildComponents();
            }
        }
    },

    _instantiate: function () {
        var clone = cc.instantiate._clone(this, this);
        clone._parent = null;

        // init
        if (CC_EDITOR && cc.engine._isPlaying) {
            this._name += ' (Clone)';
        }
        clone._onBatchCreated();

        return clone;
    },

    _onColorChanged: function () {
        // update components if also in scene graph
        for (var c = 0; c < this._components.length; ++c) {
            var comp = this._components[c];
            if (comp instanceof cc._SGComponent && comp.isValid && comp._sgNode) {
                comp._sgNode.setColor(this._color);
                if ( !this._cascadeOpacityEnabled ) {
                    comp._sgNode.setOpacity(this._opacity);
                }
            }
        }
    },

    _onCascadeChanged: function () {
        // update components which also in scene graph
        var opacity = this._cascadeOpacityEnabled ? 255 : this._opacity;
        for (var c = 0; c < this._components.length; ++c) {
            var comp = this._components[c];
            if (comp instanceof cc._SGComponent && comp.isValid && comp._sgNode) {
                comp._sgNode.setOpacity(opacity);
            }
        }
    },

    _onAnchorChanged: function () {
        // update components if also in scene graph
        for (var c = 0; c < this._components.length; ++c) {
            var comp = this._components[c];
            if (comp instanceof cc._SGComponent && comp.isValid && comp._sgNode) {
                comp._sgNode.setAnchorPoint(this._anchorPoint);
                comp._sgNode.ignoreAnchorPointForPosition(this.__ignoreAnchor);
            }
        }
    },

    _onOpacityModifyRGBChanged: function () {
        for (var c = 0; c < this._components.length; ++c) {
            var comp = this._components[c];
            if (comp instanceof cc._SGComponent && comp.isValid && comp._sgNode) {
                comp._sgNode.setOpacityModifyRGB(this._opacityModifyRGB);
            }
        }
    },

// EVENTS
    /**
     * Register an callback of a specific event type on Node.
     * Use this method to register touch or mouse event permit propagation based on scene graph,
     * you can propagate the event to the parents or swallow it by calling stopPropagation on the event.
     * It's the recommended way to register touch/mouse event for Node, 
     * please do not use cc.eventManager directly for Node.
     *
     * @method on
     * @param {String} type - A string representing the event type to listen for.
     * @param {Function} callback - The callback that will be invoked when the event is dispatched.
     *                              The callback is ignored if it is a duplicate (the callbacks are unique).
     * @param {Event} callback.param event
     * @param {Object} [target] - The target to invoke the callback, can be null
     * @return {Function} - Just returns the incoming callback so you can save the anonymous function easier.
     */
    on: function (type, callback, target) {
        if (_touchEvents.indexOf(type) !== -1) {
            if (!this._touchListener) {
                this._touchListener = cc.EventListener.create({
                    event: cc.EventListener.TOUCH_ONE_BY_ONE,
                    swallowTouches: true,
                    owner: this,
                    mask: _searchMaskParent(this),
                    onTouchBegan: _touchStartHandler,
                    onTouchMoved: _touchMoveHandler,
                    onTouchEnded: _touchEndHandler
                });
                this._touchListener.retain();
                cc.eventManager.addListener(this._touchListener, this);
            }
        }
        else if (_mouseEvents.indexOf(type) !== -1) {
            if (!this._mouseListener) {
                this._mouseListener = cc.EventListener.create({
                    event: cc.EventListener.MOUSE,
                    _previousIn: false,
                    owner: this,
                    mask: _searchMaskParent(this),
                    onMouseDown: _mouseDownHandler,
                    onMouseMove: _mouseMoveHandler,
                    onMouseUp: _mouseUpHandler,
                    onMouseScroll: _mouseWheelHandler,
                });
                this._mouseListener.retain();
                cc.eventManager.addListener(this._mouseListener, this);
            }
        }
        EventTarget.prototype.on.call(this, type, callback, target);
    },

    /**
     * Removes the callback previously registered with the same type, callback, target and or useCapture.
     * This method is merely an alias to removeEventListener.
     *
     * @method off
     * @param {String} type - A string representing the event type being removed.
     * @param {Function} callback - The callback to remove.
     * @param {Object} [target] - The target to invoke the callback, if it's not given, only callback without target will be removed
     */
    off: function (type, callback, target) {
        EventTarget.prototype.off.call(this, type, callback, target);

        if (_touchEvents.indexOf(type) !== -1) {
            this._checkTouchListeners();
        }
        else if (_mouseEvents.indexOf(type) !== -1) {
            this._checkMouseListeners();
        }
    },

    /**
     * Removes all callbacks previously registered with the same target.
     *
     * @method targetOff
     * @param {Object} target - The target to be searched for all related callbacks
     */
    targetOff: function (target) {
        EventTarget.prototype.targetOff.call(this, target);

        this._checkTouchListeners();
        this._checkMouseListeners();
    },

    _checkTouchListeners: function () {
        if (!(this._objFlags & Destroying) && this._bubblingListeners && this._touchListener) {
            for (var i = 0; i < _touchEvents.length; ++i) {
                if (this._bubblingListeners.has(_touchEvents[i])) {
                    return;
                }
            }

            cc.eventManager.removeListener(this._touchListener);
            this._touchListener = null;
        }
    },
    _checkMouseListeners: function () {
        if (!(this._objFlags & Destroying) && this._bubblingListeners && this._mouseListener) {
            for (var i = 0; i < _mouseEvents.length; ++i) {
                if (this._bubblingListeners.has(_mouseEvents[i])) {
                    return;
                }
            }

            cc.eventManager.removeListener(this._mouseListener);
            this._mouseListener = null;
        }
    },

    _hitTest: function (point, listener) {
        var w = this.width,
            h = this.height;
        var rect = cc.rect(0, 0, w, h);
        var trans = this.getNodeToWorldTransform();
        cc._rectApplyAffineTransformIn(rect, trans);
        var left = point.x - rect.x,
            right = rect.x + rect.width - point.x,
            bottom = point.y - rect.y,
            top = rect.y + rect.height - point.y;
        if (left >= 0 && right >= 0 && top >= 0 && bottom >= 0) {
            if (listener && listener.mask) {
                var mask = listener.mask;
                var parent = this;
                for (var i = 0; parent && i < mask.index; ++i, parent = parent.parent) {}
                // find mask parent, should hit test it
                if (parent === mask.node) {
                    return parent._hitTest(point);
                }
                // mask parent no longer exists
                else {
                    listener.mask = null;
                    return true;
                }
            }
            else {
                return true;
            }
        }
        else {
            return false;
        }
    },

    // Store all bubbling parents that are listening to the same event in the array
    _getBubblingTargets: function (type, array) {
        var parent = this.parent;
        while (parent) {
            if (parent.hasEventListener(type)) {
                array.push(parent);
            }
            parent = parent.parent;
        }
    },

    isRunning: function () {
        return this._activeInHierarchy;
    },

// ACTIONS
    /**
     * Executes an action, and returns the action that is executed.<br/>
     * The node becomes the action's target. Refer to cc.Action's getTarget()
     * Calling runAction while the node is not active won't have any effect
     * @method runAction
     * @param {Action} action
     * @return {Action} An Action pointer
     */
    runAction: function (action) {
        if (!this.active) 
            return;
        cc.assert(action, cc._LogInfos.Node.runAction);

        if (cc.sys.isNative) {
            this._retainAction(action);
            this._sgNode._owner = this;
        }
        cc.director.getActionManager().addAction(action, this, false);
        return action;
    },

    /**
     * Stops and removes all actions from the running action list .
     * @method stopAllActions
     */
    stopAllActions: function () {
        cc.director.getActionManager().removeAllActionsFromTarget(this);
    },

    /**
     * Stops and removes an action from the running action list.
     * @method stopAction
     * @param {Action} action An action object to be removed.
     */
    stopAction: function (action) {
        cc.director.getActionManager().removeAction(action);
    },

    /**
     * Removes an action from the running action list by its tag.
     * @method stopActionByTag
     * @param {Number} tag A tag that indicates the action to be removed.
     */
    stopActionByTag: function (tag) {
        if (tag === cc.Action.TAG_INVALID) {
            cc.log(cc._LogInfos.Node.stopActionByTag);
            return;
        }
        cc.director.getActionManager().removeActionByTag(tag, this);
    },

    /**
     * Returns an action from the running action list by its tag.
     * @method getActionByTag
     * @see cc.Action#getTag and cc.Action#setTag
     * @param {Number} tag
     * @return {Action} The action object with the given tag.
     */
    getActionByTag: function (tag) {
        if (tag === cc.Action.TAG_INVALID) {
            cc.log(cc._LogInfos.Node.getActionByTag);
            return null;
        }
        cc.director.getActionManager().getActionByTag(tag, this);
    },

    /** <p>Returns the numbers of actions that are running plus the ones that are schedule to run (actions in actionsToAdd and actions arrays).<br/>
     *    Composable actions are counted as 1 action. Example:<br/>
     *    If you are running 1 Sequence of 7 actions, it will return 1. <br/>
     *    If you are running 7 Sequences of 2 actions, it will return 7.</p>
     * @method getNumberOfRunningActions
     * @return {Number} The number of actions that are running plus the ones that are schedule to run
     */
    getNumberOfRunningActions: function () {
        cc.director.getActionManager().numberOfRunningActionsInTarget(this);
    },

    _retainAction: function (action) {
        if (cc.sys.isNative && action instanceof cc.Action && this._retainedActions.indexOf(action) === -1) {
            this._retainedActions.push(action);
            action.retain();
        }
    },

    _releaseAllActions: function () {
        if (cc.sys.isNative) {
            for (var i = 0; i < this._retainedActions.length; ++i) {
                this._retainedActions[i].release();
            }
            this._retainedActions.length = 0;
        }
    },

});

// In JSB, when inner sg node being replaced, the system event listeners will be cleared.
// We need a mechanisme to guarentee the persistence of system event listeners.
if (cc.sys.isNative) {
    cc.js.getset(Node.prototype, '_sgNode',
        function () {
            return this.__sgNode;
        },
        function (value) {
            this.__sgNode = value;
            if (this._touchListener) {
                this._touchListener.retain();
                cc.eventManager.removeListener(this._touchListener);
                cc.eventManager.addListener(this._touchListener, this);
                this._touchListener.release();
            }
            if (this._mouseListener) {
                this._mouseListener.retain();
                cc.eventManager.removeListener(this._mouseListener);
                cc.eventManager.addListener(this._mouseListener, this);
                this._mouseListener.release();
            }
        },
        true
    );
}

/**
 * @event position-changed
 * @param {Event} event
 * @param {Vec2} event.detail - old position
 */
/**
 * @event rotation-changed
 * @param {Event} event
 * @param {Number} event.detail - old rotation x
 */
/**
 * @event scale-changed
 * @param {Event} event
 * @param {Vec2} event.detail - old scale
 */
/**
 * @event size-changed
 * @param {Event} event
 * @param {Size} event.detail - old size
 */
/**
 * @event anchor-changed
 * @param {Event} event
 * @param {Vec2} event.detail - old anchor
 */
/**
 * @event color-changed
 * @param {Event} event
 * @param {Color} event.detail - old color
 */
/**
 * @event opacity-changed
 * @param {Event} event
 * @param {Number} event.detail - old opacity
 */
/**
 * @event child-added
 * @param {Event} event
 * @param {Node} event.detail - child
 */
/**
 * @event child-removed
 * @param {Event} event
 * @param {Node} event.detail - child
 */
/**
 * @event child-reorder
 * @param {Event} event
 */
/**
 * Note: This event is only emitted from the top most node whose active value did changed,
 * not including its child nodes.
 * @event active-in-hierarchy-changed
 * @param {Event} event
 */

/**
 *
 * @event touchstart
 *
 */

Node.EventType = EventType;

cc.Node = module.exports = Node;
