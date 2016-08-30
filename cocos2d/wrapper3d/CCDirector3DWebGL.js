/****************************************************************************
 Copyright (c) 2008-2010 Ricardo Quesada
 Copyright (c) 2011-2012 cocos2d-x.org
 Copyright (c) 2013-2014 Chukong Technologies Inc.

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

var Director3D = require('./CCDirector3D');
require('./CCGame3D');
require('../kazmath');

var math = cc.math;

cc.game3D.once(cc.game3D.EVENT_RENDERER_INITED, function () {

    // Do nothing under other render mode
    if (cc._renderType !== cc.game3D.RENDER_TYPE_WEBGL) {
        return;
    }

    /**
     * OpenGL projection protocol
     * @class
     * @extends cc._Class
     */
    cc.DirectorDelegate = cc._Class.extend(/** @lends cc.DirectorDelegate# */{
        /**
         * Called by CCDirector when the projection is updated, and "custom" projection is used
         */
        updateProjection: function () {
        }
    });

    var _p = Director3D.prototype;

    var recursiveChild = function(node){
        //if(node && node._renderCmd){
        //    node._renderCmd.setDirtyFlag(_ccsg.Node._dirtyFlags.transformDirty);
        //    var i, children = node._children;
        //    for(i=0; i<children.length; i++){
        //        recursiveChild(children[i]);
        //    }
        //}
    };

    Director3D._getInstance().on(Director3D.EVENT_PROJECTION_CHANGED, function(){
        //var director = cc.director;
        //var stack = cc.director._scenesStack;
        //for(var  i=0; i<stack.length; i++)
        //    recursiveChild(stack[i]);
    });

    _p.setProjection = function (projection) {
        //do nothing here in 3D
    };

    _p.setDepthTest = function (on) {
        //cc.renderer.setDepthTest(on);
    };

    _p.setClearColor = function (clearColor) {
        //var locClearColor = cc.renderer._clearColor;
        //locClearColor.r = clearColor.r / 255;
        //locClearColor.g = clearColor.g / 255;
        //locClearColor.b = clearColor.b / 255;
        //locClearColor.a = clearColor.a / 255;
    };

    _p.setOpenGLView = function (openGLView) {
        //var _t = this;
        //// set size
        //_t._winSizeInPoints.width = cc._canvas.width;      //_t._openGLView.getDesignResolutionSize();
        //_t._winSizeInPoints.height = cc._canvas.height;
        //_t._openGLView = openGLView || cc.view;
        //
        //// Configuration. Gather GPU info
        //var conf = cc.configuration;
        //conf.gatherGPUInfo();
        //
        //// set size
        ////_t._winSizeInPoints = _t._openGLView.getDesignResolutionSize();
        ////_t._winSizeInPixels = cc.size(_t._winSizeInPoints.width * _t._contentScaleFactor, _t._winSizeInPoints.height * _t._contentScaleFactor);
        //
        ////if (_t._openGLView != openGLView) {
        //// because EAGLView is not kind of CCObject
        //
        ////if (_t._openGLView)
        //_t.setGLDefaultValues();

        /* if (_t._contentScaleFactor != 1) {
         _t.updateContentScaleFactor();
         }*/

        //}
        if (cc.eventManager)
            cc.eventManager.setEnabled(true);
    };

    _p._clear = function () {
        //var gl = cc._renderContext;
        //gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    };

    _p.getVisibleSize = function () {
        //if (this._openGLView) {
        //return this._openGLView.getVisibleSize();
        //} else {
        //return this.getWinSize();
        //}
    };

    _p.getVisibleOrigin = function () {
        //if (this._openGLView) {
        //return this._openGLView.getVisibleOrigin();
        //} else {
        //return cc.p(0,0);
        //}
    };

    _p.getZEye = function () {
        //return (this._winSizeInPoints.height / 1.1566 );
    };

    _p.setViewport = function () {
        //var view = this._openGLView;
        //if (view) {
        //    var locWinSizeInPoints = this._winSizeInPoints;
        //    view.setViewPortInPoints(-view._viewPortRect.x/view._scaleX, -view._viewPortRect.y/view._scaleY, locWinSizeInPoints.width, locWinSizeInPoints.height);
        //}
    };

    _p.getOpenGLView = function () {
        //return this._openGLView;
    };

    _p.getProjection = function () {
        //nothing to return in 3D
    };

    _p.setAlphaBlending = function (on) {
        //if (on)
        //    cc.gl.blendFunc(cc.macro.BLEND_SRC, cc.macro.BLEND_DST);
        //else
        //    cc.gl.blendFunc(cc.macro.ONE, cc.macro.ZERO);
        ////cc.checkGLErrorDebug();
    };

    _p.setGLDefaultValues = function () {
        //var _t = this;
        //_t.setAlphaBlending(true);
        //_t.setProjection(_t._projection);
        //
        //// set other opengl default values
        //cc._renderContext.clearColor(0.0, 0.0, 0.0, 0.0);
    };
});
