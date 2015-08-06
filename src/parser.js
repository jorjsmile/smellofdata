/**
 * Created by george on 7/7/15.
 */

var mime = require("mime"),
    mapReduce = require("./mapReduce");

function Parser(file, confReads){
    var _file = file,
        _confReads = confReads || {};
        _mime = null,
        _available = {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "xlsx",
            "application/vnd.ms-excel" : "xlsx",
            "application/pdf" : "pdf"
        },
        _module = null,
        _this = this,
        _fileDetected = false;

    this.getFile = function(){
        return _file;
    };

    this.getConfReads = function(name){
        return _confReads[name];
    };
    
    
    this.isFileDetected = function(){
        return _fileDetected;
    };

    this.getModuleName = function(){
        if(_available[_mime] == undefined)
            console.log("Type not supported", _mime);
        return _available[_mime];
    };

    this.getModule = function(){
        return _module;
    };

    var _loadModule = function(){
        var modName = _this.getModuleName();
            object = require("./data_readers/"+modName);
        _module = new object(_this.getFile(), _this.getConfReads( modName ));
    };

    var _defineMime = function(){
        //console.log(_file, _file && _file == null);
        if(_file && _file !== null)
            _mime = mime.lookup(_file);
    };


    _defineMime();
    if(this.getModuleName()){
        _loadModule();
        _fileDetected = true;
    }

}

Parser.prototype = new Object();
Parser.prototype.constructor = Parser;

/**
 *
 * @returns reader reader object (xlsxReader, pdfReader, xmlReader, etc. )
 */
Parser.prototype.getReader = function(){
    return this.getModule();
};

Parser.prototype.process = function(done){
    if(!this.isFileDetected()) return done({"message" : "File Not Detected, nothing to process"}, null);

    var module = this.getModule();
    module.readData(done);
};

Parser.prototype.mapReduce = function(data, map, reduce, log){
    var data = data || this.getReader().data,
        map = map || function(key, value){
            return emit(key, value);
            },
        reduce = reduce || function(key, prev, curr){
                return curr;
            },
        log = log || false;

    var obj = new mapReduce(data, map, reduce),
        data = obj.getResult();

    output = data == false?
            obj.getError() :
            output = data;

    if(log) output.log = obj.getLog();

    return output;
};

module.exports = Parser;