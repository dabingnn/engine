
'use strict';

var GraphNode = function GraphNode() {
    this.name = "Untitled"; // Non-unique human readable name
    this._labels = {};

    // Local-space properties of transform (only first 3 are settable by the user)
    this.localPosition = new cc3d.math.Vec3(0, 0, 0);
    this.localRotation = new cc3d.math.Quat(0, 0, 0, 1);
    this.localScale = new cc3d.math.Vec3(1, 1, 1);
    this.localEulerAngles = new cc3d.math.Vec3(0, 0, 0); // Only calculated on request

    // World-space properties of transform
    this.position = new cc3d.math.Vec3(0, 0, 0);
    this.rotation = new cc3d.math.Quat(0, 0, 0, 1);
    this.eulerAngles = new cc3d.math.Vec3(0, 0, 0);

    this.localTransform = new cc3d.math.Mat4();
    this.dirtyLocal = false;

    this.worldTransform = new cc3d.math.Mat4();
    this.dirtyWorld = false;

    this._right = new cc3d.math.Vec3();
    this._up = new cc3d.math.Vec3();
    this._forward = new cc3d.math.Vec3();

    this._parent = null;
    this._children = [];

    this._enabled = true;
    this._enabledInHierarchy = false;
};

Object.defineProperty(GraphNode.prototype, 'right', {
    get: function() {
        return this.getWorldTransform().getX(this._right).normalize();
    }
});

Object.defineProperty(GraphNode.prototype, 'up', {
    get: function() {
        return this.getWorldTransform().getY(this._up).normalize();
    }
});

Object.defineProperty(GraphNode.prototype, 'forward', {
    get: function() {
        return this.getWorldTransform().getZ(this._forward).normalize().scale(-1);
    }
});

Object.defineProperty(GraphNode.prototype, 'enabled', {
    get: function () {
        // make sure to check this._enabled too because if that
        // was false when a parent was updated the _enabledInHierarchy
        // flag may not have been updated for optimization purposes
        return this._enabled && this._enabledInHierarchy;
    },

    set: function (enabled) {
        if (this._enabled !== enabled) {
            this._enabled = enabled;

            if (!this._parent || this._parent.enabled) {
                this._notifyHierarchyStateChanged(this, enabled);
            }

        }
    }
});

cc3d.extend(GraphNode.prototype, {
    _notifyHierarchyStateChanged: function (node, enabled) {
        node._onHierarchyStateChanged(enabled);

        var c = node._children;
        for (var i=0, len=c.length; i<len; i++) {
            if (c[i]._enabled) {
                this._notifyHierarchyStateChanged(c[i], enabled);
            }
        }
    },

    _onHierarchyStateChanged: function (enabled) {
        // Override in derived classes
        this._enabledInHierarchy = enabled;
    },

    _cloneInternal: function (clone) {
        clone.name = this.name;
        clone._labels = cc3d.extend(this._labels, {});

        clone.localPosition.copy(this.localPosition);
        clone.localRotation.copy(this.localRotation);
        clone.localScale.copy(this.localScale);
        clone.localEulerAngles.copy(this.localEulerAngles);

        clone.position.copy(this.position);
        clone.rotation.copy(this.rotation);
        clone.eulerAngles.copy(this.eulerAngles);

        clone.localTransform.copy(this.localTransform);
        clone.dirtyLocal = this.dirtyLocal;

        clone.worldTransform.copy(this.worldTransform);
        clone.dirtyWorld = this.dirtyWorld;

        clone._enabled = this._enabled;

        // false as this node is not in the hierarchy yet
        clone._enabledInHierarchy = false;
    },

    clone: function () {
        var clone = new GraphNode();
        this._cloneInternal(clone);
        return clone;
    },

    find: function (attr, value) {
        var i;
        var children = this.getChildren();
        var length = children.length;
        var results = [];
        var testValue;
        if(this[attr]) {
            if(this[attr] instanceof Function) {
                testValue = this[attr]();
            } else {
                testValue = this[attr];
            }
            if(testValue === value) {
                results.push(this);
            }
        }

        for(i = 0; i < length; ++i) {
            results = results.concat(children[i].find(attr, value));
        }

        return results;
    },

    findOne: function(attr, value) {
        var i;
        var children = this.getChildren();
        var length = children.length;
        var result = null;
        var testValue;
        if(this[attr]) {
            if(this[attr] instanceof Function) {
                testValue = this[attr]();
            } else {
                testValue = this[attr];
            }
            if(testValue === value) {
                return this;
            }
        }

        for(i = 0; i < length; ++i) {
            result = children[i].findOne(attr, value);
            if(result !== null) {
                return result;
            }
        }

        return null;
    },

    findByName: function (name) {
        if (this.name === name) return this;

        for (var i = 0; i < this._children.length; i++) {
            var found = this._children[i].findByName(name);
            if (found !== null) return found;
        }
        return null;
    },

    findByPath: function (path) {
        // split the paths in parts. Each part represents a deeper hierarchy level
        var parts = path.split('/');
        var currentParent = this;
        var result = null;

        for (var i = 0, imax=parts.length; i < imax && currentParent; i++) {
            var part = parts[i];

            result = null;

            // check all the children
            var children = currentParent._children;
            for (var j = 0, jmax = children.length; j < jmax; j++) {
                if (children[j].name == part) {
                    result = children[j];
                    break;
                }
            }

            // keep going deeper in the hierarchy
            currentParent = result;
        }

        return result;
    },

    getPath: function () {
        var parent = this._parent;
        if (parent) {
            var path = this.name;
            var format = "{0}/{1}";

            while (parent && parent._parent) {
                path = pc.string.format(format, parent.name, path);
                parent = parent._parent;
            }

            return path;
        } else {
            return '';
        }
    },

    getRoot: function () {
        var parent = this.getParent();
        if (!parent) {
            return this;
        }

        while (parent.getParent()) {
            parent = parent.getParent();
        }

        return parent;
    },

    getParent: function () {
        return this._parent;
    },

    getChildren: function () {
        return this._children;
    },

    getEulerAngles: function () {
        this.getWorldTransform().getEulerAngles(this.eulerAngles);
        return this.eulerAngles;
    },

    getLocalEulerAngles: function () {
        this.localRotation.getEulerAngles(this.localEulerAngles);
        return this.localEulerAngles;
    },

    getLocalPosition: function () {
        return this.localPosition;
    },

    getLocalRotation: function () {
        return this.localRotation;
    },

    getLocalScale: function () {
        return this.localScale;
    },

    getLocalTransform: function () {
        if (this.dirtyLocal) {
            this.localTransform.setTRS(this.localPosition, this.localRotation, this.localScale);

            this.dirtyLocal = false;
            this.dirtyWorld = true;
        }
        return this.localTransform;
    },

    getName: function () {
        return this.name;
    },

    getPosition: function () {
        this.getWorldTransform().getTranslation(this.position);
        return this.position;
    },

    getRotation: function () {
        this.rotation.setFromMat4(this.getWorldTransform());
        return this.rotation;
    },

    getWorldTransform: function () {
        var syncList = [];

        return function () {
            var current = this;
            syncList.length = 0;

            while (current !== null) {
                syncList.push(current);
                current = current._parent;
            }

            for (var i = syncList.length - 1; i >= 0; i--) {
                syncList[i].sync();
            }

            return this.worldTransform;
        };
    }(),

    reparent: function (parent, index) {
        var current = this.getParent();
        if (current) {
            current.removeChild(this);
        }
        if (parent) {
            if (index >= 0) {
                parent.insertChild(this, index);
            } else {
                parent.addChild(this);
            }
        }
    },

    setLocalEulerAngles: function () {
        var ex, ey, ez;
        switch (arguments.length) {
            case 1:
                ex = arguments[0].x;
                ey = arguments[0].y;
                ez = arguments[0].z;
                break;
            case 3:
                ex = arguments[0];
                ey = arguments[1];
                ez = arguments[2];
                break;
        }

        this.localRotation.setFromEulerAngles(ex, ey, ez);
        this.dirtyLocal = true;
    },

    setLocalPosition: function () {
        if (arguments.length === 1) {
            this.localPosition.copy(arguments[0]);
        } else {
            this.localPosition.set(arguments[0], arguments[1], arguments[2]);
        }
        this.dirtyLocal = true;
    },

    setLocalRotation: function (q) {
        if (arguments.length === 1) {
            this.localRotation.copy(arguments[0]);
        } else {
            this.localRotation.set(arguments[0], arguments[1], arguments[2], arguments[3]);
        }
        this.dirtyLocal = true;
    },

    setLocalScale: function () {
        if (arguments.length === 1) {
            this.localScale.copy(arguments[0]);
        } else {
            this.localScale.set(arguments[0], arguments[1], arguments[2]);
        }
        this.dirtyLocal = true;
    },

    setName: function (name) {
        this.name = name;
    },

    setPosition: function () {
        var position = new cc3d.math.Vec3();
        var invParentWtm = new cc3d.math.Mat4();

        return function () {
            if (arguments.length === 1) {
                position.copy(arguments[0]);
            } else {
                position.set(arguments[0], arguments[1], arguments[2]);
            }

            if (this._parent === null) {
                this.localPosition.copy(position);
            } else {
                invParentWtm.copy(this._parent.getWorldTransform()).invert();
                invParentWtm.transformPoint(position, this.localPosition);
            }
            this.dirtyLocal = true;
        };
    }(),

    setRotation: function () {
        var rotation = new cc3d.math.Quat();
        var invParentRot = new cc3d.math.Quat();

        return function () {
            if (arguments.length === 1) {
                rotation.copy(arguments[0]);
            } else {
                rotation.set(arguments[0], arguments[1], arguments[2], arguments[3]);
            }

            if (this._parent === null) {
                this.localRotation.copy(rotation);
            } else {
                var parentRot = this._parent.getRotation();
                invParentRot.copy(parentRot).invert();
                this.localRotation.copy(invParentRot).mul(rotation);
            }
            this.dirtyLocal = true;
        };
    }(),

    setEulerAngles: function () {
        var invParentRot = new cc3d.math.Quat();

        return function () {
            var ex, ey, ez;
            switch (arguments.length) {
                case 1:
                    ex = arguments[0].x;
                    ey = arguments[0].y;
                    ez = arguments[0].z;
                    break;
                case 3:
                    ex = arguments[0];
                    ey = arguments[1];
                    ez = arguments[2];
                    break;
            }

            this.localRotation.setFromEulerAngles(ex, ey, ez);

            if (this._parent !== null) {
                var parentRot = this._parent.getRotation();
                invParentRot.copy(parentRot).invert();
                this.localRotation.mul2(invParentRot, this.localRotation);
            }
            this.dirtyLocal = true;
        };
    }(),

    addChild: function (node) {
        if (node.getParent() !== null) {
            throw new Error("GraphNode is already parented");
        }

        this._children.push(node);
        this._onInsertChild(node);
    },

    addChildAndSaveTransform: function(node) {
        var wPos = node.getPosition();
        var wRot = node.getRotation();

        var current = node.getParent();
        if (current) {
            current.removeChild(node);
        }

        if (this.tmpMat4 === undefined) {
            this.tmpMat4 = new cc3d.math.Mat4();
            this.tmpQuat = new cc3d.math.Quat();
        }

        node.setPosition(this.tmpMat4.copy(this.worldTransform).invert().transformPoint(wPos));
        node.setRotation(this.tmpQuat.copy(this.getRotation()).invert().mul(wRot));

        this._children.push(node);

        this._onInsertChild(node);
    },

    insertChild: function (node, index) {
        if (node.getParent() !== null) {
            throw new Error("GraphNode is already parented");
        }

        this._children.splice(index, 0, node);
        this._onInsertChild(node);
    },

    _onInsertChild: function (node) {
        node._parent = this;

        // the child node should be enabled in the hierarchy only if itself is enabled and if
        // this parent is enabled
        var enabledInHierarchy = (node._enabled && this.enabled);
        if (node._enabledInHierarchy !== enabledInHierarchy) {
            node._enabledInHierarchy = enabledInHierarchy;

            // propagate the change to the children - necessary if we reparent a node
            // under a parent with a different enabled state (if we reparent a node that is
            // not active in the hierarchy under a parent who is active in the hierarchy then
            // we want our node to be activated)
            node._notifyHierarchyStateChanged(node, enabledInHierarchy);
        }

        // The child (plus subhierarchy) will need world transforms to be recalculated
        node.dirtyWorld = true;
    },

    removeChild: function (child) {
        var i;
        var length = this._children.length;

        // Clear parent
        child._parent = null;

        // Remove from child list
        for(i = 0; i < length; ++i) {
            if(this._children[i] === child) {
                this._children.splice(i, 1);
                return;
            }
        }
    },

    addLabel: function (label) {
        this._labels[label] = true;
    },

    getLabels: function () {
        return Object.keys(this._labels);
    },

    hasLabel: function (label) {
        return !!this._labels[label];
    },

    removeLabel: function (label) {
        delete this._labels[label];
    },

    findByLabel: function (label, results) {
        var i, length = this._children.length;
        results = results || [];

        if(this.hasLabel(label)) {
            results.push(this);
        }

        for(i = 0; i < length; ++i) {
            results = this._children[i].findByLabel(label, results);
        }

        return results;
    },

    sync: function () {
        if (this.dirtyLocal) {
            this.localTransform.setTRS(this.localPosition, this.localRotation, this.localScale);

            this.dirtyLocal = false;
            this.dirtyWorld = true;
        }

        if (this.dirtyWorld) {
            if (this._parent === null) {
                this.worldTransform.copy(this.localTransform);
            } else {
                this.worldTransform.mul2(this._parent.worldTransform, this.localTransform);
            }

            this.dirtyWorld = false;

            for (var i = 0, len = this._children.length; i < len; i++) {
                this._children[i].dirtyWorld = true;
            }
        }
    },

    syncHierarchy: (function () {
        // cache this._children and the syncHierarchy method itself
        // for optimization purposes
        var F = function () {
            if (!this._enabled) {
                return;
            }

            // sync this object
            this.sync();

            // sync the children
            var c = this._children;
            for(var i = 0, len = c.length;i < len;i++) {
                F.call(c[i]);
            }
        };
        return F;
    })(),

    lookAt: function () {
        var matrix = new cc3d.math.Mat4();
        var target = new cc3d.math.Vec3();
        var up = new cc3d.math.Vec3();
        var rotation = new cc3d.math.Quat();

        return function () {
            switch (arguments.length) {
                case 1:
                    target.copy(arguments[0]);
                    up.copy(cc3d.math.Vec3.UP);
                    break;
                case 2:
                    target.copy(arguments[0]);
                    up.copy(arguments[1]);
                    break;
                case 3:
                    target.set(arguments[0], arguments[1], arguments[2]);
                    up.copy(cc3d.math.Vec3.UP);
                    break;
                case 6:
                    target.set(arguments[0], arguments[1], arguments[2]);
                    up.set(arguments[3], arguments[4], arguments[5]);
                    break;
            }

            matrix.setLookAt(this.getPosition(), target, up);
            rotation.setFromMat4(matrix);
            this.setRotation(rotation);
        };
    }(),

    translate: function () {
        var translation = new cc3d.math.Vec3();

        return function () {
            switch (arguments.length) {
                case 1:
                    translation.copy(arguments[0]);
                    break;
                case 3:
                    translation.set(arguments[0], arguments[1], arguments[2]);
                    break;
            }

            translation.add(this.getPosition());
            this.setPosition(translation);
        };
    }(),

    translateLocal: function () {
        var translation = new cc3d.math.Vec3();

        return function () {
            switch (arguments.length) {
                case 1:
                    translation.copy(arguments[0]);
                    break;
                case 3:
                    translation.set(arguments[0], arguments[1], arguments[2]);
                    break;
            }

            this.localRotation.transformVector(translation, translation);
            this.localPosition.add(translation);
            this.dirtyLocal = true;
        };
    }(),

    rotate: function () {
        var quaternion = new cc3d.math.Quat();
        var invParentRot = new cc3d.math.Quat();

        return function () {
            var ex, ey, ez;
            switch (arguments.length) {
                case 1:
                    ex = arguments[0].x;
                    ey = arguments[0].y;
                    ez = arguments[0].z;
                    break;
                case 3:
                    ex = arguments[0];
                    ey = arguments[1];
                    ez = arguments[2];
                    break;
            }

            quaternion.setFromEulerAngles(ex, ey, ez);

            if (this._parent === null) {
                this.localRotation.mul2(quaternion, this.localRotation);
            } else {
                var rot = this.getRotation();
                var parentRot = this._parent.getRotation();

                invParentRot.copy(parentRot).invert();
                quaternion.mul2(invParentRot, quaternion);
                this.localRotation.mul2(quaternion, rot);
            }

            this.dirtyLocal = true;
        };
    }(),

    rotateLocal: function () {
        var quaternion = new cc3d.math.Quat();

        return function () {
            var ex, ey, ez;
            switch (arguments.length) {
                case 1:
                    ex = arguments[0].x;
                    ey = arguments[0].y;
                    ez = arguments[0].z;
                    break;
                case 3:
                    ex = arguments[0];
                    ey = arguments[1];
                    ez = arguments[2];
                    break;
            }

            quaternion.setFromEulerAngles(ex, ey, ez);

            this.localRotation.mul(quaternion);
            this.dirtyLocal = true;
        };
    }(),
});

cc3d.GraphNode = GraphNode;
