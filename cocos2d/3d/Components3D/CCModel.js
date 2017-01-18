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

var Component = require('../../core/components/CCComponent');
var defaultMaterial = new cc3d.StandardMaterial();
defaultMaterial.diffuse = new cc.ColorF(1.0,1,1);
defaultMaterial.update();

var ModelType = cc.Enum({
    Asset: 0,
    Box: 1,
    Sphere: 2,
    Cylinder: 3
});

var ModelComponent = cc.Class({
    name: 'cc.ModelComponent',
    extends: Component,

    editor: CC_EDITOR && {
        executeInEditMode: true,
        menu: 'i18n:MAIN_MENU.component.renderers/ModelComponent',
    },

    properties: {
    },

    ctor: function () {
        this._model = null;
    },
    onEnable: function() {
        var scene = cc.director.getScene();
        this._model && scene._sgScene.addModel(this._model);
    },
    onDisable: function() {
        var scene = cc.director.getScene();
        this._model && scene._sgScene.removeModel(this._model);
    },

    setModel: function(model) {
        var scene = cc.director.getScene();
        this._model && scene._sgScene.removeModel(this._model);
        this._model = model;
        this._model && scene._sgScene.addModel(this._model);
    },

    onDestroy: function() {

    },
    onFocusInEditor: function() {

    },
    onLostFocusInEditor: function() {

    },

});

cc.ModelComponent = module.exports = ModelComponent;
