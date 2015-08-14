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

    this._info = {};
    this.data = [];
};

reader.prototype = new Object();
reader.prototype.constructor = reader;


reader.prototype.getData = function(){
    throw new Error("Method getData is abstract! Should be described!");
};

reader.prototype.info = function(){
    throw new Error("Method info is abstract! Should be described!");
};

reader.prototype.readData = function(){
    throw new Error("Method readData is abstract! Should be described!");
};

reader.prototype.cache = function(memory){
    memory.set("reader", {
        "data": this.data,
        "info": this.info()
    });
};

reader.prototype.restore = function(memory){
    var _fromStorage = memory.get("reader");
    this.data = _fromStorage.data;
    this._info = _fromStorage.info;
};

module.exports = reader;