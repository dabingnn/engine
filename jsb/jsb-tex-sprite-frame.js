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

'use strict';

require('../cocos2d/core/platform/CCClass');
require('../cocos2d/core/assets/CCAsset');

// cc.spriteFrameAnimationCache = cc.animationCache;
// cc.SpriteFrameAnimation = cc.Animation;

// cc.textureCache.cacheImage
cc.textureCache._textures = {};
cc.textureCache.cacheImage = function (key, texture) {
    if (texture instanceof cc.Texture2D) {
        this._textures[key] = texture;
    }
};
cc.textureCache._getTextureForKey = cc.textureCache.getTextureForKey;
cc.textureCache.getTextureForKey = function (key) {
    var tex = this._getTextureForKey(key);
    if (!tex)
        tex = this._textures[key];
    return tex || null;
};

// cc.Texture2D

cc.Class._fastDefine('cc.Texture2D', cc.Texture2D, []);
cc.Texture2D.$super = cc.RawAsset;

cc.Texture2D.prototype.isLoaded = function () {
    return true;
};
cc.Texture2D.prototype.getPixelWidth = cc.Texture2D.prototype.getPixelsWide;
cc.Texture2D.prototype.getPixelHeight = cc.Texture2D.prototype.getPixelsHigh;

// cc.SpriteFrame

cc.Class._fastDefine('cc.SpriteFrame', cc.SpriteFrame, []);
cc.SpriteFrame.$super = cc.Asset;

cc.js.mixin(cc.SpriteFrame.prototype, cc.EventTarget.prototype);
cc.SpriteFrame.prototype.textureLoaded = function () {
    return this.getTexture() !== null;
};

// cc.SpriteFrame
cc.SpriteFrame.prototype._ctor = function (filename, rect, rotated, offset, originalSize) {
    if (filename !== undefined) {
        this.initWithTexture(filename, rect, rotated, offset, originalSize);
    } else {
        //todo log Error
    }
};

cc.SpriteFrame.prototype._initWithTexture = cc.SpriteFrame.prototype.initWithTexture;
cc.SpriteFrame.prototype.initWithTexture = function (texture, rect, rotated, offset, originalSize) {
    this.setTexture(texture, rect, rotated, offset, originalSize);
};

cc.SpriteFrame.prototype.setTexture = function (textureOrTextureFile, rect, rotated, offset, originalSize) {

    if (rect) {
        this.setRect(rect);
    }

    if (offset) {
        this.setOffset(offset);
    }

    if (originalSize) {
        this.setOriginalSize(originalSize);
    }

    this.setRotated(rotated || false);

    var texture = textureOrTextureFile;
    if (cc.js.isString(textureOrTextureFile)) {
        this._textureFilename = textureOrTextureFile;
        texture = cc.textureCache.addImage(textureOrTextureFile);
    }

    if (texture instanceof cc.Texture2D) {
        this._refreshTexture(texture);
    }
    else {
        //todo log error
    }

    return true;
};

cc.SpriteFrame.prototype._refreshTexture = function (texture) {

    if (this.getTexture() !== texture) {

        var w = texture.width, h = texture.height;

        var rect = this.getRect();
        if (rect.width === 0 || rect.height === 0) {
            rect = cc.rect(0, 0, w, h);
        }
        else {
            this._checkRect(texture);
        }

        var originalSize = this.getOriginalSize();
        if (originalSize.width === 0 || originalSize.height === 0) {
            originalSize = cc.size(w, h);
        }

        var offset = this.getOffset();
        var rotated = this.isRotated();

        if (this.insetTop === undefined) {
            this.insetTop = 0;
            this.insetBottom = 0;
            this.insetLeft = 0;
            this.insetRight = 0;
        }

        this._initWithTexture(texture, rect, rotated, offset, originalSize);

        //dispatch 'load' event of cc.SpriteFrame
        this.emit("load");
    }
};

cc.SpriteFrame.prototype._deserialize = function (data, handle) {
    var rect = data.rect;
    if (rect) {
        this.setRect(new cc.Rect(rect[0], rect[1], rect[2], rect[3]));
    }
    if (data.offset) {
        this.setOffset(new cc.Vec2(data.offset[0], data.offset[1]));
    }
    if (data.originalSize) {
        this.setOriginalSize(new cc.Size(data.originalSize[0], data.originalSize[1]));
    }

    this.setRotated(data.rotated === 1);

    this._name = data.name;
    var capInsets = data.capInsets;
    if (capInsets) {
        this.insetLeft = capInsets[0];
        this.insetTop = capInsets[1];
        this.insetRight = capInsets[2];
        this.insetBottom = capInsets[3];
    }

    // load texture via _textureFilenameSetter
    var textureUuid = data.texture;
    if (textureUuid) {
        handle.result.push(this, '_textureFilenameSetter', textureUuid);
    }
};
cc.SpriteFrame.prototype._checkRect = function (texture) {
    var rect = this.getRect();
    var maxX = rect.x, maxY = rect.y;
    if (this.isRotated()) {
        maxX += rect.height;
        maxY += rect.width;
    }
    else {
        maxX += rect.width;
        maxY += rect.height;
    }
    if (maxX > texture.getPixelWidth()) {
        cc.error(cc._LogInfos.RectWidth, texture.url);
    }
    if (maxY > texture.getPixelHeight()) {
        cc.error(cc._LogInfos.RectHeight, texture.url);
    }
};
cc.SpriteFrame.prototype._getTexture = cc.SpriteFrame.prototype.getTexture;
cc.SpriteFrame.prototype.getTexture = function () {
    var tex = this._getTexture();
    this._texture = tex;
    return tex;
};
cc.js.set(cc.SpriteFrame.prototype, '_textureFilenameSetter', function (url) {
    this._textureFilename = url;
    if (url) {
        var texture = cc.textureCache.addImage(url);
        this._refreshTexture(texture);
    }
});
