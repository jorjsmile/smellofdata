/**
 * Created by george on 7/6/15.
 */
var httpServer=require("./src/web"),
    server = new httpServer(),
    Parser = require("./src/parser"),
    Session = require("./src/session").session,
    conf = require("./configs/main.js"),
    extend = require("extend"),
    stream = require("stream");

/**********************************************************************************************************************/
/************************************** TEST INDEX FILE ***************************************************************/
/************************************* IT IS NOT OPTIMIZED ************************************************************/
/**********************************************************************************************************************/

server.addAction("/load", function(req, res, end){
    var sess = new Session();

    if( req.method == "POST" && req.files && req.files["file"] ){

        console.log(req.body);
        var parserConfig = req.body.Config || {};
            defaultConfig = {
                //"xlsx" : {
                //    "addSheetName" : true,
                //    "concatSheets" : true
                //}
            };

        console.log(extend(true, defaultConfig, parserConfig));

        var pars = new Parser(req.files["file"].path, extend(true, defaultConfig, parserConfig) ),
            ondone = function(err, reader){
                var headers = [];

                if(reader == null)  return end();

                reader.cache(sess);

                res.write("<script type='text/javascript' > parent.postMessage("+JSON.stringify(reader.info())+", '"+req.body.origin+"'); </script>");
                        end();
            };

        pars.process(ondone);
    }
});

function getData(options){
    var sessionKeys = ["map", "reduce"],
        sess = new Session(),
        parser = null;

    sess.open(options.Session.id); //should contain data already

    for(var s in sessionKeys)
        if(options.Session[sessionKeys[s]] != undefined)
            sess.set(sessionKeys[s], options.Session[sessionKeys[s]]);

    parser = new Parser(sess);

    if(options.mapReduce)
        return parser.mapReduce(sess.map, sess.reduce);
    else
        return parser.getData();
}

server.addAction("/data", function(req, res, end){

    res.write(
            JSON.stringify(
                getData(req.body)
            )
    );

    end();
});

//server.addAction("/mapreduce", function(req, res, end){
//    //if(req.method !== "POST") return end();
//
//    var sess = new Session(),
//        parser = new Parser(null);
//
//
//    sess.open(req.body.session); //should contain data already.
//
//    sess.setSessionValue("map", req.body.map);
//    sess.setSessionValue("reduce", req.body.reduce);
//    var sessData = sess.getSession(),
//        result = parser.mapReduce(sessData.reader.data, sessData.map, sessData.reduce, true);
//
//    if(req.body.isSource != 0 ){
//        result.sessId = req.body.session;
//        sess.setSessionValue("reader", result);
//    }
//
//    res.write(JSON.stringify(result));
//
//    end();
//});

server.addAction("/unload", function(req, res, end){
    var sess = new Session();

    sess.destroy(this.getParam("session"), function(){
        res.write("ok");
        end();
    });

});

server.addAction("/download", function(req, res, end){
    //initialization
    var sess = new Session();
    sess.open(this.getParam("session")); //should contain data already.


    //determine type
    var types = {
        "csv" : "application/csv",
        "json" : "application/json",
        "sql" : "application/sql"
        },
        desired = this.getParam("type"),
        output = "";

    if(!desired || !types[desired] ) return end();

    data = getData(req.body);

    if(!data) return end();

    headers = data.headers;
    data = data.data;

    //process data
    if(desired == "json")
        output = JSON.stringify(data).replace(/^\<pre\>|\<\/pre\>/g, "");
    else{
        var d=",", rowD, e="'"; //delimiter, rowDelimiter, escape
        output = []; //rows
        if(desired == "csv"){
            rowD = "\n";
            output.push(e+headers.join(e+d+e)+e);
        }
        if(desired == "sql")
            rowD = "),(";

        for(var row in data){
            if(typeof(data[row]) !== "object" || data[row] == null ) continue;
            //console.log(row[data]);
            var rowArray = [];
            for(var column in headers){
                if(!data[row][headers[column]])
                    rowArray.push( "" );
                else
                    rowArray.push(  (data[row][headers[column]]+"").replace(/\'/g, "\\'") );
            }
            output.push(e+rowArray.join(e+d+e)+e);
        }
        output = output.join(rowD);
        if(desired == 'sql'){
            headers = "`"+headers.join("`,`")+"`";
            table = this.getParam("table", "export");
            output = "insert into "+table+" ( "+ headers+ ") values ( "+output+" ) ";
        }
    }

    buffer = new Buffer(output);

    //output
    res.setHeader("Content-Type", types[desired]);
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Content-Disposition", "attachment; filename=export."+desired);

    res.write(output);
    end();
});

server.addAction("/test", function(req, res, end){
    res.setHeader("Content-Type", "text/plain");
    end("Hello there");
});



server.go();