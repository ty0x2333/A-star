let gitHubUser = 'ty0x2333';
let gitHubRepoName = 'A-star';
let gitHubPrefix = 'https://github.com/';
cc.Class({
    extends: cc.Component,
    openAuthor: function () {
        cc.sys.openURL(this._appendSubPath(gitHubPrefix, gitHubUser));
    },
    
    openRepo: function () {
        cc.sys.openURL(this._appendSubPath(gitHubPrefix, gitHubUser, gitHubRepoName));
    },
    
    _appendSubPath: function (url, subPaths) {
        if (arguments.length < 2) {
            return url = url[url.length - 1] === '/' ? url : url + '/';
        }
        let result = url;
        for (let i = 1; i < arguments.length; ++i) {
            result += arguments[i] + '/';
        }
        return result;
    }
});
