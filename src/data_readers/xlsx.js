/**
 * Should think about streams!
 * Created by george on 7/15/15.
 */
var reader = require("./../reader"),
    mimes = [
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel"
    ],
    xlsx = require("xlsx");

function xlsxReader(file, options){
    reader.apply(this, arguments);

    var _columns = [],
        _workbook = null;

    var getNextLetter = function (l){ // [A->B, 0] [Z->A, 1]
            var code = l.charCodeAt(0);
            var add = (code == 90)+0;
            return [String.fromCharCode((code+1-65)%26+65), add];
        },
        increase = function (i){ // A->B, Z->AA, AZ->BA
            var nL = null;
            i = i.split("");
            for (var j = i.length-1; j>=0; j--){
                nL = getNextLetter(i[j]);
                i[j] = nL[0];
                if(nL[1] !== 1) {
                    nL[1] = 0;
                    break;
                }
            }

            i = i.join("");
            if(nL[1] == 1)
                i+="A";

            return i;
        };

    this.getColumns = function(from, to, flush){

        if( _columns.length !== 0 && flush===undefined ) return _columns;

        var col = from;

        for(; col!=to; col=increase(col))
            _columns.push(col);

        _columns.push(col);

        return _columns;
    }

    this.setWorkbook = function(workbook){
        _workbook = workbook;
    }

    this.getWorkbook = function(){
        if(!_workbook) throw "Workbook was not read";
        return _workbook;
    }
};

xlsxReader.prototype = new reader();
xlsxReader.prototype.constructor = xlsxReader;

xlsxReader.prototype.readData = function(done){
    var file = this.getFile();

    var workbook = xlsx.readFile(file);
    this.setWorkbook(workbook);
    this.data = {};

    for(var s in workbook.SheetNames)
        this.data[workbook.SheetNames[s]] = this.readSheet(workbook.SheetNames[s]);


    done(null, this);
};

xlsxReader.prototype.readSheet = function(sheetName){
    var worksheet = this.getWorkbook().Sheets[sheetName],
        addSheetName = this.getOption("addSheetName") || false,
        range = worksheet["!ref"],
        data = [];//get range

    range = range.match(/([A-Z]+)([0-9]+)\:([A-Z]+)([0-9]+)/); //parse range A1-Z100

    var list = this.getColumns(range[1], range[3]);

    //create result array
    var rowC = 0;

    for(var row = range[2]; row < range[4]; row++, rowC++){ //iterate through all rows

        data[rowC] = data[rowC] || []; //create new offset if it's required

        if(addSheetName)
            data[rowC].push(sheetName);

        for(var i = 0; i<list.length; i++){ //iterate through all columns
            if(worksheet[list[i]+row] === undefined){
                data[rowC].push("");
                continue;
            }
            //result[row] = result[row][i] || [];
            //rowData.push(worksheet[list[i]+row].v);

            data[rowC].push(worksheet[list[i]+row].v);
        }

    }

    return data;
};

xlsxReader.prototype.info = function(){
    if(Object.getOwnPropertyNames(this._info).length)
        return this._info;
    else{
        var w = this.getWorkbook();

        return {
            "type" : "xlsx",
            "sheets" : w.SheetNames
        };
    }
};

xlsxReader.prototype.getData = function(options){
    var options = options || {};

    if(options.sheetName !== undefined)
        return this.data[options.sheetName];


    if(options.concatSheets){
        var data = [];
        for(var s in this.data)
            data = data.concat(this.data[s]);

        return data;
    }

    return this.data;
};



module.exports = xlsxReader;