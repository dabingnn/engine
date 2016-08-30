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

var EventTarget = require('../core/event/event-target');
var Class = require('../core/platform/_CCClass');
var AutoReleaseUtils = require('../core/load-pipeline/auto-release-utils');

cc.g_NumberOfDraws = 0;

//----------------------------------------------------------------------------------------------------------------------

/**
 * !#en
 * <p>
 *    ATTENTION: USE cc.director INSTEAD OF Director3D.<br/>
 *    cc.director is a singleton object which manage your game's logic flow.<br/>
 *    Since the cc.director is a singleton, you don't need to call any constructor or create functions,<br/>
 *    the standard way to use it is by calling:<br/>
 *      - cc.director.methodName(); <br/>
 *
 *    It creates and handle the main Window and manages how and when to execute the Scenes.<br/>
 *    <br/>
 *    The cc.director is also responsible for:<br/>
 *      - initializing the OpenGL context<br/>
 *      - setting the OpenGL pixel format (default on is RGB565)<br/>
 *      - setting the OpenGL buffer depth (default on is 0-bit)<br/>
 *      - setting the color for clear screen (default one is BLACK)<br/>
 *      - setting the projection (default one is 3D)<br/>
 *      - setting the orientation (default one is Portrait)<br/>
 *      <br/>
 *    <br/>
 *    The cc.director also sets the default OpenGL context:<br/>
 *      - GL_TEXTURE_2D is enabled<br/>
 *      - GL_VERTEX_ARRAY is enabled<br/>
 *      - GL_COLOR_ARRAY is enabled<br/>
 *      - GL_TEXTURE_COORD_ARRAY is enabled<br/>
 * </p>
 * <p>
 *   cc.director also synchronizes timers with the refresh rate of the display.<br/>
 *   Features and Limitations:<br/>
 *      - Scheduled timers & drawing are synchronizes with the refresh rate of the display<br/>
 *      - Only supports animation intervals of 1/60 1/30 & 1/15<br/>
 * </p>
 *
 * !#zh
 * <p>
 *     注意：用 cc.director 代替 Director3D。<br/>
 *     cc.director 一个管理你的游戏的逻辑流程的单例对象。<br/>
 *     由于 cc.director 是一个单例，你不需要调用任何构造函数或创建函数，<br/>
 *     使用它的标准方法是通过调用：<br/>
 *       - cc.director.methodName();
 *     <br/>
 *     它创建和处理主窗口并且管理什么时候执行场景。<br/>
 *     <br/>
 *     cc.director 还负责：<br/>
 *      - 初始化 OpenGL 环境。<br/>
 *      - 设置OpenGL像素格式。(默认是 RGB565)<br/>
 *      - 设置OpenGL缓冲区深度 (默认是 0-bit)<br/>
 *      - 设置空白场景的颜色 (默认是 黑色)<br/>
 *      - 设置投影 (默认是 3D)<br/>
 *      - 设置方向 (默认是 Portrait)<br/>
 *    <br/>
 *    cc.director 设置了 OpenGL 默认环境 <br/>
 *      - GL_TEXTURE_2D   启用。<br/>
 *      - GL_VERTEX_ARRAY 启用。<br/>
 *      - GL_COLOR_ARRAY  启用。<br/>
 *      - GL_TEXTURE_COORD_ARRAY 启用。<br/>
 * </p>
 * <p>
 *   cc.director 也同步定时器与显示器的刷新速率。
 *   <br/>
 *   特点和局限性: <br/>
 *      - 将计时器 & 渲染与显示器的刷新频率同步。<br/>
 *      - 只支持动画的间隔 1/60 1/30 & 1/15。<br/>
 * </p>
 *
 * @class Director
 */
var Director3D = Class.extend(/** @lends Director3D# */{
    //Variables
    _landscape: false,
    _nextDeltaTimeZero: false,
    _paused: false,
    _purgeDirectorInNextLoop: false,
    _sendCleanupToScene: false,
    _animationInterval: 0.0,
    _oldAnimationInterval: 0.0,
    _contentScaleFactor: 1.0,

    _deltaTime: 0.0,

    _winSizeInPoints: null,

    _lastUpdate: null,
    _nextScene: null,
    _notificationNode: null,
    _openGLView: null,
    _scenesStack: null,

    _loadingScene: '',
    _runningScene: null,    // The root of rendering scene graph

    // The entity-component scene
    _scene: null,

    _totalFrames: 0,
    _secondsPerFrame: 0,

    _scheduler: null,
    _actionManager: null,

    ctor: function () {
        var self = this;

        EventTarget.call(self);
        self._lastUpdate = Date.now();
        cc.game3D.on(cc.game3D.EVENT_SHOW, function () {
            self._lastUpdate = Date.now();
        });
    },

    //todo: this is just a hack test for 3d
    _init3D: function() {
        //this._3dRootNode = new pc.GraphNode();
        //this._3dScene = new pc.Scene();
        //var node = new pc.GraphNode();
        //var camera = new pc.Camera();
        //camera._node = node;
        //this._3dScene.addCamera(camera);
        //this._3dRootNode.addChild(node);

    },

    init: function () {
        // scenes
        this._oldAnimationInterval = this._animationInterval = 1.0 / cc.defaultFPS;
        this._scenesStack = [];

        // FPS
        this._totalFrames = 0;
        this._lastUpdate = Date.now();

        //Paused?
        this._paused = false;

        //purge?
        this._purgeDirectorInNextLoop = false;

        this._winSizeInPoints = cc.size(0, 0);

        this._openGLView = null;
        this._contentScaleFactor = 1.0;

        // Scheduler for user registration update
        this._scheduler = new cc.Scheduler();

        // Action manager
        if(cc.ActionManager){
            this._actionManager = new cc.ActionManager();
            this._scheduler.scheduleUpdate(this._actionManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        }else{
            this._actionManager = null;
        }

        this._init3D();

        this.sharedInit();

        return true;
    },

    /**
     * Manage all init process shared between the web engine and jsb engine.
     * All platform independent init process should be occupied here.
     */
    sharedInit: function () {
        // Animation manager
        if (cc.AnimationManager) {
            this._animationManager = new cc.AnimationManager();
            this._scheduler.scheduleUpdate(this._animationManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        }
        else {
            this._animationManager = null;
        }

        // collision manager
        if (cc.CollisionManager) {
            this._collisionManager = new cc.CollisionManager();
            this._scheduler.scheduleUpdate(this._collisionManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        }
        else {
            this._collisionManager = null;
        }

        // WidgetManager
        if (cc._widgetManager) {
            cc._widgetManager.init(this);
        }
    },

    /**
     * calculates delta time since last time it was called
     */
    calculateDeltaTime: function () {
        //var now = Date.now();
        //
        //if (this._nextDeltaTimeZero) {
        //    this._deltaTime = 0;
        //    this._nextDeltaTimeZero = false;
        //} else {
        //    this._deltaTime = (now - this._lastUpdate) / 1000;
        //    if ((cc.game3D.config[cc.game3D.CONFIG_KEY.debugMode] > 0) && (this._deltaTime > 1))
        //        this._deltaTime = 1 / 60.0;
        //}
        //
        //this._lastUpdate = now;
    },

    /*
     * !#en
     * Converts a view coordinate to an WebGL coordinate<br/>
     * Useful to convert (multi) touches coordinates to the current layout (portrait or landscape)<br/>
     * Implementation can be found in CCDirectorWebGL.
     * !#zh 将触摸点的屏幕坐标转换为 WebGL View 下的坐标。
     * @method convertToGL
     * @param {Vec2} uiPoint
     * @return {Vec2}
     */
    convertToGL: null,

    /**
     * !#en
     * Converts an OpenGL coordinate to a view coordinate<br/>
     * Useful to convert node points to window points for calls such as glScissor<br/>
     * Implementation can be found in CCDirectorWebGL.
     * !#zh 将触摸点的 WebGL View 坐标转换为屏幕坐标。
     * @method convertToUI
     * @param {Vec2} glPoint
     * @return {Vec2}
     */
    convertToUI: null,

    engineUpdate: function (deltaTime) {
        //tick before glClear: issue #533
        //this._scheduler.update(deltaTime);
    },

    _visitScene: function () {
        //do not need to do anything for visit scene in 3d
    },

    visit: function (deltaTime) {
        this.emit(Director3D.EVENT_BEFORE_VISIT, this);

        if (this._beforeVisitScene)
            this._beforeVisitScene();

        // update the scene
        this._visitScene();

        // visit the notifications node
        if (this._notificationNode)
            this._notificationNode.visit();

        this.emit(Director3D.EVENT_AFTER_VISIT, this);

        if (this._afterVisitScene)
            this._afterVisitScene();
    },

    _beforeVisitScene: null,
    _afterVisitScene: null,

    /**
     * End the life of director in the next frame
     */
    end: function () {
        //this._purgeDirectorInNextLoop = true;
    },

    /*
     * !#en
     * Returns the size in pixels of the surface. It could be different than the screen size.<br/>
     * High-res devices might have a higher surface size than the screen size.
     * !#zh 获取内容缩放比例。
     * @method getContentScaleFactor
     * @return {Number}
     */
    getContentScaleFactor: function () {
        //return this._contentScaleFactor;
    },

    /*
     * !#en
     * This object will be visited after the main scene is visited.<br/>
     * This object MUST implement the "visit" selector.<br/>
     * Useful to hook a notification object.
     * !#zh
     * 这个对象将会在主场景渲染完后渲染。 <br/>
     * 这个对象必须实现 “visit” 功能。 <br/>
     * 对于 hook 一个通知节点很有用。
     * @method getNotificationNode
     * @return {Node}
     */
    getNotificationNode: function () {
        //return this._notificationNode;
    },

    getWinSize: function () {
        //return cc.size(this._winSizeInPoints);
    },

    getWinSizeInPixels: function () {
        //return cc.size(this._winSizeInPoints.width * this._contentScaleFactor, this._winSizeInPoints.height * this._contentScaleFactor);
    },

    getVisibleSize: null,

    getVisibleOrigin: null,

    getZEye: null,

    pause: function () {
        //if (this._paused)
        //    return;
        //
        //this._oldAnimationInterval = this._animationInterval;
        //// when paused, don't consume CPU
        //this.setAnimationInterval(1 / 4.0);
        //this._paused = true;
    },

    popScene: function () {

        //cc.assert(this._runningScene, cc._LogInfos.Director.popScene);
        //
        //this._scenesStack.pop();
        //var c = this._scenesStack.length;
        //
        //if (c === 0)
        //    this.end();
        //else {
        //    this._sendCleanupToScene = true;
        //    this._nextScene = this._scenesStack[c - 1];
        //}
    },

    purgeCachedData: function () {
        //cc.spriteFrameCache._clear();
        //cc.textureCache._clear();
    },

    purgeDirector: function () {
        ////cleanup scheduler
        //this.getScheduler().unscheduleAll();
        //
        //// Disable event dispatching
        //if (cc.eventManager)
        //    cc.eventManager.setEnabled(false);
        //
        //// don't release the event handlers
        //// They are needed in case the director is run again
        //
        //if (this._runningScene) {
        //    this._runningScene.onExitTransitionDidStart();
        //    this._runningScene.onExit();
        //    this._runningScene.cleanup();
        //}
        //
        //this._runningScene = null;
        //this._nextScene = null;
        //
        //// remove all objects, but don't release it.
        //// runScene might be executed after 'end'.
        //this._scenesStack.length = 0;
        //
        //this.stopAnimation();
        //
        //// Clear all caches
        //this.purgeCachedData();
        //
        //cc.checkGLErrorDebug();
    },

    reset: function () {
        //this.purgeDirector();
        //
        //if (cc.eventManager)
        //    cc.eventManager.setEnabled(true);
        //
        //// Action manager
        //if(this._actionManager){
        //    this._scheduler.scheduleUpdate(this._actionManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        //}
        //
        //// Animation manager
        //if (this._animationManager) {
        //    this._scheduler.scheduleUpdate(this._animationManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        //}
        //
        //// Collider manager
        //if (this._collisionManager) {
        //    this._scheduler.scheduleUpdate(this._collisionManager, cc.Scheduler.PRIORITY_SYSTEM, false);
        //}
        //
        //this.startAnimation();
    },

    pushScene: function (scene) {

        //cc.assert(scene, cc._LogInfos.Director.pushScene);
        //
        //this._sendCleanupToScene = false;
        //
        //this._scenesStack.push(scene);
        //this._nextScene = scene;
    },
    runSceneImmediate: function (){},
    runScene: function () {},
    runSceneImmediate3D: function (scene, onBeforeLoadScene, onLaunched) {
        var id, node, game = cc.game3D;
        var persistNodes = game._persistRootNodes;

        if (scene instanceof cc.Scene3D) {
            scene._load();  // ensure scene initialized
        }

        // detach persist nodes
        for (id in persistNodes) {
            node = persistNodes[id];
            game._ignoreRemovePersistNode = node;
            node.parent = null;
            game._ignoreRemovePersistNode = null;
        }

        var oldScene = this._scene;

        // auto release assets
        var autoReleaseAssets = oldScene && oldScene.autoReleaseAssets && oldScene.dependAssets;
        AutoReleaseUtils.autoRelease(cc.loader, autoReleaseAssets, scene.dependAssets);

        // unload scene
        if (cc.isValid(oldScene)) {
            oldScene.destroy();
        }

        this._scene = null;

        // purge destroyed nodes belongs to old scene
        cc.Object._deferredDestroy();

        if (onBeforeLoadScene) {
            onBeforeLoadScene();
        }
        this.emit(Director3D.EVENT_BEFORE_SCENE_LAUNCH, scene);

        //var sgScene = scene;

        // Run an Entity Scene
        if (scene instanceof cc.Scene3D) {
            this._scene = scene;
            //sgScene = scene._sgNode;

            // Re-attach or replace persist nodes
            for (id in persistNodes) {
                node = persistNodes[id];
                var existNode = scene.getChildByUuid(id);
                if (existNode) {
                    // scene also contains the persist node, select the old one
                    var index = existNode.getSiblingIndex();
                    existNode._destroyImmediate();
                    node.parent = scene;
                    node.setSiblingIndex(index);
                }
                else {
                    node.parent = scene;
                }
            }
            scene._activate();
        }
        //
        //// Run or replace rendering scene
        //if ( !this._runningScene ) {
        //    //start scene
        //    this.pushScene(sgScene);
        //    this.startAnimation();
        //}
        //else {
        //    //replace scene
        //    var i = this._scenesStack.length;
        //    this._scenesStack[Math.max(i - 1, 0)] = sgScene;
        //    this._sendCleanupToScene = true;
        //    this._nextScene = sgScene;
        //}
        //
        //if (this._nextScene) {
        //    this.setNextScene();
        //}
        //
        if (onLaunched) {
            onLaunched(null, scene);
        }
        //cc.renderer.clear();
        this.emit(Director3D.EVENT_AFTER_SCENE_LAUNCH, scene);
    },

    runScene3D: function (scene, onBeforeLoadScene, onLaunched) {
        //cc.assert(scene, cc._LogInfos.Director.pushScene);
        if (scene instanceof cc.Scene3D) {
            // ensure scene initialized
            scene._load();
        }

        // Delay run / replace scene to the end of the frame
        this.once(Director3D.EVENT_AFTER_UPDATE, function () {
            this.runSceneImmediate(scene, onBeforeLoadScene, onLaunched);
        });
    },

    _getSceneUuid: function (key) {
        //var scenes = cc.game3D._sceneInfos;
        //if (typeof key === 'string') {
        //    if (!key.endsWith('.fire')) {
        //        key += '.fire';
        //    }
        //    if (key[0] !== '/' && !key.startsWith('db://assets/')) {
        //        key = '/' + key;    // 使用全名匹配
        //    }
        //    // search scene
        //    for (var i = 0; i < scenes.length; i++) {
        //        var info = scenes[i];
        //        if (info.url.endsWith(key)) {
        //            return info;
        //        }
        //    }
        //}
        //else if (typeof key === 'number') {
        //    if (0 <= key && key < scenes.length) {
        //        return scenes[key];
        //    }
        //    else {
        //        cc.error('loadScene: The scene index to load (%s) is out of range.', key);
        //    }
        //}
        //else {
        //    cc.error('loadScene: Unknown name type to load: "%s"', key);
        //}
        //return null;
    },

    loadScene: function (sceneName, onLaunched, _onUnloaded) {
        //if (this._loadingScene) {
        //    cc.error('loadScene: Failed to load scene "%s" because "%s" is already loading', sceneName, this._loadingScene);
        //    return false;
        //}
        //var info = this._getSceneUuid(sceneName);
        //if (info) {
        //    var uuid = info.uuid;
        //    this.emit(Director3D.EVENT_BEFORE_SCENE_LOADING, sceneName);
        //    this._loadingScene = sceneName;
        //    if (CC_JSB && cc.runtime && uuid !== this._launchSceneUuid) {
        //        var self = this;
        //        var groupName = cc.path.basename(info.url) + '_' + info.uuid;
        //        console.log('==> start preload: ' + groupName);
        //        var ensureAsync = false;
        //        cc.LoaderLayer.preload([groupName], function () {
        //            console.log('==> end preload: ' + groupName);
        //            if (ensureAsync) {
        //                self._loadSceneByUuid(uuid, onLaunched, _onUnloaded);
        //            }
        //            else {
        //                setTimeout(function () {
        //                    self._loadSceneByUuid(uuid, onLaunched, _onUnloaded);
        //                }, 0);
        //            }
        //        });
        //        ensureAsync = true;
        //    }
        //    else {
        //        this._loadSceneByUuid(uuid, onLaunched, _onUnloaded);
        //    }
        //    return true;
        //}
        //else {
        //    cc.error('loadScene: Can not load the scene "%s" because it was not in the build settings before playing.', sceneName);
        //    return false;
        //}
    },

    preloadScene: function (sceneName, onLoaded) {
        //var info = this._getSceneUuid(sceneName);
        //if (info) {
        //    this.emit(Director3D.EVENT_BEFORE_SCENE_LOADING, sceneName);
        //    cc.loader.load({ id: info.uuid, type: 'uuid' }, function (error, asset) {
        //        if (error) {
        //            cc.error('Failed to preload "%s", %s', sceneName, error.message);
        //        }
        //        if (onLoaded) {
        //            onLoaded(error, asset);
        //        }
        //    });
        //}
        //else {
        //    var error = 'Can not preload the scene "' + sceneName + '" because it is not in the build settings.';
        //    onLoaded(new Error(error));
        //    cc.error('preloadScene: ' + error);
        //}
    },

    _loadSceneByUuid: function (uuid, onLaunched, onUnloaded) {
        //cc.AssetLibrary.unloadAsset(uuid);     // force reload
        //cc.AssetLibrary.loadAsset(uuid, function (error, sceneAsset) {
        //    var self = cc.director;
        //    self._loadingScene = '';
        //    var scene;
        //    if (error) {
        //        error = 'Failed to load scene: ' + error;
        //        cc.error(error);
        //        if (CC_DEV) {
        //            console.assert(false, error);
        //        }
        //    }
        //    else {
        //        if (sceneAsset instanceof cc.SceneAsset) {
        //            scene = sceneAsset.scene;
        //            scene._id = sceneAsset._uuid;
        //            scene._name = sceneAsset._name;
        //            self.runSceneImmediate(scene, onUnloaded, onLaunched);
        //        }
        //        else {
        //            error = 'The asset ' + uuid + ' is not a scene';
        //            cc.error(error);
        //            scene = null;
        //        }
        //    }
        //    if (error && onLaunched) {
        //        onLaunched(error);
        //    }
        //});
    },

    resume: function () {
        //if (!this._paused) {
        //    return;
        //}
        //
        //this.setAnimationInterval(this._oldAnimationInterval);
        //this._lastUpdate = Date.now();
        //if (!this._lastUpdate) {
        //    cc.log(cc._LogInfos.Director.resume);
        //}
        //
        //this._paused = false;
        //this._deltaTime = 0;
    },

    setContentScaleFactor: function (scaleFactor) {
        //if (scaleFactor !== this._contentScaleFactor) {
        //    this._contentScaleFactor = scaleFactor;
        //}
    },

    setDepthTest: null,

    setClearColor: null,

    setDefaultValues: function () {

    },

    setNextDeltaTimeZero: function (nextDeltaTimeZero) {
        //this._nextDeltaTimeZero = nextDeltaTimeZero;
    },

    setNextScene: function () {
        //var runningIsTransition = false, newIsTransition = false;
        //if (cc.TransitionScene) {
        //    runningIsTransition = this._runningScene ? this._runningScene instanceof cc.TransitionScene : false;
        //    newIsTransition = this._nextScene ? this._nextScene instanceof cc.TransitionScene : false;
        //}
        //
        //// If it is not a transition, call onExit/cleanup
        //if (!newIsTransition) {
        //    var locRunningScene = this._runningScene;
        //    if (locRunningScene) {
        //        locRunningScene.onExitTransitionDidStart();
        //        locRunningScene.onExit();
        //    }
        //
        //    // issue #709. the root node (scene) should receive the cleanup message too
        //    // otherwise it might be leaked.
        //    if (this._sendCleanupToScene && locRunningScene)
        //        locRunningScene.cleanup();
        //}
        //
        //this._runningScene = this._nextScene;
        //cc.renderer.childrenOrderDirty = true;
        //
        //this._nextScene = null;
        //if ((!runningIsTransition) && (this._runningScene !== null)) {
        //    this._runningScene.onEnter();
        //    this._runningScene.onEnterTransitionDidFinish();
        //}
    },

    setNotificationNode: null,

    getDelegate: null,

    setDelegate: null,

    setOpenGLView: null,

    setProjection: null,

    setViewport: null,

    getOpenGLView: null,

    getProjection: null,

    setAlphaBlending: null,

    isSendCleanupToScene: function () {
        //return this._sendCleanupToScene;
    },

    getRunningScene: function () {
        //return this._runningScene;
    },

    getScene: function () {
        //return this._scene;
    },

    getAnimationInterval: function () {
        //return this._animationInterval;
    },

    isDisplayStats: function () {
        //return cc.profiler ? cc.profiler.isShowingStats() : false;
    },

    setDisplayStats: function (displayStats) {
        //if (cc.profiler) {
        //    displayStats ? cc.profiler.showStats() : cc.profiler.hideStats();
        //}
    },

    getSecondsPerFrame: function () {
        //return this._secondsPerFrame;
    },

    isNextDeltaTimeZero: function () {
        //return this._nextDeltaTimeZero;
    },

    isPaused: function () {
        //return this._paused;
    },

    getTotalFrames: function () {
        //return this._totalFrames;
    },

    popToRootScene: function () {
        //this.popToSceneStackLevel(1);
    },

    popToSceneStackLevel: function (level) {
        //cc.assert(this._runningScene, cc._LogInfos.Director.popToSceneStackLevel_2);
        //
        //var locScenesStack = this._scenesStack;
        //var c = locScenesStack.length;
        //
        //if (c === 0) {
        //    this.end();
        //    return;
        //}
        //// current level or lower -> nothing
        //if (level > c)
        //    return;
        //
        //// pop stack until reaching desired level
        //while (c > level) {
        //    var current = locScenesStack.pop();
        //    if (current.running) {
        //        current.onExitTransitionDidStart();
        //        current.onExit();
        //    }
        //    current.cleanup();
        //    c--;
        //}
        //this._nextScene = locScenesStack[locScenesStack.length - 1];
        //this._sendCleanupToScene = false;
    },

    getScheduler: function () {
        //return this._scheduler;
    },

    setScheduler: function (scheduler) {
        //if (this._scheduler !== scheduler) {
        //    this._scheduler = scheduler;
        //}
    },

    getActionManager: function () {
        //return this._actionManager;
    },

    setActionManager: function (actionManager) {
        //if (this._actionManager !== actionManager) {
        //    this._actionManager = actionManager;
        //}
    },

    getAnimationManager: function () {
        //return this._animationManager;
    },

    getCollisionManager: function () {
        //return this._collisionManager;
    },

    getDeltaTime: function () {
        //return this._deltaTime;
    },

    _calculateMPF: function () {
        //var now = Date.now();
        //this._secondsPerFrame = (now - this._lastUpdate) / 1000;
    }
});

// Event target
cc.js.addon(Director3D.prototype, EventTarget.prototype);

Director3D.EVENT_PROJECTION_CHANGED = "director_projection_changed";

Director3D.EVENT_BEFORE_SCENE_LOADING = "director_before_scene_loading";

Director3D.EVENT_BEFORE_SCENE_LAUNCH = "director_before_scene_launch";

Director3D.EVENT_AFTER_SCENE_LAUNCH = "director_after_scene_launch";

Director3D.EVENT_BEFORE_UPDATE = "director_before_update";

Director3D.EVENT_COMPONENT_UPDATE = "director_component_update";

Director3D.EVENT_COMPONENT_LATE_UPDATE = "director_component_late_update";

Director3D.EVENT_AFTER_UPDATE = "director_after_update";

Director3D.EVENT_BEFORE_VISIT = "director_before_visit";

Director3D.EVENT_AFTER_VISIT = "director_after_visit";

Director3D.EVENT_AFTER_DRAW = "director_after_draw";

/***************************************************
 * implementation of DisplayLinkDirector
 **************************************************/
cc.DisplayLinkDirector = Director3D.extend(/** @lends Director3D# */{
    invalid: false,

    /**
     * Starts Animation
     */
    startAnimation: function () {
        //this._nextDeltaTimeZero = true;
        //this.invalid = false;
    },

    /**
     * Run main loop of director
     */
    mainLoop: CC_EDITOR ? function (deltaTime, updateAnimate) {
        if (!this._paused) {
            this.emit(Director3D.EVENT_BEFORE_UPDATE);
            this.emit(Director3D.EVENT_COMPONENT_UPDATE, deltaTime);

            if (updateAnimate) {
                this.engineUpdate(deltaTime);
            }

            this.emit(Director3D.EVENT_COMPONENT_LATE_UPDATE, deltaTime);
            this.emit(Director3D.EVENT_AFTER_UPDATE);
        }

        this.visit();

        // Render
        cc.g_NumberOfDraws = 0;
        var scene = this._scene && this._scene._sgScene;
        var rootNode = this._scene && this._scene._sgNode;
        rootNode && rootNode.syncHierarchy();
        var cameras = (scene && scene.getCameras()) || [];
        for(var index = 0; index < cameras.length; ++index) {
            cc.renderer.render(scene, cameras[index]);
        }
        //cc.renderer.clear();

        //cc.renderer.rendering(cc._renderContext);
        this._totalFrames++;

        this.emit(Director3D.EVENT_AFTER_DRAW);

    } : function () {
        if (this._purgeDirectorInNextLoop) {
            this._purgeDirectorInNextLoop = false;
            this.purgeDirector();
        }
        else if (!this.invalid) {
            // calculate "global" dt
            this.calculateDeltaTime();

            if (!this._paused) {
                // Call start for new added components
                this.emit(Director3D.EVENT_BEFORE_UPDATE);
                // Update for components
                this.emit(Director3D.EVENT_COMPONENT_UPDATE, this._deltaTime);
                // Engine update with scheduler
                this.engineUpdate(this._deltaTime);
                // Late update for components
                this.emit(Director3D.EVENT_COMPONENT_LATE_UPDATE, this._deltaTime);
                // User can use this event to do things after update
                this.emit(Director3D.EVENT_AFTER_UPDATE);
                // Destroy entities that have been removed recently
                cc.Object._deferredDestroy();
            }

            /* to avoid flickr, nextScene MUST be here: after tick and before draw.
             XXX: Which bug is this one. It seems that it can't be reproduced with v0.9 */
            if (this._nextScene) {
                this.setNextScene();
            }

            this.visit(this._deltaTime);

            // Render
            cc.g_NumberOfDraws = 0;

            var scene = this._scene && this._scene._sgScene;
            var rootNode = this._scene && this._scene._sgNode;
            rootNode && rootNode.syncHierarchy();
            var cameras = (scene && scene.getCameras()) || [];
            for(var index = 0; index < cameras.length; ++index) {
                cc.renderer.render(scene, cameras[index]);
            }

            this._totalFrames++;

            this.emit(Director3D.EVENT_AFTER_DRAW);

            this._calculateMPF();
        }
    },

    stopAnimation: function () {
        //this.invalid = true;
    },

    setAnimationInterval: function (value) {
        //this._animationInterval = value;
        //if (!this.invalid) {
        //    this.stopAnimation();
        //    this.startAnimation();
        //}
    }
});

Director3D.sharedDirector = null;
Director3D.firstUseDirector = true;

Director3D._getInstance = function () {
    if (Director3D.firstUseDirector) {
        Director3D.firstUseDirector = false;
        Director3D.sharedDirector = new cc.DisplayLinkDirector();
        Director3D.sharedDirector.init();
    }
    return Director3D.sharedDirector;
};

/**
 * Default fps is 60
 * @type {Number}
 */
cc.defaultFPS = 60;

//Possible OpenGL projections used by director
/**
 * Constant for 2D projection (orthogonal projection)
 * @constant
 * @type {Number}
 */
Director3D.PROJECTION_2D = 0;

/**
 * Constant for 3D projection with a fovy=60, znear=0.5f and zfar=1500.
 * @constant
 * @type {Number}
 */
Director3D.PROJECTION_3D = 1;

/**
 * Constant for custom projection, if Director3D's projection set to it, it calls "updateProjection" on the projection delegate.
 * @constant
 * @type {Number}
 */
Director3D.PROJECTION_CUSTOM = 3;

/**
 * Constant for default projection of Director3D, default projection is 3D projection
 * @constant
 * @type {Number}
 */
Director3D.PROJECTION_DEFAULT = Director3D.PROJECTION_2D;

cc.Director3D = module.exports = Director3D;