# Cocos Creator Engine Framework

This repo is the engine framework for Cocos Creator, Cocos Creator is a game development tool focused on content creation, which has realized features like thorough scriptability, componentization and data driven, etc. on the basis of Cocos2d-x.

Cocos Creator's in-editor scene view and web runtime share the same framework, which is the content of this repo. It's originally forked from [Cocos2d-html5](https://github.com/cocos2d/cocos2d-html5/), we build up an Entity Component architecture on it to meet the needs of Cocos Creator. 

This framework is a cross-platform game engine written in Javascript and licensed under MIT. It supports major desktop and mobile browsers, it's also compatible with [Cocos2d Javascript Binding engine](https://github.com/cocos-creator/cocos2d-x-lite) to support native platforms like iOS, Android, Win32, Mac OS X.

The framework is naturally integrated with Cocos Creator, so it's not designed to be used independently.

## Developer

### Prerequisite

- Install [node.js v4.2.1+](https://nodejs.org/)
- Install [gulp-cli v3.9.0+](https://github.com/gulpjs/gulp/blob/master/docs/getting-started.md)

### Install

In cloned project folder, run the following command to setup dev environment:

```bash
# Initialize gulp task dependencies
# npm is a builtin CLI when you install Node.js
npm install
```

This is all you have to do to set engine development environment.

### Build

```bash
gulp build
```

### Unit Test

#### Install test environment

```bash
npm install gulp-qunit
```

#### Test in CLI

```bash
npm test
```

#### Test in browser

1. Build for testing. <br>

    ```bash
    gulp build-test
    ```

2. Start a http server in cloned project folder.

3. Open [http://127.0.0.1:8511/bin/qunit-runner.html](http://127.0.0.1:8511/bin/qunit-runner.html) in your browser.

### Visual Test

1. Build for testing.<br>

    ```bash
    gulp build-test
    ```

2. Start a http server in cloned project folder.

3. Open [http://127.0.0.1:8512/test/visual-tests/index.html](http://127.0.0.1:8512/test/visual-tests/index.html) in your browser.

## Links

* [Official site](http://cocos2d-x.org/creator)
* [Download](http://cocos2d-x.org/download)
* [Documentation](http://cocos2d-x.org/docs/editors_and_tools/creator/index.html)
* [API References](http://cocos2d-x.org/docs/api-ref/creator/v1.0/)
* [Forum](http://discuss.cocos2d-x.org/c/editors-and-tools/cocos-creator)
* [Road Map](http://discuss.cocos2d-x.org/t/cocos-creator-roadmap)
