/**
 * Created by george on 7/6/15.
 */
var httpServer=require("./src/web"),
    server = new httpServer(),
    Parser = require("./src/parser"),
    Session = require("./src/session").session,
    conf = require("./configs/main.js");

/**********************************************************************************************************************/
/************************************** TEST INDEX FILE ***************************************************************/
/************************************* IT IS NOT OPTIMIZED ************************************************************/
/**********************************************************************************************************************/

server.addAction("/load", function(req, res, end){
    var sess = new Session();

    if( req.method == "POST" && req.files && req.files["file"] ){

        var pars = new Parser(req.files["file"].path, {
                "xlsx" : {
                    "addSheetName" : true,
                    "concatSheets" : true
                }
            }),
            reader = pars.process(),
            headers = [];

        if(!reader) {
            end();
        }

        for(var i = 0; i < reader.longestRowLength; i ++)
            headers.push(i);

        var    output = {
                data: reader.data,
                headers: headers,
                sessId : sess.open()
            };

        sess.setSessionValue("reader", output); //TAKE CARE ABOUT YOUR MEMORY!!! DO NOT USE IT ON HUGE FILES!!!

        output = JSON.stringify(output);

        //res.writeHead(200, {
        //    "Content-Type" : "text/html;charset=utf-8"
        //});
        res.write("<script type='text/javascript' > parent.postMessage("+output+", '"+req.body.origin+"'); </script>");
    }
    else if(req.method == "POST" && req.body.session){
        sess.open(req.body.session);
        res.write(JSON.stringify(sess.getSession().reader));
    }

    end();
});

server.addAction("/mapreduce", function(req, res, end){
    //if(req.method !== "POST") return end();

    var sess = new Session(),
        parser = new Parser(null);


    sess.open(req.body.session); //should contain data already.

    sess.setSessionValue("map", req.body.map);
    sess.setSessionValue("reduce", req.body.reduce);
    var sessData = sess.getSession(),
        result = parser.mapReduce(sessData.reader.data, sessData.map, sessData.reduce, true);

    if(req.body.isSource){
        result.sessId = req.body.session;
        sess.setSessionValue("reader", result);
    }

    res.write(JSON.stringify(result));

    end();
});


server.addAction("/test", function(req, res, end){
    res.setHeader("Content-Type", "text/plain");
    end("Hello there");
});


server.go();