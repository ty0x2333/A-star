var AStar = require('AStar');
var AStarMoveType = require('AStarMoveType');

cc.Class({
    extends: cc.Component,
    properties: {
        floorLayerName: 'floor',
        playerStart: {
            default: new cc.v2()
        },
        stepOfDuration : {
            default: 0.2,
            type: cc.Float
        },
        enabledDebugDraw: true
    },
    
    editor: {
        requireComponent: AStar
    },
    
    onLoad: function() {
        this._debugTileColor = cc.color(255, 187, 255, 255);
        this._paths = [];
    },
    
    onModeSwitchButtonClicked: function (event) {
        let node = event.target;
        let titleLabel = node.getComponentInChildren(cc.Label);
        if (this._aStar.moveType === AStarMoveType.FOUR_DIRECTION) {
            this._aStar.moveType = AStarMoveType.EIGHT_DIRECTION;
            titleLabel.string = '8 direction';
        } else {
            this._aStar.moveType = AStarMoveType.FOUR_DIRECTION;
            titleLabel.string = '4 direction';
        }
    },
    
    start: function () {
        this._player = this.node.getChildByName('player');
        this._aStar = this.getComponent(AStar);
        this._tiledMap = this.getComponent(cc.TiledMap);
        this._layerFloor = this._tiledMap.getLayer(this.floorLayerName);
        
        
        let tileSize = this._tiledMap.getTileSize();
        let playerStartPosition = this._layerFloor.getPositionAt(this.playerStart);
        playerStartPosition.x += tileSize.width / 2;
        playerStartPosition.y += tileSize.width / 2;
        this._player.setPosition(playerStartPosition);
        
        let self = this;
        self._tiledMap.node.on(cc.Node.EventType.TOUCH_END, function (event) {
            var touch = event.getTouches()[0];
            let touchLocation = touch.getLocation();
            let location = self.node.convertToNodeSpaceAR(touchLocation);
            let targetTilePosition = self._tilePosistion(location);
            let tileLayerSize = self._layerFloor.getLayerSize();
            if (targetTilePosition.x < 0 || targetTilePosition.x >= tileLayerSize.width || 
            targetTilePosition.y < 0 || targetTilePosition.y >= tileLayerSize.height) {
                return true;
            }
            let playerPosition = self._player.getPosition();
            cc.log('player position: ' + playerPosition);
            let playerTilePosition = self._tilePosistion(playerPosition);
            cc.log('player tile position: ' + playerTilePosition);
            
            self._move(playerTilePosition, targetTilePosition);
            
            self._debugDraw(targetTilePosition, cc.Color.RED);
            
            return true;
        }, self.node);
    },
    
    _move: function(start, finish) {
        this._player.stopAllActions();
        if (this.enabledDebugDraw) {
            this._clearDebugColor();
        }
        
        this._paths = this._aStar.moveToward(start, finish);
        if (this._paths.length < 1) {
            cc.log('cannot find path');
            return;
        }
        for (let i = 0; i < this._paths.length; ++i) {
            this._debugDraw(this._paths[i], this._debugTileColor, i);
        }
        let sequence = [];
        let tileSize = this._tiledMap.getTileSize();
        for (let i = 0; i < this._paths.length; ++i) {
            let actionPosition = this._layerFloor.getPositionAt(this._paths[i]);
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
    
    _clearDebugColor: function(sender) {
        for (let i = 0; i < this._paths.length; ++i) {
            let position = this._paths[i];
            let touchTile = this._layerFloor.getTiledTileAt(position.x, position.y, true);
            touchTile.node.color = cc.Color.WHITE;
            // touchTile.removeAllChildren();
        }
    },
    
    _debugDraw: function(tilePosition, color, index) {
        if (!this.enabledDebugDraw) {
            return;
        }
        
        let touchTile = this._layerFloor.getTiledTileAt(tilePosition.x, tilePosition.y, true);
        cc.log(touchTile)
        touchTile.node.color = color;
        
        if (index !== undefined) {
            // let label = new cc.LabelTTF(index.toString(), 'Arial', 12);
            // label.setPosition(cc.v2(touchTile.width / 2, touchTile.height / 2));
            // touchTile.addChild(label, 10);
        }
    },
    
    _tilePosistion: function(pixelPosition) {
        let mapSize = this.node.getContentSize();
        let tileSize = this._tiledMap.getTileSize();
        let x = Math.floor(pixelPosition.x / tileSize.width);
        let y = Math.floor((mapSize.height - pixelPosition.y) / tileSize.height);

        return cc.v2(x, y);
    },
});
