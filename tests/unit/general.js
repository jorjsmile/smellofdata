/**
 * Created by george on 7/6/15.
 */

var request = require("request"),
    async = require("async"),
    fs = require("fs"),
    action = require("./../../src/actions").action,
    session = require("./../../src/session").session;


exports.testTypes = function(test){
    async.series([
        function(c){
            var data = {
                        "origin" : "testlocal",
                        file : fs.createReadStream( __dirname + "/../resources/files/testXLSX.xlsx" )
                    };
                request.post({url : "http://localhost:9090/load", formData:data}, function(err, res){
                if(err){
                    console.log(err);
                    test.done();
                }
                data = res.body.match(/parent\.postMessage\((\{(.|[\r\n])*?\}), '/);
                data = eval( "(" + data[1] + ")");

                test.equal(200, res.statusCode);

                c(null, data.sessId);
            });
        },
        function(c){
            var data = {
                "origin" : "testlocal",
                file : fs.createReadStream( __dirname + "/../resources/files/testPDF.pdf" )
            };
            request.post({url : "http://localhost:9090/load", formData:data}, function(err, res){
                if(err){
                    return c(err, null);
                    //test.done();
                }

                data = res.body.match(/parent\.postMessage\((\{(.|[\r\n]|[\n])*?\}), '/);
                data = eval( "(" + data[1] + ")");

                test.equal(200, res.statusCode);

                c(null, data.sessId);
            });
        }
    ],function(e, result){
        for(var s in result)
            fs.unlink(__dirname + "/../../sessions/"+result[s]+".js", function(e){
                if(e)
                    console.log(e);
            });
        test.done();
    })
};

exports.testFlow = function(test){

    async.waterfall([
        function(c){
            var data = {
                "origin" : "testlocal",
                file : fs.createReadStream( __dirname + "/../resources/files/testXLSX.xlsx" )
            };
            request.post({url : "http://localhost:9090/load", formData:data}, function(err, res){
                if(err){
                    console.log(err);
                    test.done();
                }
                data = res.body.match(/parent\.postMessage\((\{(.|[\r\n])*?\}), '/);
                data = eval( "(" + data[1] + ")");

                test.equal(200, res.statusCode);

                c(null, data.sessId);
            });
        },
        function(sessId, c){ //reload
            var data = {
                session : sessId
            };
            request.post({url : "http://localhost:9090/load", formData:data}, function(err, res){
                if(err){
                    console.log(err);
                    test.done();
                }

                data = res.body;
                data = eval( "(" + data + ")");

                test.ok(data);
                //test.equal(200, res.statusCode);

                c(null, sessId);
            });
        },
        function( sessId, c ){ //map reduce
            var data = {
                session : sessId,
                map : "js:function(key, value){ value[0] += 'Yeeah'; this.emit(key, value); this.emit('longestLengthRow', value.length);}",
                reduce : "js:function(key, prev, curr) { if(key=='longestLengthRow' && prev > curr) return prev; else return curr;   } "

            };
            request.post({url : "http://localhost:9090/mapreduce", formData:data}, function(err, res){
                if(err){
                    console.log(err);
                    test.done();
                }

                data = res.body;
                data = eval( "(" + data + ")");

                test.ok(data);
                //test.equal(200, res.statusCode);

                c(null, sessId);
            });

        },
        function( sessId, c ){
            request.get("http://localhost:9090/unload?session="+sessId, function(err, res){

                test.ok(res.body);
                c(null, sessId);
            })
        }
    ], function(err, sessId){
        console.log(sessId);
        //clear session
        test.ok(!fs.existsSync(__dirname + "/../../sessions/"+sessId+".js"));
        test.done();
    });

};

exports.testFilters = function(test){
    test.expect(1);
    var shouldStop = true,
        a = new action(["test", {
            "negate" : function() { return !shouldStop; }
        }]);

    a.run = function(){
        if( !this.filter() ) return;

        test.equal(true, true);
    };
    a.run(); //should not evaluate assertion

    shouldStop = false;
    a.getFilters().negate.shouldStop = false;

    a.run(); //should assert to true

    test.done();
};

exports.testSession = function(test){

     var s = new session();
    test.ok(s.open());

    test.ok(s.setSessionValue("file", "/tmp/asADFxcVFAdc"));
    test.ok(s.setSessionValue("function", "js:function() { return true; }"));
    test.ok(s.setSessionValue("object", {a : 1}));
    test.ok(s.setSessionValue("array", [1]));
    test.ok(s.setSessionValue("function", "js:function() { return false; }"));

    test.ok(s.getSession().object.a);
    test.ok(!s.getSession().function());


    var name = s.getName();

    s = new session();
    s.open(); //create new session
    s.open(name); //load old one

    test.ok(s.getSession().object.a); //test data

    test.done();
};