/**
 * Created by george on 7/7/15.
 */

var mime = require("mime"),
    mapReduce = require("./mapReduce"),
    Session = require("./session").session;

function Parser(file, confReads){
    var _file = file,
        _confReads = confReads || {};
        _available = {
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" : "xlsx",
            "application/vnd.ms-excel" : "xlsx",
            "application/pdf" : "pdf"
        },
        _module = null,
        _this = this;

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
        var mime = _getMime();
        if(_available[mime] == undefined)
            console.log("Type not supported", mime);
        return _available[mime];
    };

    this.getModule = function(){
        return _module;
    };

    var _loadModule = function(name){
        var modName = name || _this.getModuleName();
            object = require("./data_readers/"+modName);

        _module = new object(_file, _this.getConfReads( modName ));
    };

    var _getMime = function(){
        return mime.lookup(_file);
    };


    if( typeof(_file) == "object" && _file instanceof Session){
        _loadModule(_file.get("parser").moduleName);
        _module.restore(_file);
    } //session
    else if ( typeof(_file) == "string"){
        _loadModule();
    } //file
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

Parser.prototype.getData = function(options){
    return this.getReader().getData(options);
};

Parser.prototype.process = function(done, session){
    var module = this.getModule(),
        _this = this;

    if(!module) return done({"message" : "File Not Detected, nothing to process"}, null);

    module.readData(function(){
        if(session && session instanceof Session){
            session.set("parser", {
                "moduleName" : _this.getModuleName()
            });

            module.cache(session);
        }


        done(null, module.info());
    });
};

Parser.prototype.mapReduce = function(options){
    var data = this.getReader().data,
        map = options.map || function(key, value){
            return emit(key, value);
            },
        reduce = options.reduce || function(key, prev, curr){
                return curr;
            };

    var obj = new mapReduce(data, map, reduce);

    return obj.getResult() || obj.getError();
};

module.exports = Parser;