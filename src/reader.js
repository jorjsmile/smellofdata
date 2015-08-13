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
};

reader.prototype = new Object();
reader.prototype.constructor = reader;


reader.prototype.getData = function(){
    throw "Method getData is abstract! Should be described!";
};

reader.prototype.info = function(){
    throw "Method info is abstract! Should be described!";
};

reader.prototype.readData = function(){
    throw "Method readData is abstract! Should be described!";
};

reader.prototype.cache = function(memory){
    memory.set("readerData", this.data);
};

reader.prototype.restore = function(memory){
    this.data = memory.get("readerData");
};

module.exports = reader;