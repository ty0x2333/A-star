var AStarStep = require('AStarStep');
var AStarMoveType = require('AStarMoveType');

cc.Class({
    extends: cc.Component,

    properties: {
        barrierLayerName: 'barrier',
        moveType: {
            default: AStarMoveType.FOUR_DIRECTION,
            type: AStarMoveType
        }
    },
    
    editor: {
        requireComponent: cc.TiledMap
    },

    onLoad: function () {
        this._open = [];
        this._closed = [];
    },
    
    start: function() {
        this._tiledMap = this.getComponent(cc.TiledMap);
        this._layerBarrier = this._tiledMap.getLayer(this.barrierLayerName);
    },
    
    _indexOfStepArray: function(value, stepArray) {
        for (let i = 0; i < stepArray.length; ++i) {
            if (value.equals(stepArray[i].position)) {
                return i;
            }
        }
        return -1;
    },
    
    _insertToOpen: function(step) {
        let stepF = step.f;
        let length = this._open.length;
        let i = 0;
        for (; i < length; ++i) {
            if (stepF <= this._open[i].f) {
                break;
            }
        }
        // insert to index i
        this._open.splice(i, 0, step);
    },
    
    moveToward: function(start, finish) {
        this._closed = [];
        this._open = [];
        let paths = [];
        
        // cc.log('find start: ' + start + ' to: ' + finish);
        this._open.push(new AStarStep(start));
        let pathFound = false;
        do {
            // cc.log('==============================================================');
            let currentStep = this._open.shift();
            // cc.log('currentStep: ' + currentStep);
            
            this._closed.push(currentStep);
            
            if (currentStep.position.equals(finish)) {
                // cc.log('finish :P');
                pathFound = true;
                let tmpStep = currentStep;
                do {  
                    paths.unshift(tmpStep.position);
                    tmpStep = tmpStep.last;
                } while (tmpStep !== null);
                
                this._open = [];
                this._closed = [];
                break;
            }
            
            let borderPositions = this._borderMovablePoints(currentStep.position);
            
            for (let i = 0; i < borderPositions.length; ++i) {
                let borderPosition = borderPositions[i];
                // cc.log('check: ' + borderPosition);
                // Check if the step isn't already in the closed set
                if (this._indexOfStepArray(borderPosition, this._closed) != -1) {
                    // cc.log('had in closed: ' + borderPosition);
                    // cc.log('remove check position: ' + borderPosition);
                    borderPositions.splice(i, 1);
                    i--;
                    continue;
                }
                
                let step = new AStarStep(borderPosition);
                let moveCost = this._costToMove(borderPosition, finish)
                let index = this._indexOfStepArray(borderPosition, this._open);
                
                if (index == -1) {
                    step.last = currentStep;
                    step.g = currentStep.g + moveCost;
                    let distancePoint = borderPosition.sub(finish);
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
    
    _costToMove(positionLeft, positionRight) {
        if (this.moveType == AStarMoveType.EIGHT_DIRECTION) {
            /**
             * diagonal length: 1.41 ≈ Math.sqrt(x * x + y * y)
             * line length: 1
             * 
             * cost = length * 10
             * diagonal cost = 14 ≈ 14.1
             * cost line = 10 = 1 * 10
             */
            return (positionLeft.x != positionRight.x) && (positionLeft.y != positionRight.y) ? 14 : 10;
        } else {
            return 1;
        }
    },
    
    _borderMovablePoints: function(position) {
        var results = [];
        let hasTop = false;
        let hasBottom = false;
        let hasLeft = false;
        let hasRight = false;
        
        // top
        let top = cc.v2(position.x, position.y - 1);
        if (this._layerBarrier.getTileGIDAt(top) === 0) {
            // cc.log('top: ' + top);
            results.push(top);
            hasTop = true;
        }
        // bottom
        let bottom = cc.v2(position.x, position.y + 1);
        if (this._layerBarrier.getTileGIDAt(bottom) === 0) {
            // cc.log('bottom: ' + bottom);
            results.push(bottom);
            hasBottom = true;
        }
        // left
        let left = cc.v2(position.x - 1, position.y);
        if (this._layerBarrier.getTileGIDAt(left) === 0) {
            // cc.log('left: ' + left);
            results.push(left);
            hasLeft = true;
        }
        // right
        let right = cc.v2(position.x + 1, position.y);
        if (this._layerBarrier.getTileGIDAt(right) === 0) {
            // cc.log('right: ' + right);
            results.push(right);
            hasRight = true;
        }
        
        if (this.moveType == AStarMoveType.EIGHT_DIRECTION) {
            // Top Left
            let topLeft = cc.v2(position.x - 1, position.y - 1);
            if (hasTop && hasLeft) {
                if (this._layerBarrier.getTileGIDAt(topLeft) === 0) {
                    // cc.log('top left: ' + topLeft);
                    results.push(topLeft);
                }
            }
            // Top Right
            let topRight = cc.v2(position.x + 1, position.y - 1);
            if (hasTop && hasRight) {
                if (this._layerBarrier.getTileGIDAt(topRight) === 0) {
                    // cc.log('top right: ' + topRight);
                    results.push(topRight);
                }
            }
            // Bottom Left
            let bottomLeft = cc.v2(position.x - 1, position.y + 1);
            if (hasBottom && hasLeft) {
                if (this._layerBarrier.getTileGIDAt(bottomLeft) === 0) {
                    // cc.log('bttom left: ' + bottomLeft);
                    results.push(bottomLeft);
                }
            }
            // Bottom Right
            let bottomRight = cc.v2(position.x + 1, position.y + 1);
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
