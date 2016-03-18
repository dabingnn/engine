
require('./CCGraphicEnums');

'use strict';

var Version = function () {
    // Set the variables
    this.globalId = 0;
    this.revision = 0;
};

Version.prototype = {
    equals: function (other) {
        return this.globalId === other.globalId &&
            this.revision === other.revision;
    },

    notequals: function (other) {
        return this.globalId !== other.globalId ||
            this.revision !== other.revision;
    },

    copy: function (other) {
        this.globalId = other.globalId;
        this.revision = other.revision;
    },

    reset: function () {
        this.globalId = 0;
        this.revision = 0;
    }
};

var idCounter = 0;

var VersionedObject = function () {
    // Increment the global object ID counter
    idCounter++;

    // Create a version for this object
    this.version = new Version();

    // Set the unique object ID
    this.version.globalId = idCounter;
};

VersionedObject.prototype = {
    increment: function () {
        // Increment the revision number
        this.version.revision++;
    }
};

var ScopeId = function (name) {
    // Set the name
    this.name = name;

    // Set the default value
    this.value = null;

    // Create the version object
    this.versionObject = new VersionedObject();
};

ScopeId.prototype = {
    setValue: function(value) {
        // Set the new value
        this.value = value;

        // Increment the revision
        this.versionObject.increment();
    },

    getValue: function(value) {
        return this.value;
    }
};

var ScopeSpace = function (name) {
    // Store the name
    this.name = name;

    // Create the empty tables
    this.variables = {};
    this.namespaces = {};
};

ScopeSpace.prototype = {
    resolve: function(name) {
        // Check if the ScopeId already exists
        if (this.variables.hasOwnProperty(name) === false) {

            // Create and add to the table
            this.variables[name] = new ScopeId(name);
        }

        // Now return the ScopeId instance
        return this.variables[name];
    },

    getSubSpace: function(name) {
        // Check if the nested namespace already exists
        if (this.namespaces.hasOwnProperty(name) === false) {

            // Create and add to the table
            this.namespaces[name] = new ScopeSpace(name);

            logDEBUG("Added ScopeSpace: " + name);
        }

        // Now return the ScopeNamespace instance
        return this.namespaces[name];
    }
};

cc3d.graphics.Version = Version;
cc3d.graphics.VersionedObject = VersionedObject;
cc3d.graphics.ScopeId = ScopeId;
cc3d.graphics.ScopeSpace = ScopeSpace;
