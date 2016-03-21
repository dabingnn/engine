require('./CCGraphicEnums');

'use strict';

var Texture = function (graphicsDevice, options) {
    this.device = graphicsDevice;

    // Defaults
    var width = 4;
    var height = 4;
    var format = cc3d.graphics.Enums.PIXELFORMAT_R8_G8_B8_A8;
    var cubemap = false;
    var autoMipmap = true;
    var rgbm = false;
    var fixCubemapSeams = false;

    if (options !== undefined) {
        width = (options.width !== undefined) ? options.width : width;
        height = (options.height !== undefined) ? options.height : height;
        format = (options.format !== undefined) ? options.format : format;
        cubemap = (options.cubemap !== undefined) ? options.cubemap : cubemap;
        autoMipmap = (options.autoMipmap !== undefined) ? options.autoMipmap : autoMipmap;
        rgbm = (options.rgbm !== undefined)? options.rgbm : rgbm;
        fixCubemapSeams = (options.fixCubemapSeams !== undefined)? options.fixCubemapSeams : fixCubemapSeams;
    }

    // PUBLIC
    this.name = null;
    this.autoMipmap = autoMipmap;
    this.rgbm = rgbm;
    this.fixCubemapSeams = fixCubemapSeams;

    // PRIVATE
    this._cubemap = cubemap;
    this._format = format;
    this._compressed = (format === cc3d.graphics.Enums.PIXELFORMAT_DXT1 ||
    format === cc3d.graphics.Enums.PIXELFORMAT_DXT3 ||
    format === cc3d.graphics.Enums.PIXELFORMAT_DXT5 ||
    format >= cc3d.graphics.Enums.PIXELFORMAT_ETC1);

    // Set the new texture to be 4x4 (minimum supported texture size)
    this._width = width || 4;
    this._height = height || 4;

    this._addressU = cc3d.graphics.Enums.ADDRESS_REPEAT;
    this._addressV = cc3d.graphics.Enums.ADDRESS_REPEAT;

    if (cc3d.math.powerOfTwo(this._width) && cc3d.math.powerOfTwo(this._height)) {
        this._minFilter = cc3d.graphics.Enums.FILTER_LINEAR_MIPMAP_LINEAR;
    } else {
        this._minFilter = cc3d.graphics.Enums.FILTER_LINEAR;
    }
    this._magFilter = cc3d.graphics.Enums.FILTER_LINEAR;
    this._anisotropy = 1;

    // Mip levels
    this._invalid = false;
    this._levels = cubemap ? [[ null, null, null, null, null, null ]] : [ null ];
    this._levelsUpdated = cubemap ? [[ true, true, true, true, true, true ]] : [ true ];
    this._lockedLevel = -1;

    this._needsUpload = true;

    this._minFilterDirty = true;
    this._magFilterDirty = true;
    this._addressUDirty = true;
    this._addressVDirty = true;
    this._anisotropyDirty = true;

    this._gpuSize = 0;
};

Object.defineProperty(Texture.prototype, 'minFilter', {
    get: function () { return this._minFilter; },
    set: function (minFilter) {
        if (!(cc3d.math.powerOfTwo(this._width) && cc3d.math.powerOfTwo(this._height))) {
            if (!((minFilter === cc3d.graphics.Enums.FILTER_NEAREST) || (minFilter === cc3d.graphics.Enums.FILTER_LINEAR)))  {
                console.log("Invalid minification filter mode set on non power of two texture. Forcing linear addressing.");
                minFilter = cc3d.graphics.Enums.FILTER_LINEAR;
            }
        }
        if (minFilter !== this._minFilter) {
            this._minFilter = minFilter;
            this._minFilterDirty = true;
        }
    }
});

Object.defineProperty(Texture.prototype, 'magFilter', {
    get: function() { return this._magFilter; },
    set: function(magFilter) {
        if (!((magFilter === cc3d.graphics.Enums.FILTER_NEAREST) || (magFilter === cc3d.graphics.Enums.FILTER_LINEAR)))  {
            console.log("Invalid magnification filter mode. Must be set to FILTER_NEAREST or FILTER_LINEAR.");
        }
        if (magFilter !== this._magFilter) {
            this._magFilter = magFilter;
            this._magFilterDirty = true;
        }
    }
});

Object.defineProperty(Texture.prototype, 'addressU', {
    get: function() { return this._addressU; },
    set: function(addressU) {
        if (!(cc3d.math.powerOfTwo(this._width) && cc3d.math.powerOfTwo(this._height))) {
            if (addressU !== cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE) {
                console.log("Invalid address mode in U set on non power of two texture. Forcing clamp to edge addressing.");
                addressU = cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE;
            }
        }
        if (addressU !== this._addressU) {
            this._addressU = addressU;
            this._addressUDirty = true;
        }
    }
});

Object.defineProperty(Texture.prototype, 'addressV', {
    get: function() { return this._addressV; },
    set: function(addressV) {
        if (!(cc3d.math.powerOfTwo(this._width) && cc3d.math.powerOfTwo(this._height))) {
            if (addressV !== cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE) {
                console.log("Invalid address mode in V set on non power of two texture. Forcing clamp to edge addressing.");
                addressV = cc3d.graphics.Enums.ADDRESS_CLAMP_TO_EDGE;
            }
        }
        if (addressV !== this._addressV) {
            this._addressV = addressV;
            this._addressVDirty = true;
        }
    }
});

Object.defineProperty(Texture.prototype, 'anisotropy', {
    get: function () { return this._anisotropy; },
    set: function (anisotropy) {
        anisotropy = cc3d.math.clamp(anisotropy, 1, this.device.maxAnisotropy);
        if (anisotropy !== this._anisotropy) {
            this._anisotropy = anisotropy;
            this._anisotropyDirty = true;
        }
    }
});

Object.defineProperty(Texture.prototype, 'width', {
    get: function() { return this._width; }
});

Object.defineProperty(Texture.prototype, 'height', {
    get: function() { return this._height; }
});

Object.defineProperty(Texture.prototype, 'format', {
    get: function() { return this._format; }
});

Object.defineProperty(Texture.prototype, 'cubemap', {
    get: function() { return this._cubemap; }
});

Texture.prototype.bind = function () {
};

Texture.prototype.destroy = function () {
    if (this._glTextureId) {
        var gl = this.device.gl;
        gl.deleteTexture(this._glTextureId);
        //this.device._vram.tex -= this._gpuSize;
    }
};

Texture.prototype.lock =   function (options) {
    // Initialize options to some sensible defaults
    options = options || { level: 0, face: 0, mode: pc.TEXTURELOCK_WRITE };
    if (options.level === undefined) { options.level = 0; }
    if (options.face === undefined) { options.face = 0; }
    if (options.mode === undefined) { options.mode = pc.TEXTURELOCK_WRITE; }

    this._lockedLevel = options.level;
    var cc3dEnums = cc3d.graphics.Enums;
    if (this._levels[options.level] === null) {
        switch(this._format) {
            case cc3dEnums.PIXELFORMAT_A8:
            case cc3dEnums.PIXELFORMAT_L8:
                this._levels[options.level] = new Uint8Array(this._width * this._height);
                break;
            case cc3dEnums.PIXELFORMAT_L8_A8:
                this._levels[options.level] = new Uint8Array(this._width * this._height * 2);
                break;
            case cc3dEnums.PIXELFORMAT_R5_G6_B5:
            case cc3dEnums.PIXELFORMAT_R5_G5_B5_A1:
            case cc3dEnums.PIXELFORMAT_R4_G4_B4_A4:
                this._levels[options.level] = new Uint16Array(this._width * this._height);
                break;
            case cc3dEnums.PIXELFORMAT_R8_G8_B8:
                this._levels[options.level] = new Uint8Array(this._width * this._height * 3);
                break;
            case cc3dEnums.PIXELFORMAT_R8_G8_B8_A8:
                this._levels[options.level] = new Uint8Array(this._width * this._height * 4);
                break;
            case cc3dEnums.PIXELFORMAT_DXT1:
                this._levels[options.level] = new Uint8Array(Math.floor((this._width + 3) / 4) * Math.floor((this._height + 3) / 4) * 8);
                break;
            case cc3dEnums.PIXELFORMAT_DXT3:
            case cc3dEnums.PIXELFORMAT_DXT5:
                this._levels[options.level] = new Uint8Array(Math.floor((this._width + 3) / 4) * Math.floor((this._height + 3) / 4) * 16);
                break;
            case cc3dEnums.PIXELFORMAT_RGB16F:
            case cc3dEnums.PIXELFORMAT_RGB32F:
                this._levels[options.level] = new Float32Array(this._width * this._height * 3);
                break;
            case cc3dEnums.PIXELFORMAT_RGBA16F:
            case cc3dEnums.PIXELFORMAT_RGBA32F:
                this._levels[options.level] = new Float32Array(this._width * this._height * 4);
                break;
        }
    }

    return this._levels[options.level];
};

Texture.prototype.recover = function () {
};

Texture.prototype.setSource = function (source) {
    var i;
    var invalid = false;
    var width, height;

    if (this._cubemap) {
        // rely on first face sizes
        width = source[0] && source[0].width || 0;
        height = source[0] && source[0].height || 0;

        if (source[0]) {
            for (i = 0; i < 6; i++) {
                // cubemap becomes invalid if any condition is not satisfied
                if (! source[i] || // face is missing
                    source[i].width !== width || // face is different width
                    source[i].height !== height || // face is different height
                    (! (source[i] instanceof HTMLImageElement) && // not image and
                    ! (source[i] instanceof HTMLCanvasElement) && // not canvas and
                    ! (source[i] instanceof HTMLVideoElement))) { // not video

                    invalid = true;
                }
            }
        } else {
            // first face is missing
            invalid = true;
        }

        for (i = 0; i < 6; i++) {
            if (invalid || this._levels[0][i] !== source[i])
                this._levelsUpdated[0][i] = true;
        }
    } else {
        // cehck if source is valid type of element
        if (! (source instanceof HTMLImageElement) && ! (source instanceof HTMLCanvasElement) && ! (source instanceof HTMLVideoElement))
            invalid = true;

        // mark level as updated
        if (invalid || source !== this._levels[0])
            this._levelsUpdated[0] = true;

        width = source.width;
        height = source.height;
    }

    if (invalid) {
        // invalid texture

        // default sizes
        this._width = 4;
        this._height = 4;

        // remove levels
        if (this._cubemap) {
            for(i = 0; i < 6; i++) {
                this._levels[0][i] = null;
                this._levelsUpdated[0][i] = true;
            }
        } else {
            this._levels[0] = null;
            this._levelsUpdated[0] = true;
        }
    } else {
        // valid texture
        this._width = width;
        this._height = height;
        this._levels[0] = source;
    }

    // valid or changed state of validity
    if (this._invalid !== invalid || ! invalid) {
        this._invalid = invalid;

        // reupload
        this.upload();
        // Reset filter and address modes because width/height may have changed
        this.minFilter = this._minFilter;
        this.magFilter = this._magFilter;
        this.addressU = this._addressU;
        this.addressV = this._addressV;
    }
};

Texture.prototype.getSource = function () {
    return this._levels[0];
};

Texture.prototype.unlock = function () {
    //logASSERT(this._lockedLevel !== -1, "Attempting to unlock a texture that is not locked");

    // Upload the new pixel data
    this.upload();
    this._lockedLevel = -1;
};

Texture.prototype.upload = function () {
    this._needsUpload = true;
};

Texture.prototype.getDds = function () {
    if (this.format !== pc.PIXELFORMAT_R8_G8_B8_A8)
        console.error("This format is not implemented yet");

    var fsize = 128;
    var i = 0;
    var j;
    var face;
    while(this._levels[i]) {
        var mipSize;
        if (!this.cubemap) {
            mipSize = this._levels[i].length;
            if (!mipSize) {
                console.error("No byte array for mip " + i);
                return;
            }
            fsize += mipSize;
        } else {
            for(face=0; face<6; face++) {
                if (! this._levels[i][face]) {
                    console.error('No level data for mip ' + i + ', face ' + face);
                    return;
                }
                mipSize = this._levels[i][face].length;
                if (!mipSize) {
                    console.error("No byte array for mip " + i + ", face " + face);
                    return;
                }
                fsize += mipSize;
            }
        }
        fsize += this._levels[i].length;
        i++;
    }

    var buff = new ArrayBuffer(fsize);
    var header = new Uint32Array(buff, 0, 128 / 4);

    var DDS_MAGIC = 542327876; // "DDS"
    var DDS_HEADER_SIZE = 124;
    var DDS_FLAGS_REQUIRED = 0x01 | 0x02 | 0x04 | 0x1000 | 0x80000; // caps | height | width | pixelformat | linearsize
    var DDS_FLAGS_MIPMAP = 0x20000;
    var DDS_PIXELFORMAT_SIZE = 32;
    var DDS_PIXELFLAGS_RGBA8 = 0x01 | 0x40; // alpha | rgb
    var DDS_CAPS_REQUIRED = 0x1000;
    var DDS_CAPS_MIPMAP = 0x400000;
    var DDS_CAPS_COMPLEX = 0x8;
    var DDS_CAPS2_CUBEMAP = 0x200 | 0x400 | 0x800 | 0x1000 | 0x2000 | 0x4000 | 0x8000; // cubemap | all faces

    var flags = DDS_FLAGS_REQUIRED;
    if (this._levels.length > 1) flags |= DDS_FLAGS_MIPMAP;

    var caps = DDS_CAPS_REQUIRED;
    if (this._levels.length > 1) caps |= DDS_CAPS_MIPMAP;
    if (this._levels.length > 1 || this.cubemap) caps |= DDS_CAPS_COMPLEX;

    var caps2 = this.cubemap? DDS_CAPS2_CUBEMAP : 0;

    header[0] = DDS_MAGIC;
    header[1] = DDS_HEADER_SIZE;
    header[2] = flags;
    header[3] = this.height;
    header[4] = this.width;
    header[5] = this.width * this.height * 4;
    header[6] = 0; // depth
    header[7] = this._levels.length;
    for(i=0; i<11; i++) header[8 + i] = 0;
    header[19] = DDS_PIXELFORMAT_SIZE;
    header[20] = DDS_PIXELFLAGS_RGBA8;
    header[21] = 0; // fourcc
    header[22] = 32; // bpp
    header[23] = 0x00FF0000; // R mask
    header[24] = 0x0000FF00; // G mask
    header[25] = 0x000000FF; // B mask
    header[26] = 0xFF000000; // A mask
    header[27] = caps;
    header[28] = caps2;
    header[29] = 0;
    header[30] = 0;
    header[31] = 0;

    var offset = 128;
    var level, mip;
    if (!this.cubemap) {
        for (i=0; i<this._levels.length; i++) {
            level = this._levels[i];
            mip = new Uint8Array(buff, offset, level.length);
            for(j=0; j<level.length; j++) mip[j] = level[j];
            offset += level.length;
        }
    } else {
        for (face=0; face<6; face++) {
            for (i=0; i<this._levels.length; i++) {
                level = this._levels[i][face];
                mip = new Uint8Array(buff, offset, level.length);
                for(j=0; j<level.length; j++) mip[j] = level[j];
                offset += level.length;
            }
        }
    }

    return buff;
};

cc3d.graphics.Texture = Texture;
