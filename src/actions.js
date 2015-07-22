/**
 * Created by george on 7/9/15.
 */

function action(url, callback){

    var _c = callback,
        _u = url,
        _filters = [],
        response = null,
        request = null,
        reqInfo = null,
        _this = this;

    if(typeof(_u) === "object") //only array
    {
        _filters = _u[1];
        _u = _u[0];
    }


    this.run = function(req, res, callback){
        response = res;
        request = req;

        if(!this.filter()) return callback();

        if(!res.headersSent)
            res.setHeader("Content-Type", "text/html;charset=utf8");
//        if(reqInfo.pathname != _u) return callback();
        _c.call(_this, request, response, callback);
    };

    this.getUrl = function(){
        return _u;
    };

    this.setRequestInfo = function(ri){
        return reqInfo = ri;
    };

    this.getRequestInfo = function(){
        return reqInfo;
    };

    this.getRequest = function(){
        return request;
    };

    this.getResponse = function(){
        return response;
    };

    this.getFilters = function(){
        return _filters;
    };
}

action.prototype = new Object();
action.prototype.constructor = action;

action.prototype.isAjax = function(){
    return this.getRequest().headers["x-requested-with"] == "XMLHttpRequest";
};

action.prototype.render = function(view, data){

    var content = file.readFileSync("views/"+view, {encoding:"utf8"})
        .replace(/\<\?\=\$(.*?)\?\>/gi, function(syntax, param){
            if(data[param] !== undefined) return data[param];
        });
    this.getResponse().write(content);
};

action.prototype.filter = function(callback){
    var list = this.getFilters(),
        result = true;

    for(var _l in list){ //can be async functions - take care in future
        var method = null;
        method = action.prototype["filter"+_l.replace(/^./, function(m){ return m.toUpperCase(); })];
        //console.log(list);
        if(typeof(method) !== "undefined" )
            result &= method.call(this, list[_l]);
        else if(typeof(list[_l]) === "function")
            result &= list[_l].call(this);

        if(!result) return result;
    }

    return result;
};


/*
function restAction(url, info){
    action.call(this, url, function(){});
    var i = info,
        request = null,
        response = null,
        _this = this;

    var getModel = function(){
        var modelName = url
                .replace(/[^A-Za-z_\-0-9]/, "")
                .replace(/^(.{1})/, function(m){ return m.toUpperCase(); }),
            module = "./models/"+modelName+".js";
        try {
            require.resolve(module);
        }catch(e){
            console.log(module, "Model not found");
            return false;
        }
        var module = require(module),
            model = new module();

        return model;
    };

    var error = function (res, message, callback){
        var output = typeof(message) == "object"? message  : {
            "success" : false,
            "message" : message
        };

        res.write(JSON.stringify(output));
        callback();
        return 1;
    };

    var methods = {
        post : typeof(i.post) === "function"? i.post : function(req, res, callback){
            var output = {
                "success" : true,
                "message" : ""
            };
            var model = getModel();
            if(!model)
                return error(res, "Such model desn't exists", callback);

            model.set( req.body );
            model.setScenario("insert");
            var errors = model.validate();
            if(!errors){
                model.post(function(e, data){

                    if(e)
                        return error(res, "DataBase error");
                    else{
                        output.message = "Successfully inserted";
                        output[model.getCollection()] = data[0];

                        res.write(JSON.stringify(output));
                    }
                    callback();
                });
            }
            else{
                return error(res, { success:false, message : "Model Validation failed", "errors": errors }, callback);
            }
        },
        get : typeof(i.get) === "function"? i.get : function(req, res, callback){
            var model = getModel();
            model.setScenario("select");

            if(!model)
                return error(res, "Such model desn't exists", callback);

            model.get(this.getRequestInfo().query,function(e, data){
                if(e)
                    return error(res, "DataBase error");

                var output = {
                    "success" : true,
                    "message" : "Successfully selected"
                };

                output[model.getCollection()] = data;
                res.write(JSON.stringify(output));
                callback();
            });
        },
        put : typeof(i.put) === "function"? i.put : function(req, res, callback){
            var model = getModel();
            model.setScenario("update");

            if(!model)
                return error(res, "Such model desn't exists", callback);

            var query = this.getRequestInfo().query;
            if( !query || query.id === undefined || model.validateID(query.id) !== true )
                return error(res, "Object Id required", callback);

            model.set(req.body);
            var errors = model.validate();

            if(errors)
                return error(res, { success:false, message : "Model Validation failed", "errors": errors }, callback);


            model.put(query.id, function(e, data){
                if(e)
                    return error(res, "DataBase error");

                var output = {
                    "success" : true,
                    "message" : "Successfully updated"
                };

                output[model.getCollection()] = data;
                res.write(JSON.stringify(output));
                callback();
            });
        },
        "delete" : typeof(i.delete) === "function"? i.delete : function(req, res, callback){
            var model = getModel();
            model.setScenario("delete");

            if(!model)
                return error(res, "Such model desn't exists", callback);

            var query = this.getRequestInfo().query;
            if( !query || query.id === undefined || model.validateID(query.id) !== true )
                return error(res, "Object Id required", callback);

            model.delete(query.id, function(e, data){
                if(e)
                    return error(res, "DataBase error");

                var output = {
                    "success" : true,
                    "message" : "Successfully deleted"
                };

                output[model.getCollection()] = data;
                res.write(JSON.stringify(output));
                callback();
            });
        }

    };

    this.run = function(req, res, callback){
        response = res;
        request = req;

        res.writeHead(200, {"Content-type" : "application/json"});
        if(methods[req.method.toLowerCase()] !== undefined)
            methods[req.method.toLowerCase()].call(_this, req, res, callback);
        else {
            console.log(req.method.toLowerCase(), "Doesn't exists'");
            callback();
        }
    };
}

restAction.prototype = new action();
restAction.prototype.constructor = restAction;
*/

module.exports.action = action;
module.exports.restAction = [];//restAction;