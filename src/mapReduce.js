/**
 * implement it in multi thread
 * Created by george on 7/15/15.
 */
module.exports = function(data, map, reduce){
    var _result = {},
        _error = null,
        _log = [];

    this.emit = function(key, data){
        _result[key] = _result[key] || [];
        _result[key].push(data);
    };

    this.log = function(){
        _log.push(Array.prototype.slice.call(arguments));
    };

    //console.log(data);
    for(var i in data){
        if(data[i] == null) continue;
        try{
            map.call(this, i, data[i]);
        }
        catch(e){
            console.log("Map Error: ", e);
            _error = {"error" : ["map", e.toString()] };
            break;
        };
    }

    if(!reduce) return _result;

    for(var i in _result)
        _result[i] = _result[i].reduce(function(prev, current, index, array){
            try{
                return reduce(i, prev, current, index, array);
            }
            catch(e){
                console.log("Reduce Error: ", e);
                _error = {"error" : ["reduce", e]};
                return;
            }
        }, null);


    this.getResult = function(){
        if(_error !== null) return false;
        return _result;
    };

    this.getError = function(){
        return _error;
    };

    this.getLog = function(){
        return _log;
    };
};

