require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"AStarMoveType":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'd8b5aOv2ydICLvN0ax2hzqs', 'AStarMoveType');
// Script\AStar\AStarMoveType.js

var AStarMoveType = cc.Enum({
    FOUR_DIRECTION: -1,
    EIGHT_DIRECTION: -1
});

module.exports = AStarMoveType;

cc._RFpop();
},{}],"AStarStep":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'cddcfi9HolIJqBlrTmLMDgD', 'AStarStep');
// Script\AStar\AStarStep.js

var AStarStep = cc.Class({
    properties: function properties() {
        return {
            g: {
                'default': 0,
                type: cc.Integer
            },
            h: {
                'default': 0,
                type: cc.Integer
            },
            f: {
                get: function get() {
                    return this.g + this.h;
                }
            },
            position: {
                'default': new cc.Vec2()
            },
            last: {
                'default': null,
                type: AStarStep,
                serializable: false
            }
        };
    },

    ctor: function ctor() {
        if (arguments.length > 0 && arguments[0] instanceof cc.Vec2) {
            this.position = arguments[0];
        }
    },

    equalTo: function equalTo(other) {
        if (other instanceof AStarStep) {
            return this.position.equals(other.position);
        }
        return false;
    },

    toString: function toString() {
        return '(' + 'position: ' + this.position + ' g: ' + this.g + ' h: ' + this.h + ' f: ' + this.f + ')';
    }

});

module.exports = AStarStep;

cc._RFpop();
},{}],"AStar":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'c6b32yKT3RKT7HVcYN3ryNr', 'AStar');
// Script\AStar\AStar.js

var AStarStep = require('AStarStep');
var AStarMoveType = require('AStarMoveType');

cc.Class({
    'extends': cc.Component,

    properties: {
        barrierLayerName: 'barrier',
        moveType: {
            'default': AStarMoveType.FOUR_DIRECTION,
            type: AStarMoveType
        }
    },

    editor: {
        requireComponent: cc.TiledMap
    },

    onLoad: function onLoad() {
        this._open = [];
        this._closed = [];
    },

    start: function start() {
        this._tiledMap = this.getComponent(cc.TiledMap);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
    },

    _indexOfStepArray: function _indexOfStepArray(value, stepArray) {
        for (var i = 0; i < stepArray.length; ++i) {
            if (value.equals(stepArray[i].position)) {
                return i;
            }
        }
        return -1;
    },

    _insertToOpen: function _insertToOpen(step) {
        var stepF = step.f;
        var length = this._open.length;
        var i = 0;
        for (; i < length; ++i) {
            if (stepF <= this._open[i].f) {
                break;
            }
        }
        // insert to index i
        this._open.splice(i, 0, step);
    },

    moveToward: function moveToward(start, finish) {
        this._closed = [];
        this._open = [];
        var paths = [];

        // cc.log('find start: ' + start + ' to: ' + finish);
        this._open.push(new AStarStep(start));
        var pathFound = false;
        do {
            // cc.log('==============================================================');
            var currentStep = this._open.shift();
            // cc.log('currentStep: ' + currentStep);

            this._closed.push(currentStep);

            if (currentStep.position.equals(finish)) {
                // cc.log('finish :P');
                pathFound = true;
                var tmpStep = currentStep;
                do {
                    paths.unshift(tmpStep.position);
                    tmpStep = tmpStep.last;
                } while (tmpStep !== null);

                this._open = [];
                this._closed = [];
                break;
            }

            var borderPositions = this._borderMovablePoints(currentStep.position);

            for (var i = 0; i < borderPositions.length; ++i) {
                var borderPosition = borderPositions[i];
                // cc.log('check: ' + borderPosition);
                // Check if the step isn't already in the closed set
                if (this._indexOfStepArray(borderPosition, this._closed) != -1) {
                    // cc.log('had in closed: ' + borderPosition);
                    // cc.log('remove check position: ' + borderPosition);
                    borderPositions.splice(i, 1);
                    i--;
                    continue;
                }

                var step = new AStarStep(borderPosition);
                var moveCost = this._costToMove(borderPosition, finish);
                var index = this._indexOfStepArray(borderPosition, this._open);

                if (index == -1) {
                    step.last = currentStep;
                    step.g = currentStep.g + moveCost;
                    var distancePoint = borderPosition.sub(finish);
                    step.h = Math.abs(distancePoint.x) + Math.abs(distancePoint.y);
                    this._insertToOpen(step);
                } else {
                    // cc.log('had in open: ' + step.toString());
                    step = this._open[index];
                    if (currentStep.g + moveCost < step.g) {
                        // cc.log('re insert into open: ' + step.toString());
                        step.g = currentStep.g + moveCost;

                        // re insert
                        this._open.splice(index, 1);
                        this._insertToOpen(step);
                    }
                }
            }
        } while (this._open.length > 0);

        return paths;
    },

    _costToMove: function _costToMove(positionLeft, positionRight) {
        if (this.moveType == AStarMoveType.EIGHT_DIRECTION) {
            /**
             * diagonal length: 1.41 ≈ Math.sqrt(x * x + y * y)
             * line length: 1
             * 
             * cost = length * 10
             * diagonal cost = 14 ≈ 14.1
             * cost line = 10 = 1 * 10
             */
            return positionLeft.x != positionRight.x && positionLeft.y != positionRight.y ? 14 : 10;
        } else {
            return 1;
        }
    },

    _borderMovablePoints: function _borderMovablePoints(position) {
        var results = [];
        var hasTop = false;
        var hasBottom = false;
        var hasLeft = false;
        var hasRight = false;

        // top
        var top = cc.v2(position.x, position.y - 1);
        if (this._layerBarrier.getTileGIDAt(top) === 0) {
            // cc.log('top: ' + top);
            results.push(top);
            hasTop = true;
        }
        // bottom
        var bottom = cc.v2(position.x, position.y + 1);
        if (this._layerBarrier.getTileGIDAt(bottom) === 0) {
            // cc.log('bottom: ' + bottom);
            results.push(bottom);
            hasBottom = true;
        }
        // left
        var left = cc.v2(position.x - 1, position.y);
        if (this._layerBarrier.getTileGIDAt(left) === 0) {
            // cc.log('left: ' + left);
            results.push(left);
            hasLeft = true;
        }
        // right
        var right = cc.v2(position.x + 1, position.y);
        if (this._layerBarrier.getTileGIDAt(right) === 0) {
            // cc.log('right: ' + right);
            results.push(right);
            hasRight = true;
        }

        if (this.moveType == AStarMoveType.EIGHT_DIRECTION) {
            // Top Left
            var topLeft = cc.v2(position.x - 1, position.y - 1);
            if (hasTop && hasLeft) {
                if (this._layerBarrier.getTileGIDAt(topLeft) === 0) {
                    // cc.log('top left: ' + topLeft);
                    results.push(topLeft);
                }
            }
            // Top Right
            var topRight = cc.v2(position.x + 1, position.y - 1);
            if (hasTop && hasRight) {
                if (this._layerBarrier.getTileGIDAt(topRight) === 0) {
                    // cc.log('top right: ' + topRight);
                    results.push(topRight);
                }
            }
            // Bottom Left
            var bottomLeft = cc.v2(position.x - 1, position.y + 1);
            if (hasBottom && hasLeft) {
                if (this._layerBarrier.getTileGIDAt(bottomLeft) === 0) {
                    // cc.log('bttom left: ' + bottomLeft);
                    results.push(bottomLeft);
                }
            }
            // Bottom Right
            var bottomRight = cc.v2(position.x + 1, position.y + 1);
            if (hasBottom && hasRight) {
                if (this._layerBarrier.getTileGIDAt(bottomRight) === 0) {
                    // cc.log('top right: ' + bottomRight);
                    results.push(bottomRight);
                }
            }
        }
        return results;
    }
});

cc._RFpop();
},{"AStarMoveType":"AStarMoveType","AStarStep":"AStarStep"}],"AuthorFooter":[function(require,module,exports){
"use strict";
cc._RFpush(module, '654b5eiPftHcb6FO/XlY7qk', 'AuthorFooter');
// Script\AuthorFooter.js

var gitHubUser = 'luckytianyiyan';
var gitHubRepoName = 'A-star';
var gitHubPrefix = 'https://github.com/';
cc.Class({
    'extends': cc.Component,
    openAuthor: function openAuthor() {
        cc.sys.openURL(this._appendSubPath(gitHubPrefix, gitHubUser));
    },

    openRepo: function openRepo() {
        cc.sys.openURL(this._appendSubPath(gitHubPrefix, gitHubUser, gitHubRepoName));
    },

    _appendSubPath: function _appendSubPath(url, subPaths) {
        if (arguments.length < 2) {
            return url = url[url.length - 1] === '/' ? url : url + '/';
        }
        var result = url;
        for (var i = 1; i < arguments.length; ++i) {
            result += arguments[i] + '/';
        }
        return result;
    }
});

cc._RFpop();
},{}],"TestMap":[function(require,module,exports){
"use strict";
cc._RFpush(module, 'c2e92irXu1PCYYXIRuBp3hR', 'TestMap');
// Script\TestMap.js

var AStar = require('AStar');
var AStarMoveType = require('AStarMoveType');

cc.Class({
    'extends': cc.Component,
    properties: {
        floorLayerName: 'floor',
        playerStart: {
            'default': new cc.v2()
        },
        stepOfDuration: {
            'default': 0.2,
            type: cc.Float
        },
        enabledDebugDraw: true
    },

    editor: {
        requireComponent: AStar
    },

    onLoad: function onLoad() {
        this._debugTileColor = cc.color(255, 187, 255, 255);
        this._paths = [];
    },

    onModeSwitchButtonClicked: function onModeSwitchButtonClicked(event) {
        var node = event.target;
        var titleLabel = node.getComponentInChildren(cc.Label);
        if (this._aStar.moveType === AStarMoveType.FOUR_DIRECTION) {
            this._aStar.moveType = AStarMoveType.EIGHT_DIRECTION;
            titleLabel.string = '8 direction';
        } else {
            this._aStar.moveType = AStarMoveType.FOUR_DIRECTION;
            titleLabel.string = '4 direction';
        }
    },

    start: function start() {
        this._player = this.node.getChildByName('player');
        this._aStar = this.getComponent(AStar);
        this._tiledMap = this.getComponent(cc.TiledMap);
        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);

        var tileSize = this._tiledMap.getTileSize();
        var playerStartPosition = this._layerFloor.getPositionAt(this.playerStart);
        playerStartPosition.x += tileSize.width / 2;
        playerStartPosition.y += tileSize.width / 2;
        this._player.setPosition(playerStartPosition);

        var self = this;
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ONE_BY_ONE,
            onTouchBegan: function onTouchBegan(touch, event) {
                var touchLocation = touch.getLocation();
                var location = self.node.convertToNodeSpaceAR(touchLocation);
                var targetTilePosition = self._tilePosistion(location);
                var tileLayerSize = self._layerFloor.getLayerSize();
                if (targetTilePosition.x < 0 || targetTilePosition.x >= tileLayerSize.width || targetTilePosition.y < 0 || targetTilePosition.y >= tileLayerSize.height) {
                    return true;
                }
                var playerPosition = self._player.getPosition();
                cc.log('player position: ' + playerPosition);
                var playerTilePosition = self._tilePosistion(playerPosition);
                cc.log('player tile position: ' + playerTilePosition);

                self._move(playerTilePosition, targetTilePosition);

                self._debugDraw(targetTilePosition, cc.Color.RED);

                return true;
            }
        }, self.node);
    },

    _move: function _move(start, finish) {
        this._player.stopAllActions();
        if (this.enabledDebugDraw) {
            this._clearDebugColor();
        }

        this._paths = this._aStar.moveToward(start, finish);
        if (this._paths.length < 1) {
            cc.log('cannot find path');
            return;
        }
        for (var i = 0; i < this._paths.length; ++i) {
            this._debugDraw(this._paths[i], this._debugTileColor, i);
        }
        var sequence = [];
        var tileSize = this._tiledMap.getTileSize();
        for (var i = 0; i < this._paths.length; ++i) {
            var actionPosition = this._layerFloor.getPositionAt(this._paths[i]);
            actionPosition.x += tileSize.width / 2;
            actionPosition.y += tileSize.width / 2;
            sequence.push(cc.moveTo(this.stepOfDuration, actionPosition));
        }
        // if (this.enabledDebugDraw) {
        //     let resetColorCallback = cc.callFunc(this._clearDebugColor, this);
        //     sequence.push(resetColorCallback);
        // }
        this._player.runAction(cc.sequence(sequence));
    },

    _clearDebugColor: function _clearDebugColor(sender) {
        for (var i = 0; i < this._paths.length; ++i) {
            var touchTile = this._layerFloor.getTileAt(this._paths[i]);
            touchTile.color = cc.Color.WHITE;
            touchTile.removeAllChildren();
        }
    },

    _debugDraw: function _debugDraw(tilePosition, color, index) {
        if (!this.enabledDebugDraw) {
            return;
        }

        var touchTile = this._layerFloor.getTileAt(tilePosition);
        touchTile.color = color;

        if (index !== undefined) {
            // let label = new cc.LabelTTF(index.toString(), 'Arial', 12);
            // label.setPosition(cc.v2(touchTile.width / 2, touchTile.height / 2));
            // touchTile.addChild(label, 10);
        }
    },

    _tilePosistion: function _tilePosistion(pixelPosition) {
        var mapSize = this.node.getContentSize();
        var tileSize = this._tiledMap.getTileSize();
        var x = Math.floor(pixelPosition.x / tileSize.width);
        var y = Math.floor((mapSize.height - pixelPosition.y) / tileSize.height);

        return cc.v2(x, y);
    }
});

cc._RFpop();
},{"AStar":"AStar","AStarMoveType":"AStarMoveType"}]},{},["AuthorFooter","TestMap","AStar","AStarStep","AStarMoveType"])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uL0NvY29zQ3JlYXRvcl92MS4xLjAtcmMxXzIwMTYwNTI3MDEvQ29jb3NDcmVhdG9yL3Jlc291cmNlcy9hcHAuYXNhci9ub2RlX21vZHVsZXMvYnJvd3Nlci1wYWNrL19wcmVsdWRlLmpzIiwiU2NyaXB0L0FTdGFyL0FTdGFyTW92ZVR5cGUuanMiLCJTY3JpcHQvQVN0YXIvQVN0YXJTdGVwLmpzIiwiU2NyaXB0L0FTdGFyL0FTdGFyLmpzIiwiU2NyaXB0L0F1dGhvckZvb3Rlci5qcyIsIlNjcmlwdC9UZXN0TWFwLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1hBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDcERBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2TkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzdCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnZDhiNWFPdjJ5ZElDTHZOMGF4Mmh6cXMnLCAnQVN0YXJNb3ZlVHlwZScpO1xuLy8gU2NyaXB0XFxBU3RhclxcQVN0YXJNb3ZlVHlwZS5qc1xuXG52YXIgQVN0YXJNb3ZlVHlwZSA9IGNjLkVudW0oe1xuICAgIEZPVVJfRElSRUNUSU9OOiAtMSxcbiAgICBFSUdIVF9ESVJFQ1RJT046IC0xXG59KTtcblxubW9kdWxlLmV4cG9ydHMgPSBBU3Rhck1vdmVUeXBlO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnY2RkY2ZpOUhvbElKcUJsclRtTE1EZ0QnLCAnQVN0YXJTdGVwJyk7XG4vLyBTY3JpcHRcXEFTdGFyXFxBU3RhclN0ZXAuanNcblxudmFyIEFTdGFyU3RlcCA9IGNjLkNsYXNzKHtcbiAgICBwcm9wZXJ0aWVzOiBmdW5jdGlvbiBwcm9wZXJ0aWVzKCkge1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgZzoge1xuICAgICAgICAgICAgICAgICdkZWZhdWx0JzogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBjYy5JbnRlZ2VyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgaDoge1xuICAgICAgICAgICAgICAgICdkZWZhdWx0JzogMCxcbiAgICAgICAgICAgICAgICB0eXBlOiBjYy5JbnRlZ2VyXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZjoge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24gZ2V0KCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5nICsgdGhpcy5oO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3NpdGlvbjoge1xuICAgICAgICAgICAgICAgICdkZWZhdWx0JzogbmV3IGNjLlZlYzIoKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGxhc3Q6IHtcbiAgICAgICAgICAgICAgICAnZGVmYXVsdCc6IG51bGwsXG4gICAgICAgICAgICAgICAgdHlwZTogQVN0YXJTdGVwLFxuICAgICAgICAgICAgICAgIHNlcmlhbGl6YWJsZTogZmFsc2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuXG4gICAgY3RvcjogZnVuY3Rpb24gY3RvcigpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPiAwICYmIGFyZ3VtZW50c1swXSBpbnN0YW5jZW9mIGNjLlZlYzIpIHtcbiAgICAgICAgICAgIHRoaXMucG9zaXRpb24gPSBhcmd1bWVudHNbMF07XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZXF1YWxUbzogZnVuY3Rpb24gZXF1YWxUbyhvdGhlcikge1xuICAgICAgICBpZiAob3RoZXIgaW5zdGFuY2VvZiBBU3RhclN0ZXApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnBvc2l0aW9uLmVxdWFscyhvdGhlci5wb3NpdGlvbik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0sXG5cbiAgICB0b1N0cmluZzogZnVuY3Rpb24gdG9TdHJpbmcoKSB7XG4gICAgICAgIHJldHVybiAnKCcgKyAncG9zaXRpb246ICcgKyB0aGlzLnBvc2l0aW9uICsgJyBnOiAnICsgdGhpcy5nICsgJyBoOiAnICsgdGhpcy5oICsgJyBmOiAnICsgdGhpcy5mICsgJyknO1xuICAgIH1cblxufSk7XG5cbm1vZHVsZS5leHBvcnRzID0gQVN0YXJTdGVwO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnYzZiMzJ5S1QzUktUN0hWY1lOM3J5TnInLCAnQVN0YXInKTtcbi8vIFNjcmlwdFxcQVN0YXJcXEFTdGFyLmpzXG5cbnZhciBBU3RhclN0ZXAgPSByZXF1aXJlKCdBU3RhclN0ZXAnKTtcbnZhciBBU3Rhck1vdmVUeXBlID0gcmVxdWlyZSgnQVN0YXJNb3ZlVHlwZScpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG5cbiAgICBwcm9wZXJ0aWVzOiB7XG4gICAgICAgIGJhcnJpZXJMYXllck5hbWU6ICdiYXJyaWVyJyxcbiAgICAgICAgbW92ZVR5cGU6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogQVN0YXJNb3ZlVHlwZS5GT1VSX0RJUkVDVElPTixcbiAgICAgICAgICAgIHR5cGU6IEFTdGFyTW92ZVR5cGVcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBlZGl0b3I6IHtcbiAgICAgICAgcmVxdWlyZUNvbXBvbmVudDogY2MuVGlsZWRNYXBcbiAgICB9LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMuX29wZW4gPSBbXTtcbiAgICAgICAgdGhpcy5fY2xvc2VkID0gW107XG4gICAgfSxcblxuICAgIHN0YXJ0OiBmdW5jdGlvbiBzdGFydCgpIHtcbiAgICAgICAgdGhpcy5fdGlsZWRNYXAgPSB0aGlzLmdldENvbXBvbmVudChjYy5UaWxlZE1hcCk7XG4gICAgICAgIHRoaXMuX2xheWVyQmFycmllciA9IHRoaXMuX3RpbGVkTWFwLmdldExheWVyKHRoaXMuYmFycmllckxheWVyTmFtZSk7XG4gICAgfSxcblxuICAgIF9pbmRleE9mU3RlcEFycmF5OiBmdW5jdGlvbiBfaW5kZXhPZlN0ZXBBcnJheSh2YWx1ZSwgc3RlcEFycmF5KSB7XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgc3RlcEFycmF5Lmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAodmFsdWUuZXF1YWxzKHN0ZXBBcnJheVtpXS5wb3NpdGlvbikpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gaTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gLTE7XG4gICAgfSxcblxuICAgIF9pbnNlcnRUb09wZW46IGZ1bmN0aW9uIF9pbnNlcnRUb09wZW4oc3RlcCkge1xuICAgICAgICB2YXIgc3RlcEYgPSBzdGVwLmY7XG4gICAgICAgIHZhciBsZW5ndGggPSB0aGlzLl9vcGVuLmxlbmd0aDtcbiAgICAgICAgdmFyIGkgPSAwO1xuICAgICAgICBmb3IgKDsgaSA8IGxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICBpZiAoc3RlcEYgPD0gdGhpcy5fb3BlbltpXS5mKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gaW5zZXJ0IHRvIGluZGV4IGlcbiAgICAgICAgdGhpcy5fb3Blbi5zcGxpY2UoaSwgMCwgc3RlcCk7XG4gICAgfSxcblxuICAgIG1vdmVUb3dhcmQ6IGZ1bmN0aW9uIG1vdmVUb3dhcmQoc3RhcnQsIGZpbmlzaCkge1xuICAgICAgICB0aGlzLl9jbG9zZWQgPSBbXTtcbiAgICAgICAgdGhpcy5fb3BlbiA9IFtdO1xuICAgICAgICB2YXIgcGF0aHMgPSBbXTtcblxuICAgICAgICAvLyBjYy5sb2coJ2ZpbmQgc3RhcnQ6ICcgKyBzdGFydCArICcgdG86ICcgKyBmaW5pc2gpO1xuICAgICAgICB0aGlzLl9vcGVuLnB1c2gobmV3IEFTdGFyU3RlcChzdGFydCkpO1xuICAgICAgICB2YXIgcGF0aEZvdW5kID0gZmFsc2U7XG4gICAgICAgIGRvIHtcbiAgICAgICAgICAgIC8vIGNjLmxvZygnPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0nKTtcbiAgICAgICAgICAgIHZhciBjdXJyZW50U3RlcCA9IHRoaXMuX29wZW4uc2hpZnQoKTtcbiAgICAgICAgICAgIC8vIGNjLmxvZygnY3VycmVudFN0ZXA6ICcgKyBjdXJyZW50U3RlcCk7XG5cbiAgICAgICAgICAgIHRoaXMuX2Nsb3NlZC5wdXNoKGN1cnJlbnRTdGVwKTtcblxuICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwLnBvc2l0aW9uLmVxdWFscyhmaW5pc2gpKSB7XG4gICAgICAgICAgICAgICAgLy8gY2MubG9nKCdmaW5pc2ggOlAnKTtcbiAgICAgICAgICAgICAgICBwYXRoRm91bmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIHZhciB0bXBTdGVwID0gY3VycmVudFN0ZXA7XG4gICAgICAgICAgICAgICAgZG8ge1xuICAgICAgICAgICAgICAgICAgICBwYXRocy51bnNoaWZ0KHRtcFN0ZXAucG9zaXRpb24pO1xuICAgICAgICAgICAgICAgICAgICB0bXBTdGVwID0gdG1wU3RlcC5sYXN0O1xuICAgICAgICAgICAgICAgIH0gd2hpbGUgKHRtcFN0ZXAgIT09IG51bGwpO1xuXG4gICAgICAgICAgICAgICAgdGhpcy5fb3BlbiA9IFtdO1xuICAgICAgICAgICAgICAgIHRoaXMuX2Nsb3NlZCA9IFtdO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgYm9yZGVyUG9zaXRpb25zID0gdGhpcy5fYm9yZGVyTW92YWJsZVBvaW50cyhjdXJyZW50U3RlcC5wb3NpdGlvbik7XG5cbiAgICAgICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgYm9yZGVyUG9zaXRpb25zLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJvcmRlclBvc2l0aW9uID0gYm9yZGVyUG9zaXRpb25zW2ldO1xuICAgICAgICAgICAgICAgIC8vIGNjLmxvZygnY2hlY2s6ICcgKyBib3JkZXJQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgLy8gQ2hlY2sgaWYgdGhlIHN0ZXAgaXNuJ3QgYWxyZWFkeSBpbiB0aGUgY2xvc2VkIHNldFxuICAgICAgICAgICAgICAgIGlmICh0aGlzLl9pbmRleE9mU3RlcEFycmF5KGJvcmRlclBvc2l0aW9uLCB0aGlzLl9jbG9zZWQpICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNjLmxvZygnaGFkIGluIGNsb3NlZDogJyArIGJvcmRlclBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCdyZW1vdmUgY2hlY2sgcG9zaXRpb246ICcgKyBib3JkZXJQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgICAgIGJvcmRlclBvc2l0aW9ucy5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIGktLTtcbiAgICAgICAgICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIHN0ZXAgPSBuZXcgQVN0YXJTdGVwKGJvcmRlclBvc2l0aW9uKTtcbiAgICAgICAgICAgICAgICB2YXIgbW92ZUNvc3QgPSB0aGlzLl9jb3N0VG9Nb3ZlKGJvcmRlclBvc2l0aW9uLCBmaW5pc2gpO1xuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IHRoaXMuX2luZGV4T2ZTdGVwQXJyYXkoYm9yZGVyUG9zaXRpb24sIHRoaXMuX29wZW4pO1xuXG4gICAgICAgICAgICAgICAgaWYgKGluZGV4ID09IC0xKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXAubGFzdCA9IGN1cnJlbnRTdGVwO1xuICAgICAgICAgICAgICAgICAgICBzdGVwLmcgPSBjdXJyZW50U3RlcC5nICsgbW92ZUNvc3Q7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkaXN0YW5jZVBvaW50ID0gYm9yZGVyUG9zaXRpb24uc3ViKGZpbmlzaCk7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXAuaCA9IE1hdGguYWJzKGRpc3RhbmNlUG9pbnQueCkgKyBNYXRoLmFicyhkaXN0YW5jZVBvaW50LnkpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnNlcnRUb09wZW4oc3RlcCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCdoYWQgaW4gb3BlbjogJyArIHN0ZXAudG9TdHJpbmcoKSk7XG4gICAgICAgICAgICAgICAgICAgIHN0ZXAgPSB0aGlzLl9vcGVuW2luZGV4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGN1cnJlbnRTdGVwLmcgKyBtb3ZlQ29zdCA8IHN0ZXAuZykge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCdyZSBpbnNlcnQgaW50byBvcGVuOiAnICsgc3RlcC50b1N0cmluZygpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0ZXAuZyA9IGN1cnJlbnRTdGVwLmcgKyBtb3ZlQ29zdDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmUgaW5zZXJ0XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9vcGVuLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB0aGlzLl9pbnNlcnRUb09wZW4oc3RlcCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gd2hpbGUgKHRoaXMuX29wZW4ubGVuZ3RoID4gMCk7XG5cbiAgICAgICAgcmV0dXJuIHBhdGhzO1xuICAgIH0sXG5cbiAgICBfY29zdFRvTW92ZTogZnVuY3Rpb24gX2Nvc3RUb01vdmUocG9zaXRpb25MZWZ0LCBwb3NpdGlvblJpZ2h0KSB7XG4gICAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09IEFTdGFyTW92ZVR5cGUuRUlHSFRfRElSRUNUSU9OKSB7XG4gICAgICAgICAgICAvKipcclxuICAgICAgICAgICAgICogZGlhZ29uYWwgbGVuZ3RoOiAxLjQxIOKJiCBNYXRoLnNxcnQoeCAqIHggKyB5ICogeSlcclxuICAgICAgICAgICAgICogbGluZSBsZW5ndGg6IDFcclxuICAgICAgICAgICAgICogXHJcbiAgICAgICAgICAgICAqIGNvc3QgPSBsZW5ndGggKiAxMFxyXG4gICAgICAgICAgICAgKiBkaWFnb25hbCBjb3N0ID0gMTQg4omIIDE0LjFcclxuICAgICAgICAgICAgICogY29zdCBsaW5lID0gMTAgPSAxICogMTBcclxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICByZXR1cm4gcG9zaXRpb25MZWZ0LnggIT0gcG9zaXRpb25SaWdodC54ICYmIHBvc2l0aW9uTGVmdC55ICE9IHBvc2l0aW9uUmlnaHQueSA/IDE0IDogMTA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gMTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfYm9yZGVyTW92YWJsZVBvaW50czogZnVuY3Rpb24gX2JvcmRlck1vdmFibGVQb2ludHMocG9zaXRpb24pIHtcbiAgICAgICAgdmFyIHJlc3VsdHMgPSBbXTtcbiAgICAgICAgdmFyIGhhc1RvcCA9IGZhbHNlO1xuICAgICAgICB2YXIgaGFzQm90dG9tID0gZmFsc2U7XG4gICAgICAgIHZhciBoYXNMZWZ0ID0gZmFsc2U7XG4gICAgICAgIHZhciBoYXNSaWdodCA9IGZhbHNlO1xuXG4gICAgICAgIC8vIHRvcFxuICAgICAgICB2YXIgdG9wID0gY2MucChwb3NpdGlvbi54LCBwb3NpdGlvbi55IC0gMSk7XG4gICAgICAgIGlmICh0aGlzLl9sYXllckJhcnJpZXIuZ2V0VGlsZUdJREF0KHRvcCkgPT09IDApIHtcbiAgICAgICAgICAgIC8vIGNjLmxvZygndG9wOiAnICsgdG9wKTtcbiAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0b3ApO1xuICAgICAgICAgICAgaGFzVG9wID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyBib3R0b21cbiAgICAgICAgdmFyIGJvdHRvbSA9IGNjLnAocG9zaXRpb24ueCwgcG9zaXRpb24ueSArIDEpO1xuICAgICAgICBpZiAodGhpcy5fbGF5ZXJCYXJyaWVyLmdldFRpbGVHSURBdChib3R0b20pID09PSAwKSB7XG4gICAgICAgICAgICAvLyBjYy5sb2coJ2JvdHRvbTogJyArIGJvdHRvbSk7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2goYm90dG9tKTtcbiAgICAgICAgICAgIGhhc0JvdHRvbSA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgICAgLy8gbGVmdFxuICAgICAgICB2YXIgbGVmdCA9IGNjLnAocG9zaXRpb24ueCAtIDEsIHBvc2l0aW9uLnkpO1xuICAgICAgICBpZiAodGhpcy5fbGF5ZXJCYXJyaWVyLmdldFRpbGVHSURBdChsZWZ0KSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gY2MubG9nKCdsZWZ0OiAnICsgbGVmdCk7XG4gICAgICAgICAgICByZXN1bHRzLnB1c2gobGVmdCk7XG4gICAgICAgICAgICBoYXNMZWZ0ID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgICAgICAvLyByaWdodFxuICAgICAgICB2YXIgcmlnaHQgPSBjYy5wKHBvc2l0aW9uLnggKyAxLCBwb3NpdGlvbi55KTtcbiAgICAgICAgaWYgKHRoaXMuX2xheWVyQmFycmllci5nZXRUaWxlR0lEQXQocmlnaHQpID09PSAwKSB7XG4gICAgICAgICAgICAvLyBjYy5sb2coJ3JpZ2h0OiAnICsgcmlnaHQpO1xuICAgICAgICAgICAgcmVzdWx0cy5wdXNoKHJpZ2h0KTtcbiAgICAgICAgICAgIGhhc1JpZ2h0ID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICh0aGlzLm1vdmVUeXBlID09IEFTdGFyTW92ZVR5cGUuRUlHSFRfRElSRUNUSU9OKSB7XG4gICAgICAgICAgICAvLyBUb3AgTGVmdFxuICAgICAgICAgICAgdmFyIHRvcExlZnQgPSBjYy5wKHBvc2l0aW9uLnggLSAxLCBwb3NpdGlvbi55IC0gMSk7XG4gICAgICAgICAgICBpZiAoaGFzVG9wICYmIGhhc0xlZnQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGF5ZXJCYXJyaWVyLmdldFRpbGVHSURBdCh0b3BMZWZ0KSA9PT0gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjYy5sb2coJ3RvcCBsZWZ0OiAnICsgdG9wTGVmdCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0b3BMZWZ0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBUb3AgUmlnaHRcbiAgICAgICAgICAgIHZhciB0b3BSaWdodCA9IGNjLnAocG9zaXRpb24ueCArIDEsIHBvc2l0aW9uLnkgLSAxKTtcbiAgICAgICAgICAgIGlmIChoYXNUb3AgJiYgaGFzUmlnaHQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGF5ZXJCYXJyaWVyLmdldFRpbGVHSURBdCh0b3BSaWdodCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCd0b3AgcmlnaHQ6ICcgKyB0b3BSaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaCh0b3BSaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gQm90dG9tIExlZnRcbiAgICAgICAgICAgIHZhciBib3R0b21MZWZ0ID0gY2MucChwb3NpdGlvbi54IC0gMSwgcG9zaXRpb24ueSArIDEpO1xuICAgICAgICAgICAgaWYgKGhhc0JvdHRvbSAmJiBoYXNMZWZ0KSB7XG4gICAgICAgICAgICAgICAgaWYgKHRoaXMuX2xheWVyQmFycmllci5nZXRUaWxlR0lEQXQoYm90dG9tTGVmdCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCdidHRvbSBsZWZ0OiAnICsgYm90dG9tTGVmdCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChib3R0b21MZWZ0KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBCb3R0b20gUmlnaHRcbiAgICAgICAgICAgIHZhciBib3R0b21SaWdodCA9IGNjLnAocG9zaXRpb24ueCArIDEsIHBvc2l0aW9uLnkgKyAxKTtcbiAgICAgICAgICAgIGlmIChoYXNCb3R0b20gJiYgaGFzUmlnaHQpIHtcbiAgICAgICAgICAgICAgICBpZiAodGhpcy5fbGF5ZXJCYXJyaWVyLmdldFRpbGVHSURBdChib3R0b21SaWdodCkgPT09IDApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY2MubG9nKCd0b3AgcmlnaHQ6ICcgKyBib3R0b21SaWdodCk7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdHMucHVzaChib3R0b21SaWdodCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHRzO1xuICAgIH1cbn0pO1xuXG5jYy5fUkZwb3AoKTsiLCJcInVzZSBzdHJpY3RcIjtcbmNjLl9SRnB1c2gobW9kdWxlLCAnNjU0YjVlaVBmdEhjYjZGTy9YbFk3cWsnLCAnQXV0aG9yRm9vdGVyJyk7XG4vLyBTY3JpcHRcXEF1dGhvckZvb3Rlci5qc1xuXG52YXIgZ2l0SHViVXNlciA9ICdsdWNreXRpYW55aXlhbic7XG52YXIgZ2l0SHViUmVwb05hbWUgPSAnQS1zdGFyJztcbnZhciBnaXRIdWJQcmVmaXggPSAnaHR0cHM6Ly9naXRodWIuY29tLyc7XG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG4gICAgb3BlbkF1dGhvcjogZnVuY3Rpb24gb3BlbkF1dGhvcigpIHtcbiAgICAgICAgY2Muc3lzLm9wZW5VUkwodGhpcy5fYXBwZW5kU3ViUGF0aChnaXRIdWJQcmVmaXgsIGdpdEh1YlVzZXIpKTtcbiAgICB9LFxuXG4gICAgb3BlblJlcG86IGZ1bmN0aW9uIG9wZW5SZXBvKCkge1xuICAgICAgICBjYy5zeXMub3BlblVSTCh0aGlzLl9hcHBlbmRTdWJQYXRoKGdpdEh1YlByZWZpeCwgZ2l0SHViVXNlciwgZ2l0SHViUmVwb05hbWUpKTtcbiAgICB9LFxuXG4gICAgX2FwcGVuZFN1YlBhdGg6IGZ1bmN0aW9uIF9hcHBlbmRTdWJQYXRoKHVybCwgc3ViUGF0aHMpIHtcbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICByZXR1cm4gdXJsID0gdXJsW3VybC5sZW5ndGggLSAxXSA9PT0gJy8nID8gdXJsIDogdXJsICsgJy8nO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXN1bHQgPSB1cmw7XG4gICAgICAgIGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICByZXN1bHQgKz0gYXJndW1lbnRzW2ldICsgJy8nO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyIsIlwidXNlIHN0cmljdFwiO1xuY2MuX1JGcHVzaChtb2R1bGUsICdjMmU5MmlyWHUxUENZWVhJUnVCcDNoUicsICdUZXN0TWFwJyk7XG4vLyBTY3JpcHRcXFRlc3RNYXAuanNcblxudmFyIEFTdGFyID0gcmVxdWlyZSgnQVN0YXInKTtcbnZhciBBU3Rhck1vdmVUeXBlID0gcmVxdWlyZSgnQVN0YXJNb3ZlVHlwZScpO1xuXG5jYy5DbGFzcyh7XG4gICAgJ2V4dGVuZHMnOiBjYy5Db21wb25lbnQsXG4gICAgcHJvcGVydGllczoge1xuICAgICAgICBmbG9vckxheWVyTmFtZTogJ2Zsb29yJyxcbiAgICAgICAgcGxheWVyU3RhcnQ6IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogbmV3IGNjLnYyKClcbiAgICAgICAgfSxcbiAgICAgICAgc3RlcE9mRHVyYXRpb246IHtcbiAgICAgICAgICAgICdkZWZhdWx0JzogMC4yLFxuICAgICAgICAgICAgdHlwZTogY2MuRmxvYXRcbiAgICAgICAgfSxcbiAgICAgICAgZW5hYmxlZERlYnVnRHJhdzogdHJ1ZVxuICAgIH0sXG5cbiAgICBlZGl0b3I6IHtcbiAgICAgICAgcmVxdWlyZUNvbXBvbmVudDogQVN0YXJcbiAgICB9LFxuXG4gICAgb25Mb2FkOiBmdW5jdGlvbiBvbkxvYWQoKSB7XG4gICAgICAgIHRoaXMuX2RlYnVnVGlsZUNvbG9yID0gY2MuY29sb3IoMjU1LCAxODcsIDI1NSwgMjU1KTtcbiAgICAgICAgdGhpcy5fcGF0aHMgPSBbXTtcbiAgICB9LFxuXG4gICAgb25Nb2RlU3dpdGNoQnV0dG9uQ2xpY2tlZDogZnVuY3Rpb24gb25Nb2RlU3dpdGNoQnV0dG9uQ2xpY2tlZChldmVudCkge1xuICAgICAgICB2YXIgbm9kZSA9IGV2ZW50LnRhcmdldDtcbiAgICAgICAgdmFyIHRpdGxlTGFiZWwgPSBub2RlLmdldENvbXBvbmVudEluQ2hpbGRyZW4oY2MuTGFiZWwpO1xuICAgICAgICBpZiAodGhpcy5fYVN0YXIubW92ZVR5cGUgPT09IEFTdGFyTW92ZVR5cGUuRk9VUl9ESVJFQ1RJT04pIHtcbiAgICAgICAgICAgIHRoaXMuX2FTdGFyLm1vdmVUeXBlID0gQVN0YXJNb3ZlVHlwZS5FSUdIVF9ESVJFQ1RJT047XG4gICAgICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9ICc4IGRpcmVjdGlvbic7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB0aGlzLl9hU3Rhci5tb3ZlVHlwZSA9IEFTdGFyTW92ZVR5cGUuRk9VUl9ESVJFQ1RJT047XG4gICAgICAgICAgICB0aXRsZUxhYmVsLnN0cmluZyA9ICc0IGRpcmVjdGlvbic7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgc3RhcnQ6IGZ1bmN0aW9uIHN0YXJ0KCkge1xuICAgICAgICB0aGlzLl9wbGF5ZXIgPSB0aGlzLm5vZGUuZ2V0Q2hpbGRCeU5hbWUoJ3BsYXllcicpO1xuICAgICAgICB0aGlzLl9hU3RhciA9IHRoaXMuZ2V0Q29tcG9uZW50KEFTdGFyKTtcbiAgICAgICAgdGhpcy5fdGlsZWRNYXAgPSB0aGlzLmdldENvbXBvbmVudChjYy5UaWxlZE1hcCk7XG4gICAgICAgIHRoaXMuX2xheWVyRmxvb3IgPSB0aGlzLl90aWxlZE1hcC5nZXRMYXllcih0aGlzLmZsb29yTGF5ZXJOYW1lKTtcblxuICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLl90aWxlZE1hcC5nZXRUaWxlU2l6ZSgpO1xuICAgICAgICB2YXIgcGxheWVyU3RhcnRQb3NpdGlvbiA9IHRoaXMuX2xheWVyRmxvb3IuZ2V0UG9zaXRpb25BdCh0aGlzLnBsYXllclN0YXJ0KTtcbiAgICAgICAgcGxheWVyU3RhcnRQb3NpdGlvbi54ICs9IHRpbGVTaXplLndpZHRoIC8gMjtcbiAgICAgICAgcGxheWVyU3RhcnRQb3NpdGlvbi55ICs9IHRpbGVTaXplLndpZHRoIC8gMjtcbiAgICAgICAgdGhpcy5fcGxheWVyLnNldFBvc2l0aW9uKHBsYXllclN0YXJ0UG9zaXRpb24pO1xuXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgY2MuZXZlbnRNYW5hZ2VyLmFkZExpc3RlbmVyKHtcbiAgICAgICAgICAgIGV2ZW50OiBjYy5FdmVudExpc3RlbmVyLlRPVUNIX09ORV9CWV9PTkUsXG4gICAgICAgICAgICBvblRvdWNoQmVnYW46IGZ1bmN0aW9uIG9uVG91Y2hCZWdhbih0b3VjaCwgZXZlbnQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdG91Y2hMb2NhdGlvbiA9IHRvdWNoLmdldExvY2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgdmFyIGxvY2F0aW9uID0gc2VsZi5ub2RlLmNvbnZlcnRUb05vZGVTcGFjZUFSKHRvdWNoTG9jYXRpb24pO1xuICAgICAgICAgICAgICAgIHZhciB0YXJnZXRUaWxlUG9zaXRpb24gPSBzZWxmLl90aWxlUG9zaXN0aW9uKGxvY2F0aW9uKTtcbiAgICAgICAgICAgICAgICB2YXIgdGlsZUxheWVyU2l6ZSA9IHNlbGYuX2xheWVyRmxvb3IuZ2V0TGF5ZXJTaXplKCk7XG4gICAgICAgICAgICAgICAgaWYgKHRhcmdldFRpbGVQb3NpdGlvbi54IDwgMCB8fCB0YXJnZXRUaWxlUG9zaXRpb24ueCA+PSB0aWxlTGF5ZXJTaXplLndpZHRoIHx8IHRhcmdldFRpbGVQb3NpdGlvbi55IDwgMCB8fCB0YXJnZXRUaWxlUG9zaXRpb24ueSA+PSB0aWxlTGF5ZXJTaXplLmhlaWdodCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllclBvc2l0aW9uID0gc2VsZi5fcGxheWVyLmdldFBvc2l0aW9uKCk7XG4gICAgICAgICAgICAgICAgY2MubG9nKCdwbGF5ZXIgcG9zaXRpb246ICcgKyBwbGF5ZXJQb3NpdGlvbik7XG4gICAgICAgICAgICAgICAgdmFyIHBsYXllclRpbGVQb3NpdGlvbiA9IHNlbGYuX3RpbGVQb3Npc3Rpb24ocGxheWVyUG9zaXRpb24pO1xuICAgICAgICAgICAgICAgIGNjLmxvZygncGxheWVyIHRpbGUgcG9zaXRpb246ICcgKyBwbGF5ZXJUaWxlUG9zaXRpb24pO1xuXG4gICAgICAgICAgICAgICAgc2VsZi5fbW92ZShwbGF5ZXJUaWxlUG9zaXRpb24sIHRhcmdldFRpbGVQb3NpdGlvbik7XG5cbiAgICAgICAgICAgICAgICBzZWxmLl9kZWJ1Z0RyYXcodGFyZ2V0VGlsZVBvc2l0aW9uLCBjYy5Db2xvci5SRUQpO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sIHNlbGYubm9kZSk7XG4gICAgfSxcblxuICAgIF9tb3ZlOiBmdW5jdGlvbiBfbW92ZShzdGFydCwgZmluaXNoKSB7XG4gICAgICAgIHRoaXMuX3BsYXllci5zdG9wQWxsQWN0aW9ucygpO1xuICAgICAgICBpZiAodGhpcy5lbmFibGVkRGVidWdEcmF3KSB7XG4gICAgICAgICAgICB0aGlzLl9jbGVhckRlYnVnQ29sb3IoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuX3BhdGhzID0gdGhpcy5fYVN0YXIubW92ZVRvd2FyZChzdGFydCwgZmluaXNoKTtcbiAgICAgICAgaWYgKHRoaXMuX3BhdGhzLmxlbmd0aCA8IDEpIHtcbiAgICAgICAgICAgIGNjLmxvZygnY2Fubm90IGZpbmQgcGF0aCcpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgdGhpcy5fcGF0aHMubGVuZ3RoOyArK2kpIHtcbiAgICAgICAgICAgIHRoaXMuX2RlYnVnRHJhdyh0aGlzLl9wYXRoc1tpXSwgdGhpcy5fZGVidWdUaWxlQ29sb3IsIGkpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBzZXF1ZW5jZSA9IFtdO1xuICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLl90aWxlZE1hcC5nZXRUaWxlU2l6ZSgpO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3BhdGhzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgYWN0aW9uUG9zaXRpb24gPSB0aGlzLl9sYXllckZsb29yLmdldFBvc2l0aW9uQXQodGhpcy5fcGF0aHNbaV0pO1xuICAgICAgICAgICAgYWN0aW9uUG9zaXRpb24ueCArPSB0aWxlU2l6ZS53aWR0aCAvIDI7XG4gICAgICAgICAgICBhY3Rpb25Qb3NpdGlvbi55ICs9IHRpbGVTaXplLndpZHRoIC8gMjtcbiAgICAgICAgICAgIHNlcXVlbmNlLnB1c2goY2MubW92ZVRvKHRoaXMuc3RlcE9mRHVyYXRpb24sIGFjdGlvblBvc2l0aW9uKSk7XG4gICAgICAgIH1cbiAgICAgICAgLy8gaWYgKHRoaXMuZW5hYmxlZERlYnVnRHJhdykge1xuICAgICAgICAvLyAgICAgbGV0IHJlc2V0Q29sb3JDYWxsYmFjayA9IGNjLmNhbGxGdW5jKHRoaXMuX2NsZWFyRGVidWdDb2xvciwgdGhpcyk7XG4gICAgICAgIC8vICAgICBzZXF1ZW5jZS5wdXNoKHJlc2V0Q29sb3JDYWxsYmFjayk7XG4gICAgICAgIC8vIH1cbiAgICAgICAgdGhpcy5fcGxheWVyLnJ1bkFjdGlvbihjYy5zZXF1ZW5jZShzZXF1ZW5jZSkpO1xuICAgIH0sXG5cbiAgICBfY2xlYXJEZWJ1Z0NvbG9yOiBmdW5jdGlvbiBfY2xlYXJEZWJ1Z0NvbG9yKHNlbmRlcikge1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMuX3BhdGhzLmxlbmd0aDsgKytpKSB7XG4gICAgICAgICAgICB2YXIgdG91Y2hUaWxlID0gdGhpcy5fbGF5ZXJGbG9vci5nZXRUaWxlQXQodGhpcy5fcGF0aHNbaV0pO1xuICAgICAgICAgICAgdG91Y2hUaWxlLmNvbG9yID0gY2MuQ29sb3IuV0hJVEU7XG4gICAgICAgICAgICB0b3VjaFRpbGUucmVtb3ZlQWxsQ2hpbGRyZW4oKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfZGVidWdEcmF3OiBmdW5jdGlvbiBfZGVidWdEcmF3KHRpbGVQb3NpdGlvbiwgY29sb3IsIGluZGV4KSB7XG4gICAgICAgIGlmICghdGhpcy5lbmFibGVkRGVidWdEcmF3KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgdG91Y2hUaWxlID0gdGhpcy5fbGF5ZXJGbG9vci5nZXRUaWxlQXQodGlsZVBvc2l0aW9uKTtcbiAgICAgICAgdG91Y2hUaWxlLmNvbG9yID0gY29sb3I7XG5cbiAgICAgICAgaWYgKGluZGV4ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgICAgICAgIC8vIGxldCBsYWJlbCA9IG5ldyBjYy5MYWJlbFRURihpbmRleC50b1N0cmluZygpLCAnQXJpYWwnLCAxMik7XG4gICAgICAgICAgICAvLyBsYWJlbC5zZXRQb3NpdGlvbihjYy5wKHRvdWNoVGlsZS53aWR0aCAvIDIsIHRvdWNoVGlsZS5oZWlnaHQgLyAyKSk7XG4gICAgICAgICAgICAvLyB0b3VjaFRpbGUuYWRkQ2hpbGQobGFiZWwsIDEwKTtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBfdGlsZVBvc2lzdGlvbjogZnVuY3Rpb24gX3RpbGVQb3Npc3Rpb24ocGl4ZWxQb3NpdGlvbikge1xuICAgICAgICB2YXIgbWFwU2l6ZSA9IHRoaXMubm9kZS5nZXRDb250ZW50U2l6ZSgpO1xuICAgICAgICB2YXIgdGlsZVNpemUgPSB0aGlzLl90aWxlZE1hcC5nZXRUaWxlU2l6ZSgpO1xuICAgICAgICB2YXIgeCA9IE1hdGguZmxvb3IocGl4ZWxQb3NpdGlvbi54IC8gdGlsZVNpemUud2lkdGgpO1xuICAgICAgICB2YXIgeSA9IE1hdGguZmxvb3IoKG1hcFNpemUuaGVpZ2h0IC0gcGl4ZWxQb3NpdGlvbi55KSAvIHRpbGVTaXplLmhlaWdodCk7XG5cbiAgICAgICAgcmV0dXJuIGNjLnAoeCwgeSk7XG4gICAgfVxufSk7XG5cbmNjLl9SRnBvcCgpOyJdfQ==
