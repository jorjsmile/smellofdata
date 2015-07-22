/**
 * Created by george on 7/15/15.
 */


function reader(file, options){

    var _file = file || null,
        _opt = options || {};

    this.getFile = function(){
        return _file;
    };

    this.getOption = function(name){
        if(name === undefined)
            return _opt;
        else
            return _opt[name];
    };


    this.data = [];
    this.longestRowLength = 0;
};

reader.prototype = new Object();
reader.prototype.constructor = reader;


reader.prototype.getData = function(){
    throw "Method is abstract! Should be described!";
};



module.exports = reader;