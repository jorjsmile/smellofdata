/**
 * Created by george on 7/13/15.
 */
var fs = require("fs"),
    esprima = require("esprima");


function generateName(l){
    var voc = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u",
                "v", "w", "x", "y", "z", "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P",
                "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
        l = l || 32,
        name = "";


    for(var i = 0; i < l; i++)
        name += voc[ parseInt(Math.random()* voc.length) ];

    return name;
};

function session(path){
    var _path = path || "sessions";
        _name = null,
        _session = {},
        _sessionString = "",
        _this = this;

    this.setName = function(name){
        _name=name;
        return this;
    };

    this.getPath = function(){ return _path; };

    this.getName = function(){ return _name; };

    this.getFilePath = function() { return __dirname + "/../"+_path+"/"+_name+".js"; };

    this.loadFile = function(){
        var filePath= this.getFilePath();
        _sessionString = fs.readFileSync(filePath)
                        .toString()
                        .replace(/(^module.exports=\{\n|\n\}\;$)/g,"");

        var resolveName = require.resolve(filePath);
        //console.log("cache", require.resolve(filePath), require.cache[require.resolve(filePath)]);
        delete require.cache[resolveName];
        require.cache[resolveName] = null;

        _session = require(filePath);
    }

    this.setSessionValue = function(name, value){
        var newSession = _sessionString,
            filePath =  this.getFilePath();

        if(!value) return;

        if(newSession != ""){
            var regReplace = new RegExp("^\'"+name+"\'.*?\n?$","m");
            newSession = newSession.replace(regReplace, "");
            newSession +=",\n";
            newSession = newSession.replace(/,\n,/, ",");
        }
        if(typeof(value) == "string"){
            if(value.indexOf("js:") === 0){
                value = value
                    .replace(/\/\/.*\n/g, "") //single line comments
                    .replace(/\/\*.*?\*\//g,"") //multiple line comments
                    .replace(/\n/g, ""); //new lines;
                newSession += "'"+name+"':"+value.replace(/^js\:/,"");
            }
            else
                newSession += "'"+name+"': '"+value.replace(/\'/,"\\'")+"'";
        }
        else
            newSession +=  "'"+name+"': " + JSON.stringify(value);



        newSession = newSession.replace(/\n{2,}/g, "\n");

        newSession = "module.exports={\n"+newSession+"\n};";
        //console.log(newSession);
        try{

            esprima.parse(newSession);

            fs.writeFileSync(filePath, newSession);
            this.loadFile();
            return true;
        }
        catch(e){ //catch possible esprima error
            console.log(e);
            return false;
        }
    };

    this.getSession = function(){ return _session; };

    //shortcut to setSessionValue
    this.set = function(name, value){ this.setSessionValue(name, value); return _this; };

    this.get = function(name){ return _session[name]; };
};

session.prototype = new Object();
session.prototype.constructor = session;

session.prototype.open = function(name){
    var path = this.getPath();
        name = name || null;

    if(name === null){
        do{
            name = generateName(32);
        }
        while(fs.exists(path+"/"+name));

        this.setName(name);
        var filePath=this.getFilePath();
        fs.writeFileSync(filePath, "module.exports={\n\n};");
    }
    else
        this.setName(name);


    this.loadFile();
    return name;
};

session.prototype.destroy = function(name, callback){
    var path = this.getPath();
    name = name || null;


    fs.exists(__dirname+"/../"+path+"/"+name+".js", function(){
        fs.unlink(__dirname+"/../"+path+"/"+name+".js", callback);
    });

};

module.exports.randomString = generateName;
module.exports.session = session;