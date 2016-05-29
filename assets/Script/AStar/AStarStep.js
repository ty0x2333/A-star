var AStarStep = cc.Class({
    properties: () => ({
        g: {
            default: 0,
            type: cc.Integer
        },
        h: {
            default: 0,
            type: cc.Integer
        },
        f: {
            get: function() {
                return this.g + this.h;
            }
        },
        position: {
            default: new cc.Vec2()
        },
        last: {
            default: null,
            type: AStarStep,
            serializable: false
        }
    }),
    
    ctor: function () {
        if (arguments.length > 0 && arguments[0] instanceof cc.Vec2) {
            this.position = arguments[0];
        }
    },
    
    equalTo(other) {
        if (other instanceof AStarStep) {
            return this.position.equals(other.position);
        }
        return false;
    },
    
    toString: function () {
        return '(' + 'position: ' + this.position + ' g: ' + this.g + ' h: ' + this.h + ' f: ' + this.f + ')';
    }

});

module.exports = AStarStep;