pc.extend(pc, function () {
    /**
     * @name pc.GraphNode
     * @class A hierarchical scene node.
     * @property {String} name The non-unique name of a graph node.
     * @property {pc.Tags} tags Interface for tagging graph nodes. Tag based searches can be performed using the {@link pc.GraphNode#findByTag} function.
     */
    var GraphNode = function GraphNode() {
        this.name = "Untitled"; // Non-unique human readable name
        this.tags = new pc.Tags(this);

        this._labels = {};

        // Local-space properties of transform (only first 3 are settable by the user)
        this.localPosition = new cc.Vec3(0, 0, 0);
        this.localRotation = new cc.Quat(0, 0, 0, 1);
        this.localScale = new cc.Vec3(1, 1, 1);
        this.localEulerAngles = new cc.Vec3(0, 0, 0); // Only calculated on request

        // World-space properties of transform
        this.position = new cc.Vec3(0, 0, 0);
        this.rotation = new cc.Quat(0, 0, 0, 1);
        this.eulerAngles = new cc.Vec3(0, 0, 0);

        this.localTransform = new cc.Mat4();
        this.dirtyLocal = false;
        this._aabbVer = 0;

        this.worldTransform = new cc.Mat4();
        this.dirtyWorld = false;

        this._right = new cc.Vec3();
        this._up = new cc.Vec3();
        this._forward = new cc.Vec3();

        this._parent = null;
        this._children = [];

        this._enabled = true;
        this._enabledInHierarchy = false;
    };

    /**
     * @readonly
     * @name pc.GraphNode#right
     * @description The normalized local space X-axis vector of the graph node in world space.
     * @type cc.Vec3
     */
    Object.defineProperty(GraphNode.prototype, 'right', {
        get: function () {
            return this.getWorldTransform().getX(this._right).normalize();
        }
    });

    /**
     * @readonly
     * @name pc.GraphNode#up
     * @description The normalized local space Y-axis vector of the graph node in world space.
     * @type cc.Vec3
     */
    Object.defineProperty(GraphNode.prototype, 'up', {
        get: function () {
            return this.getWorldTransform().getY(this._up).normalize();
        }
    });

    /**
     * @readonly
     * @name pc.GraphNode#forward
     * @description The normalized local space negative Z-axis vector of the graph node in world space.
     * @type cc.Vec3
     */
    Object.defineProperty(GraphNode.prototype, 'forward', {
        get: function () {
            return this.getWorldTransform().getZ(this._forward).normalize().scale(-1);
        }
    });

    /**
     * @name pc.GraphNode#enabled
     * @type Boolean
     * @description Enable or disable a GraphNode. If one of the GraphNode's parents is disabled
     * there will be no other side effects. If all the parents are enabled then
     * the new value will activate / deactivate all the enabled children of the GraphNode.
     */
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

                if (!this._parent || this._parent.enabled)
                    this._notifyHierarchyStateChanged(this, enabled);
            }
        }
    });

    /**
     * @readonly
     * @name pc.GraphNode#parent
     * @type pc.GraphNode
     * @description A read-only property to get a parent graph node
     */
    Object.defineProperty(GraphNode.prototype, 'parent', {
        get: function () {
            return this._parent;
        }
    });

    /**
     * @readonly
     * @name pc.GraphNode#root
     * @type pc.GraphNode
     * @description A read-only property to get highest graph node from current node
     */
    Object.defineProperty(GraphNode.prototype, 'root', {
        get: function () {
            var parent = this._parent;
            if (!parent)
                return this;

            while (parent._parent)
                parent = parent._parent;

            return parent;
        }
    });

    /**
     * @readonly
     * @name pc.GraphNode#children
     * @type pc.GraphNode[]
     * @description A read-only property to get the children of this graph node.
     */
    Object.defineProperty(GraphNode.prototype, 'children', {
        get: function () {
            return this._children;
        }
    });

    pc.extend(GraphNode.prototype, {
        _notifyHierarchyStateChanged: function (node, enabled) {
            node._onHierarchyStateChanged(enabled);

            var c = node._children;
            for (var i = 0, len = c.length; i < len; i++) {
                if (c[i]._enabled)
                    this._notifyHierarchyStateChanged(c[i], enabled);
            }
        },

        /**
         * @private
         * @function
         * Called when the enabled flag of the entity or one of its
         * parents changes
         */
        _onHierarchyStateChanged: function (enabled) {
            // Override in derived classes
            this._enabledInHierarchy = enabled;
        },

        _cloneInternal: function (clone) {
            clone.name = this.name;

            var tags = this.tags._list;
            for (var i = 0; i < tags.length; i++)
                clone.tags.add(tags[i]);

            clone._labels = pc.extend(this._labels, {});

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
            clone._aabbVer = this._aabbVer + 1;

            clone._enabled = this._enabled;

            // false as this node is not in the hierarchy yet
            clone._enabledInHierarchy = false;
        },

        clone: function () {
            var clone = new pc.GraphNode();
            this._cloneInternal(clone);
            return clone;
        },

        /**
         * @function
         * @name pc.GraphNode#find
         * @description Search the graph for nodes using a supplied method that implements test for seach.
         * @param {Function} fn Method which is executed for each descendant node, to test if node satisfies search logic. Returning true from that method will include node into results.
         * @returns {pc.GraphNode[]} An array of GraphNodes
         * @example
         * // finds all nodes that have model component and have `door` in their lower cased name
         * var doors = house.find(function(node) {
         *     return node.model && node.name.toLowerCase().indexOf('door') !== -1;
         * });
         */
        find: function (attr, value) {
            var results = [];
            var len = this._children.length;
            var i, descendants;

            if (attr instanceof Function) {
                var fn = attr;

                for (i = 0; i < len; i++) {
                    if (fn(this._children[i]))
                        results.push(this._children[i]);

                    descendants = this._children[i].find(fn);
                    if (descendants.length)
                        results = results.concat(descendants);
                }
            } else {
                var testValue;

                if (this[attr]) {
                    if (this[attr] instanceof Function) {
                        testValue = this[attr]();
                    } else {
                        testValue = this[attr];
                    }
                    if (testValue === value)
                        results.push(this);
                }

                for (i = 0; i < len; ++i) {
                    descendants = this._children[i].find(attr, value);
                    if (descendants.length)
                        results = results.concat(descendants);
                }
            }

            return results;
        },

        /**
         * @function
         * @name pc.GraphNode#findOne
         * @description Depth first search the graph for nodes using suplied method to find first matching node.
         * @param {Function} fn Method which is executed for each descendant node, to test if node satisfies search logic. Returning true from that method will stop search and return that node.
         * @returns {pc.GraphNode} A single graph node.
         * @example
         * // find node that is called `head` and have model component
         * var head = player.find(function(node) {
         *     return node.model && node.name === 'head';
         * });
         */
        findOne: function (attr, value) {
            var i;
            var len = this._children.length;
            var result = null;

            if (attr instanceof Function) {
                var fn = attr;

                result = fn(this);
                if (result)
                    return this;

                for (i = 0; i < len; i++) {
                    result = this._children[i].findOne(fn);
                    if (result)
                        return this._children[i];
                }
            } else {
                var testValue;
                if (this[attr]) {
                    if (this[attr] instanceof Function) {
                        testValue = this[attr]();
                    } else {
                        testValue = this[attr];
                    }
                    if (testValue === value) {
                        return this;
                    }
                }

                for (i = 0; i < len; i++) {
                    result = this._children[i].findOne(attr, value);
                    if (result !== null)
                        return result;
                }
            }

            return null;
        },

        /**
         * @function
         * @name pc.GraphNode#findByTag
         * @description Return all graph nodes that satisfy the search query.
         * Query can be simply a string, or comma separated strings,
         * to have inclusive results of assets that match at least one query.
         * A query that consists of an array of tags can be used to match graph nodes that have each tag of array
         * @param {String} query Name of a tag or array of tags
         * @returns {pc.GraphNode[]} A list of all graph nodes that match the query
         * @example
         * var animals = node.findByTag("animal");
         * // returns all graph nodes that tagged by `animal`
         * @example
         * var birdsAndMammals = node.findByTag("bird", "mammal");
         * // returns all graph nodes that tagged by `bird` OR `mammal`
         * @example
         * var meatEatingMammals = node.findByTag([ "carnivore", "mammal" ]);
         * // returns all assets that tagged by `carnivore` AND `mammal`
         * @example
         * var meatEatingMammalsAndReptiles = node.findByTag([ "carnivore", "mammal" ], [ "carnivore", "reptile" ]);
         * // returns all assets that tagged by (`carnivore` AND `mammal`) OR (`carnivore` AND `reptile`)
         */
        findByTag: function () {
            var tags = this.tags._processArguments(arguments);
            return this._findByTag(tags);
        },

        _findByTag: function (tags) {
            var result = [];
            var i, len = this._children.length;
            var descendants;

            for (i = 0; i < len; i++) {
                if (this._children[i].tags._has(tags))
                    result.push(this._children[i]);

                descendants = this._children[i]._findByTag(tags);
                if (descendants.length)
                    result = result.concat(descendants);
            }

            return result;
        },

        /**
         * @function
         * @name pc.GraphNode#findByName
         * @description Get the first node found in the graph with the name. The search
         * is depth first.
         * @param {String} name The name of the graph.
         * @returns {pc.GraphNode} The first node to be found matching the supplied name.
         */
        findByName: function (name) {
            if (this.name === name) return this;

            for (var i = 0; i < this._children.length; i++) {
                var found = this._children[i].findByName(name);
                if (found !== null) return found;
            }
            return null;
        },

        /**
         * @function
         * @name pc.GraphNode#findByPath
         * @description Get the first node found in the graph by its full path in the graph.
         * The full path has this form 'parent/child/sub-child'. The search is depth first.
         * @param {String} path The full path of the pc.GraphNode.
         * @returns {pc.GraphNode} The first node to be found matching the supplied path.
         * @example
         * var path = this.entity.findByPath('child/another_child');
         */
        findByPath: function (path) {
            // split the paths in parts. Each part represents a deeper hierarchy level
            var parts = path.split('/');
            var currentParent = this;
            var result = null;

            for (var i = 0, imax = parts.length; i < imax && currentParent; i++) {
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

        /**
         * @function
         * @name  pc.GraphNode#getPath
         * @description Gets the path of the entity relative to the root of the hierarchy
         * @return {String} The path
         * @example
         * var path = this.entity.getPath();
         */
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


        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#getRoot
         * @description Get the highest ancestor node from this graph node.
         * @return {pc.GraphNode} The root node of the hierarchy to which this node belongs.
         * @example
         * var root = this.entity.getRoot();
         */
        getRoot: function () {
            var parent = this._parent;
            if (!parent) {
                return this;
            }

            while (parent._parent) {
                parent = parent._parent;
            }

            return parent;
        },

        /**
         * @deprecated
         * @function
         * @name pc.GraphNode#getParent
         * @description Get the parent GraphNode
         * @returns {pc.GraphNode} The parent node
         * @example
         * var parent = this.entity.getParent();
         */
        getParent: function () {
            return this._parent;
        },

        /**
         * @function
         * @name pc.GraphNode#isDescendantOf
         * @description Check if node is descendant of another node.
         * @returns {Boolean} if node is descendant of another node
         * @example
         * if (roof.isDescendantOf(house)) {
         *     // roof is descendant of house entity
         * }
         */
        isDescendantOf: function (node) {
            var parent = this._parent;
            while (parent) {
                if (parent === node)
                    return true;

                parent = parent._parent;
            }
            return false;
        },

        /**
         * @function
         * @name pc.GraphNode#isAncestorOf
         * @description Check if node is ancestor for another node.
         * @returns {Boolean} if node is ancestor for another node
         * @example
         * if (body.isAncestorOf(foot)) {
         *     // foot is within body's hierarchy
         * }
         */
        isAncestorOf: function (node) {
            return node.isDescendantOf(this);
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#getChildren
         * @description Get the children of this graph node.
         * @returns {pc.GraphNode[]} The child array of this node.
         * @example
         * var children = this.entity.getChildren();
         * for (i = 0; i < children.length; i++) {
         * // children[i]
         * }
         */
        getChildren: function () {
            return this._children;
        },

        /**
         * @function
         * @name pc.GraphNode#getEulerAngles
         * @description Get the world space rotation for the specified GraphNode in Euler angle
         * form. The order of the returned Euler angles is XYZ. The value returned by this function
         * should be considered read-only. In order to set the world-space rotation of the graph
         * node, use {@link pc.GraphNode#setEulerAngles}.
         * @returns {cc.Vec3} The world space rotation of the graph node in Euler angle form.
         * @example
         * var angles = this.entity.getEulerAngles(); // [0,0,0]
         * angles[1] = 180; // rotate the entity around Y by 180 degrees
         * this.entity.setEulerAngles(angles);
         */
        getEulerAngles: function () {
            this.getWorldTransform().getEulerAngles(this.eulerAngles);
            return this.eulerAngles;
        },

        /**
         * @function
         * @name pc.GraphNode#getLocalEulerAngles
         * @description Get the rotation in local space for the specified GraphNode. The rotation
         * is returned as eurler angles in a 3-dimensional vector where the order is XYZ. The
         * returned vector should be considered read-only. To update the local rotation, use
         * {@link pc.GraphNode#setLocalEulerAngles}.
         * @returns {cc.Vec3} The local space rotation of the graph node as euler angles in XYZ order.
         * @example
         * var angles = this.entity.getLocalEulerAngles();
         * angles[1] = 180;
         * this.entity.setLocalEulerAngles(angles);
         */
        getLocalEulerAngles: function () {
            this.localRotation.getEulerAngles(this.localEulerAngles);
            return this.localEulerAngles;
        },

        /**
         * @function
         * @name pc.GraphNode#getLocalPosition
         * @description Get the position in local space for the specified GraphNode. The position
         * is returned as a 3-dimensional vector. The returned vector should be considered read-only.
         * To update the local position, use {@link pc.GraphNode#setLocalPosition}.
         * @returns {cc.Vec3} The local space position of the graph node.
         * @example
         * var position = this.entity.getLocalPosition();
         * position[0] += 1; // move the entity 1 unit along x.
         * this.entity.setLocalPosition(position);
         */
        getLocalPosition: function () {
            return this.localPosition;
        },

        /**
         * @function
         * @name pc.GraphNode#getLocalRotation
         * @description Get the rotation in local space for the specified GraphNode. The rotation
         * is returned as a quaternion. The returned quaternion should be considered read-only.
         * To update the local rotation, use {@link pc.GraphNode#setLocalRotation}.
         * @returns {cc.Quat} The local space rotation of the graph node as a quaternion.
         * @example
         * var rotation = this.entity.getLocalRotation();
         */
        getLocalRotation: function () {
            return this.localRotation;
        },

        /**
         * @function
         * @name pc.GraphNode#getLocalScale
         * @description Get the scale in local space for the specified GraphNode. The scale
         * is returned as a 3-dimensional vector. The returned vector should be considered read-only.
         * To update the local scale, use {@link pc.GraphNode#setLocalScale}.
         * @returns {cc.Vec3} The local space scale of the graph node.
         * @example
         * var scale = this.entity.getLocalScale();
         * scale.x = 100;
         * this.entity.setLocalScale(scale);
         */
        getLocalScale: function () {
            return this.localScale;
        },

        /**
         * @function
         * @name pc.GraphNode#getLocalTransform
         * @description Get the local transform matrix for this graph node. This matrix
         * is the transform relative to the node's parent's world transformation matrix.
         * @returns {cc.Mat4} The node's local transformation matrix.
         * @example
         * var transform = this.entity.getLocalTransform();
         */
        getLocalTransform: function () {
            if (this.dirtyLocal) {
                this.localTransform.setTRS(this.localPosition, this.localRotation, this.localScale);

                this.dirtyLocal = false;
                this.dirtyWorld = true;
                this._aabbVer++;
            }
            return this.localTransform;
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#getName
         * @description Get the human-readable name for this graph node. Note the name
         * is not guaranteed to be unique. For Entities, this is the name that is set in the PlayCanvas Editor.
         * @returns {String} The name of the node.
         * @example
         * if (this.entity.getName() === "My Entity") {
         *     console.log("My Entity Found");
         * }
         */
        getName: function () {
            return this.name;
        },

        /**
         * @function
         * @name pc.GraphNode#getPosition
         * @description Get the world space position for the specified GraphNode. The
         * value returned by this function should be considered read-only. In order to set
         * the world-space position of the graph node, use {@link pc.GraphNode#setPosition}.
         * @returns {cc.Vec3} The world space position of the graph node.
         * @example
         * var position = this.entity.getPosition();
         * position.x = 10;
         * this.entity.setPosition(position);
         */
        getPosition: function () {
            this.getWorldTransform().getTranslation(this.position);
            return this.position;
        },

        /**
         * @function
         * @name pc.GraphNode#getRotation
         * @description Get the world space rotation for the specified GraphNode in quaternion
         * form. The value returned by this function should be considered read-only. In order
         * to set the world-space rotation of the graph node, use {@link pc.GraphNode#setRotation}.
         * @returns {cc.Quat} The world space rotation of the graph node as a quaternion.
         * @example
         * var rotation = this.entity.getRotation();
         */
        getRotation: function () {
            this.rotation.setFromMat4(this.getWorldTransform());
            return this.rotation;
        },

        /**
         * @function
         * @name pc.GraphNode#getWorldTransform
         * @description Get the world transformation matrix for this graph node.
         * @returns {cc.Mat4} The node's world transformation matrix.
         * @example
         * var transform = this.entity.getWorldTransform();
         */
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

        /**
         * @function
         * @name pc.GraphNode#reparent
         * @description Remove graph node from current parent and add as child to new parent
         * @param {pc.GraphNode} parent New parent to attach graph node to
         * @param {Number} index (optional) The child index where the child node should be placed.
         */
        reparent: function (parent, index) {
            var current = this._parent;
            if (current)
                current.removeChild(this);

            if (parent) {
                if (index >= 0) {
                    parent.insertChild(this, index);
                } else {
                    parent.addChild(this);
                }
            }
        },

        /**
         * @function
         * @name pc.GraphNode#setLocalEulerAngles
         * @description Sets the local space rotation of the specified graph node using euler angles.
         * Eulers are interpreted in XYZ order. Eulers must be specified in degrees.
         * @param {Number} x rotation around x-axis in degrees.
         * @param {Number} y rotation around y-axis in degrees.
         * @param {Number} z rotation around z-axis in degrees.
         * @example
         * this.entity.setLocalEulerAngles(0, 90, 0); // Set rotation of 90 degress around y-axis.
         */
        /**
         * @function
         * @name pc.GraphNode#setLocalEulerAngles^2
         * @description Sets the local space rotation of the specified graph node using euler angles.
         * Eulers are interpreted in XYZ order. Eulers must be specified in degrees.
         * @param {cc.Vec3} e vector containing euler angles in XYZ order.
         * @example
         * var angles = new cc.Vec3(0, 90, 0);
         * this.entity.setLocalEulerAngles(angles); // Set rotation of 90 degress around y-axis.
         */
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

        /**
         * @function
         * @name pc.GraphNode#setLocalPosition
         * @description Sets the local space position of the specified graph node.
         * @param {Number} x x-coordinate of local-space position.
         * @param {Number} y y-coordinate of local-space position.
         * @param {Number} z z-coordinate of local-space position.
         * @example
         * this.entity.setLocalPosition(0, 10, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#setLocalPosition^2
         * @description Sets the local space position of the specified graph node.
         * @param {cc.Vec3} pos position vector of graph node in local space.
         * @example
         * var pos = new cc.Vec3(0, 10, 0);
         * this.entity.setLocalPosition(pos)
         */
        setLocalPosition: function () {
            if (arguments.length === 1) {
                this.localPosition.copy(arguments[0]);
            } else {
                this.localPosition.set(arguments[0], arguments[1], arguments[2]);
            }
            this.dirtyLocal = true;
        },

        /**
         * @function
         * @name pc.GraphNode#setLocalRotation
         * @description Sets the local space rotation of the specified graph node.
         * @param {cc.Quat} q quaternion representing rotation of graph node in local space.
         * var q = cc.Quat();
         * this.entity.setLocalRotation(q);
         */
        /**
         * @function
         * @name pc.GraphNode#setLocalRotation^2
         * @description Sets the local space rotation of the specified graph node.
         * @param {Number} x X component of local space quaternion rotation.
         * @param {Number} y Y component of local space quaternion rotation.
         * @param {Number} z Z component of local space quaternion rotation.
         * @param {Number} w W component of local space quaternion rotation.
         * @example
         * // Set to the identity quaternion
         * this.entity.setLocalRotation(0, 0, 0, 1);
         */
        setLocalRotation: function (q) {
            if (arguments.length === 1) {
                this.localRotation.copy(arguments[0]);
            } else {
                this.localRotation.set(arguments[0], arguments[1], arguments[2], arguments[3]);
            }
            this.dirtyLocal = true;
        },

        /**
         * @function
         * @name pc.GraphNode#setLocalScale
         * @description Sets the local space scale factor of the specified graph node.
         * @param {Number} x x-coordinate of local-space scale.
         * @param {Number} y y-coordinate of local-space scale.
         * @param {Number} z z-coordinate of local-space scale.
         * @example
         * this.entity.setLocalScale(10, 10, 10);
         */
        /**
         * @function
         * @name pc.GraphNode#setLocalScale^2
         * @description Sets the local space scale factor of the specified graph node.
         * @param {cc.Vec3} scale xyz-scale of graph node in local space.
         * @example
         * var scale = new cc.Vec3(10, 10, 10);
         * this.entity.setLocalScale(scale);
         */
        setLocalScale: function () {
            if (arguments.length === 1) {
                this.localScale.copy(arguments[0]);
            } else {
                this.localScale.set(arguments[0], arguments[1], arguments[2]);
            }
            this.dirtyLocal = true;
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#setName
         * @description Sets the non-unique name for this graph node.
         * @param {String} name The name for the node.
         * @example
         * this.entity.setName("My Entity");
         */
        setName: function (name) {
            this.name = name;
        },

        /**
         * @function
         * @name pc.GraphNode#setPosition
         * @description Sets the world space position of the specified graph node.
         * @param {Number} x x-coordinate of world-space position.
         * @param {Number} y y-coordinate of world-space position.
         * @param {Number} z z-coordinate of world-space position.
         * @example
         * this.entity.setPosition(0, 10, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#setPosition^2
         * @description Sets the world space position of the specified graph node.
         * @param {cc.Vec3} position world space position (xyz) of graph node.
         * @example
         * var position = new cc.Vec3(0, 10, 0);
         * this.entity.setPosition(position);
         */
        setPosition: function () {
            var position = new cc.Vec3();
            var invParentWtm = new cc.Mat4();

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

        /**
         * @function
         * @name pc.GraphNode#setRotation
         * @description Sets the world space rotation of the specified graph node using
         * a quaternion.
         * @param {cc.Quat} rot World space rotation (xyz) of graph node.
         * @example
         * var q = new cc.Quat();
         * this.entity.setRotation(q);
         */
        /**
         * @function
         * @name pc.GraphNode#setRotation^2
         * @description Sets the world space rotation of the specified graph node using
         * the 4 components of a quaternion.
         * @param {Number} x X component of world space quaternion rotation.
         * @param {Number} y Y component of world space quaternion rotation.
         * @param {Number} z Z component of world space quaternion rotation.
         * @param {Number} w W component of world space quaternion rotation.
         * @example
         * this.entity.setRotation(0, 0, 0, 1);
         */
        setRotation: function () {
            var rotation = new cc.Quat();
            var invParentRot = new cc.Quat();

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

        /**
         * @function
         * @name pc.GraphNode#setEulerAngles
         * @description Sets the world space orientation of the specified graph node
         * using Euler angles. Angles are specified in degress in XYZ order.
         * @param {Number} ex Rotation around world space X axis in degrees.
         * @param {Number} ey Rotation around world space Y axis in degrees.
         * @param {Number} ez Rotation around world space Z axis in degrees.
         * @example
         * this.entity.setEulerAngles(0, 90, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#setEulerAngles^2
         * @description Sets the world space orientation of the specified graph node
         * using Euler angles. Angles are specified in degress in XYZ order.
         * @param {cc.Vec3} angles Euler angles in degrees (XYZ order).
         * @example
         * var angles = new cc.Vec3(0, 90, 0);
         * this.entity.setEulerAngles(angles);
         */
        setEulerAngles: function () {
            var invParentRot = new cc.Quat();

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

        /**
         * @function
         * @name pc.GraphNode#addChild
         * @description Add a new child to the child list and update the parent value of the child node
         * @param {pc.GraphNode} node The new child to add
         * @example
         * var e = new pc.Entity(app);
         * this.entity.addChild(e);
         */
        addChild: function (node) {
            if (node._parent !== null)
                throw new Error("GraphNode is already parented");

            this._children.push(node);
            this._onInsertChild(node);
        },

        addChildAndSaveTransform: function (node) {
            var wPos = node.getPosition();
            var wRot = node.getRotation();

            var current = node._parent;
            if (current)
                current.removeChild(node);

            if (this.tmpMat4 === undefined) {
                this.tmpMat4 = new cc.Mat4();
                this.tmpQuat = new cc.Quat();
            }

            node.setPosition(this.tmpMat4.copy(this.worldTransform).invert().transformPoint(wPos));
            node.setRotation(this.tmpQuat.copy(this.getRotation()).invert().mul(wRot));

            this._children.push(node);

            this._onInsertChild(node);
        },

        /**
         * @function
         * @name pc.GraphNode#insertChild
         * @description Insert a new child to the child list at the specified index and update the parent value of the child node
         * @param {pc.GraphNode} node The new child to insert
         * @param {Number} index The index in the child list of the parent where the new node will be inserted
         * @example
         * var e = new pc.Entity(app);
         * this.entity.insertChild(e, 1);
         */
        insertChild: function (node, index) {
            if (node._parent !== null)
                throw new Error("GraphNode is already parented");

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
            node._aabbVer++;
        },

        /**
         * @function
         * @name pc.GraphNode#removeChild
         * @description Remove the node from the child list and update the parent value of the child.
         * @param {pc.GraphNode} node The node to remove
         * @example
         * var child = this.entity.children[0];
         * this.entity.removeChild(child);
         */
        removeChild: function (child) {
            var i;
            var length = this._children.length;

            // Clear parent
            child._parent = null;

            // Remove from child list
            for (i = 0; i < length; ++i) {
                if (this._children[i] === child) {
                    this._children.splice(i, 1);
                    return;
                }
            }
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#addLabel
         * @description Add a string label to this graph node, labels can be used to group
         * and filter nodes. For example, the 'enemies' label could be applied to a group of NPCs
         * who are enemies.
         * @param {String} label The label to apply to this graph node.
         */
        addLabel: function (label) {
            this._labels[label] = true;
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#getLabels
         * @description Get an array of all labels applied to this graph node.
         * @returns {String[]} An array of all labels.
         */
        getLabels: function () {
            return Object.keys(this._labels);
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#hasLabel
         * @description Test if a label has been applied to this graph node.
         * @param {String} label The label to test for.
         * @returns {Boolean} True if the label has been added to this GraphNode.
         *
         */
        hasLabel: function (label) {
            return !!this._labels[label];
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#removeLabel
         * @description Remove label from this graph node.
         * @param {String} label The label to remove from this node.
         */
        removeLabel: function (label) {
            delete this._labels[label];
        },

        /**
         * @private
         * @deprecated
         * @function
         * @name pc.GraphNode#findByLabel
         * @description Find all graph nodes from the root and all descendants with the label.
         * @param {String} label The label to search for.
         * @param {pc.GraphNode[]} [results] An array to store the results in.
         * @returns {pc.GraphNode[]} The array passed in or a new array of results.
         */
        findByLabel: function (label, results) {
            var i, length = this._children.length;
            results = results || [];

            if (this.hasLabel(label)) {
                results.push(this);
            }

            for (i = 0; i < length; ++i) {
                results = this._children[i].findByLabel(label, results);
            }

            return results;
        },

        sync: function () {
            if (this.dirtyLocal) {
                this.localTransform.setTRS(this.localPosition, this.localRotation, this.localScale);

                this.dirtyLocal = false;
                this.dirtyWorld = true;
                this._aabbVer++;
            }

            if (this.dirtyWorld) {
                if (this._parent === null) {
                    this.worldTransform.copy(this.localTransform);
                } else {
                    this.worldTransform.mul2(this._parent.worldTransform, this.localTransform);
                }

                this.dirtyWorld = false;
                var child;

                for (var i = 0, len = this._children.length; i < len; i++) {
                    child = this._children[i];
                    child.dirtyWorld = true;
                    child._aabbVer++;

                }
            }
        },

        /**
         * @function
         * @name pc.GraphNode#syncHierarchy
         * @description Updates the world transformation matrices at this node and all of its descendants.
         */
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
                for (var i = 0, len = c.length; i < len; i++) {
                    F.call(c[i]);
                }
            };
            return F;
        })(),

        /**
         * @function
         * @name pc.GraphNode#lookAt
         * @description Reorients the graph node so that the negative z axis points towards the target.
         * @param {cc.Vec3} target The world space coordinate to 'look at'.
         * @param {cc.Vec3} [up] The up vector for the look at transform. If left unspecified,
         * this is set to the world space y axis.
         * @example
         * var position = ... // get position from somewhere
         * // Look at a position, use default 'up' of [0,1,0]
         * this.entity.lookAt(position);
         * // Use a custom up value
         * this.entity.lookAt(position, this.entity.up);
         * // Specify position as elements
         * this.entity.lookAt(0, 0, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#lookAt^2
         * @description Reorients the graph node so that the negative z axis points towards the target.
         * @param {Number} tx X-component of the world space coordinate to 'look at'.
         * @param {Number} ty Y-component of the world space coordinate to 'look at'.
         * @param {Number} tz Z-component of the world space coordinate to 'look at'.
         * @param {Number} [ux] X-component of the up vector for the look at transform. If left unspecified,
         * this is set to the world space y axis.
         * @param {Number} [uy] Y-component of the up vector for the look at transform. If left unspecified,
         * this is set to the world space y axis.
         * @param {Number} [uz] Z-component of the up vector for the look at transform. If left unspecified,
         * this is set to the world space y axis.
         * @example
         * // Look at the world space origin, use default 'up' of [0,1,0]
         * this.entity.lookAt(0, 0, 0);
         * // Look at 10, 10, 10 with an inverted up value
         * this.entity.lookAt(10, 10, 10, 0, -1, 0);
         */
        lookAt: function () {
            var matrix = new cc.Mat4();
            var target = new cc.Vec3();
            var up = new cc.Vec3();
            var rotation = new cc.Quat();

            return function () {
                switch (arguments.length) {
                    case 1:
                        target.copy(arguments[0]);
                        up.copy(cc.Vec3.UP);
                        break;
                    case 2:
                        target.copy(arguments[0]);
                        up.copy(arguments[1]);
                        break;
                    case 3:
                        target.set(arguments[0], arguments[1], arguments[2]);
                        up.copy(cc.Vec3.UP);
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

        /**
         * @function
         * @name pc.GraphNode#translate
         * @description Translates the graph node in world space by the specified translation vector.
         * @param {Number} x x-component of the translation vector.
         * @param {Number} y y-component of the translation vector.
         * @param {Number} z z-component of the translation vector.
         * @example
         * this.entity.translate(10, 0, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#translate^2
         * @description Translates the graph node in world space by the specified translation vector.
         * @param {cc.Vec3} translation The world space translation vector to apply.
         * @example
         * var t = new cc.Vec3(10, 0, 0);
         * this.entity.translate(t);
         */
        translate: function () {
            var translation = new cc.Vec3();

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

        /**
         * @function
         * @name pc.GraphNode#translateLocal
         * @description Translates the graph node in local space by the specified translation vector.
         * @param {Number} x x-component of the translation vector.
         * @param {Number} y y-component of the translation vector.
         * @param {Number} z z-component of the translation vector.
         * @example
         * this.entity.translateLocal(10, 0, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#translateLocal^2
         * @description Translates the graph node in local space by the specified translation vector.
         * @param {cc.Vec3} translation The local space translation vector to apply.
         * @example
         * var t = new cc.Vec3(10, 0, 0);
         * this.entity.translateLocal(t);
         */
        translateLocal: function () {
            var translation = new cc.Vec3();

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

        /**
         * @function
         * @name pc.GraphNode#rotate
         * @description Rotates the graph node in world space by the specified Euler angles.
         * Eulers are specified in degrees in XYZ order.
         * @param {Number} ex Rotation around world space X axis in degrees.
         * @param {Number} ey Rotation around world space Y axis in degrees.
         * @param {Number} ez Rotation around world space Z axis in degrees.
         * @example
         * this.entity.rotate(0, 90, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#rotate^2
         * @description Rotates the graph node in world space by the specified Euler angles.
         * Eulers are specified in degrees in XYZ order.
         * @param {cc.Vec3} rot World space rotation (xyz) of graph node.
         * @example
         * var r = new cc.Vec3(0, 90, 0);
         * this.entity.rotate(r);
         */
        rotate: function () {
            var quaternion = new cc.Quat();
            var invParentRot = new cc.Quat();

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

        /**
         * @function
         * @name pc.GraphNode#rotateLocal
         * @description Rotates the graph node in local space by the specified Euler angles.
         * Eulers are specified in degrees in XYZ order.
         * @param {Number} ex Rotation around local space X axis in degrees.
         * @param {Number} ey Rotation around local space Y axis in degrees.
         * @param {Number} ez Rotation around local space Z axis in degrees.
         * @example
         * this.entity.rotateLocal(0, 90, 0);
         */
        /**
         * @function
         * @name pc.GraphNode#rotateLocal^2
         * @description Rotates the graph node in local space by the specified Euler angles.
         * Eulers are specified in degrees in XYZ order.
         * @param {cc.Vec3} rot Local space rotation (xyz) of graph node.
         * @example
         * var r = new cc.Vec3(0, 90, 0);
         * this.entity.rotateLocal(r);
         */
        rotateLocal: function () {
            var quaternion = new cc.Quat();

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

    return {
        GraphNode: GraphNode
    };
}());
