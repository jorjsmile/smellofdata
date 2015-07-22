var http = require("http"),
    action = require("./actions").action,
    restAction = require("./actions").restAction,
    file = require("fs"),
    async = require("async"),
    multiparty = require("multiparty"),
    conf = require("./../configs/main");

//    csrf = require("csurf"); - create csrf sertificate
/**
 * 
 */
function server(){
    var port = 9090,
        _listeners = {},
        _this = this;

    var requestInfo = function(request){    
        var url = require("url");
        return url.parse(request.url, true);
    };

    var defaultListener = function(req, res){
        data = "";
        req.on("data", function(chunk){
            data += chunk.toString();
        });

        req.on("end", function(){
            //console.log("set header");
            var qs = require("querystring");
            req.body = qs.parse(data);

            var stack = [],
                reqInfo = requestInfo(req);


            for(var f in _listeners)
            {
               if(reqInfo.pathname !== f) continue;
               (function(_l){
                   stack.push(function(callback){
                        _listeners[_l].setRequestInfo(reqInfo);
                        _listeners[_l].run(req, res, callback);
                    });
               })(f);
            }

            async.parallel(stack, function(message){
                res.end(message);
            });

        });
    }

    var multiPartListner = function(req, res){
        console.log("Multi Part");
        var f = new multiparty.Form();

        f.parse(req, function(err, fields, files){
            req.body = fields;
            req.files = files;
            _this.callAction(req, res);
        });
    };

    var corsListener = function(req, res){

        // Echo back the Origin (calling domain) so that the
        // client is granted access to make subsequent requests
        // to the API.
        var origin = _this.getOrigin(req);

        res.writeHead(
            "204",
            "No Content",
            {
                "access-control-allow-origin": origin,
                "access-control-allow-methods": "GET, POST, PUT, DELETE, OPTIONS",
                "access-control-allow-headers": "content-type, accept, "+(req.headers["access-control-request-headers"] || ""),
                "access-control-max-age": 10, // Seconds.
                "content-length": 0
            }
        );

        return res.end();

    };

    this.callAction = function(req, res){

        var stack = [],
            reqInfo = requestInfo(req);


            for(var f in _listeners)
            {
               if(reqInfo.pathname !== f) continue;
               (function(_l){
                   stack.push(function(callback){
                        _listeners[_l].setRequestInfo(reqInfo);
                        _listeners[_l].run(req, res, callback);
                    });
               })(f);
            }

            async.parallel(stack, function(){
                res.end();
            });
    };

    /**
     * Register standard route behavior
     * @param url route url without leading '/'
     * @param f accept 3 parameters: response, request, end-callback -
     *                          - <b>request</b> object (@see http.response)
     *                          - <b>response</b> object (@see http.request)
     *                          - <b>end-callback</b> - call to return control to web pipe
     */
    this.addAction = function(url,  f){        
        if(typeof(f) === "function") {
            var a = new action(url, f);
            _listeners[a.getUrl()] = a;
        }
    };

    this.addRestAction = function(url, o){
        o = o || {};
        o.post = o.post || true;
        o.get = o.get || true;
        o.put = o.put || true;
        o.delete = o.delete || true;
        
        _listeners[url] = new restAction(url, o);
    };
    
    this.getListener = function(req, res){
        this.setHeaders(req, res);

        if(req.method.toUpperCase() === "OPTIONS")
            return corsListener(req, res);
        else if(req.method=="POST" && req.headers["content-type"].indexOf("multipart/form-data")!==-1)
            return multiPartListner(req, res);
        else
            return defaultListener(req, res);
    };
    
    this.getPort = function(){
        return port;
    }
    
   
}

server.prototype = new Object();
server.prototype.constructor = server;

server.prototype.go = function(){
    //start server
    console.log("I'm on "+ this.getPort());
    var _this = this;
    http.createServer(function(req, res){
        _this.getListener(req, res);
    }).listen(this.getPort());
};

server.prototype.setHeaders = function(req, res){
    //console.log(req.headers);
    if(req.headers["origin"]){
        res.setHeader("access-control-allow-origin", this.getOrigin(req));
    }
};

server.prototype.getOrigin = function(req){
    var origin = req.headers.origin,
        accessFor = conf.web.cors.allowOrigin;

    if(accessFor.indexOf(origin) === -1)
        origin = accessFor.join(",");

    return origin;
};

module.exports = server;
