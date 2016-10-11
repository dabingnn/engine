var EventTarget = require('../../core/event/event-target');

var Material = cc.Class(/** @lends cc.Material# */{
    name: 'cc.Material',
    extends: require('../../core/assets/CCAsset'),
    mixins: [EventTarget],
    properties: {
        _diffuseTextureSetter: {
            set: function (url) {
                this._diffuseTextureFile = url;
                if (url) {
                    if (CC_EDITOR && url instanceof cc.Asset) {
                        // just packing
                        return;
                    }
                    this._loadTexture();
                }
            }
        }
    },
    ctor: function() {
        this._diffuseColor = cc.color(255,255,255);
        this._diffuseTexture = null;
        this._diffuseTextureFile = '';
        this._loaded = false;
    },
    _serialize: CC_EDITOR && function (exporting) {
        var difUrl = this._diffuseTextureFile;
        if (difUrl) {
            if (difUrl instanceof cc.Asset) {
                difUrl = difUrl._uuid;
            }
            else {
                difUrl = Editor.UuidCache.urlToUuid(difUrl);
            }
        }

        return {
            name: this._name,
            diffuseColor:[this._diffuseColor.r,this._diffuseColor.g,this._diffuseColor.b, this._diffuseColor.a],
            diffuseTexture : difUrl || undefined
        }
    },
    _deserialize: function (data, handle) {

        this._name = data.name;
        this._diffuseColor.r = data.diffuseColor[0];
        this._diffuseColor.g = data.diffuseColor[1];
        this._diffuseColor.b = data.diffuseColor[2];
        this._diffuseColor.a = data.diffuseColor[3];

        var textureUuid = data.diffuseTexture;
        if (textureUuid) {
            var dontLoadTexture = (handle.customEnv && handle.customEnv.deferredLoadRaw);
            var receiver = dontLoadTexture ? '_diffuseTextureFile' : '_diffuseTextureSetter';
            handle.result.push(this, receiver, textureUuid);
        }
    },
    _loadTexture: function() {
        var self = this;
        if (this._diffuseTextureFile) {
            var texture = cc.textureCache.addImage(this._diffuseTextureFile);
            if (this._diffuseTexture !== texture) {
                var locLoaded = texture.isLoaded();
                this._diffuseTexture = texture;
                function textureLoadedCallback () {
                    self._loaded = true;
                    self.emit("load");
                }
                if (locLoaded) {
                    textureLoadedCallback();
                }
                else {
                    texture.once("load", textureLoadedCallback);
                }
            }
        }
    },
    getRenderedMtl: function() {
        var mtl = new pc.StandardMaterial();
        var diffuse = this._diffuseColor;
        mtl.diffuse = new pc.Color(diffuse.r/255,diffuse.g/255,diffuse.b/255);
        mtl.diffuseMap = this._diffuseTexture._internalTexture;
        mtl.update();
        return mtl;
    },
});

cc.Material = module.exports = Material;
