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

    var _columns = [];

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

        console.log(from, to);
        for(; col!=to; col=increase(col))
            _columns.push(col);

        _columns.push(col);

        return _columns;
    }
};

xlsxReader.prototype = Object.create(reader);
xlsxReader.prototype.constructor = xlsxReader;

xlsxReader.prototype.readData = function(){
    var file = this.getFile(),
        concatSheets = this.getOption("concatSheets") || false;

    workbook = xlsx.readFile(file);

    if( !concatSheets ){
        var sheetName = this.getOption("sheetName") || workbook.SheetNames[0]; //primary sheet but should be configured
        this.readSheet(sheetName);
    }
    else{
        for(var s in workbook.SheetNames){
            this.readSheet(workbook.SheetNames[s]);
        }
        this.longestRowLength ++;
    }


};

xlsxReader.prototype.readSheet = function(sheetName){
    var worksheet = workbook.Sheets[sheetName],
        addSheetName = this.getOption("addSheetName") || false,
        concatSheets = this.getOption("concatSheets") || false,
        offset = this.getOption("concatSheets")? this.data.length : 0,
        range = worksheet["!ref"]; //get range

    range = range.match(/([A-Z]+)([0-9]+)\:([A-Z]+)([0-9]+)/); //parse range A1-Z100

    var list = this.getColumns(range[1], range[3]);

    //create result array
    var rowLength = 1,
        rowC = offset+1;

    for(var row = range[2]; row < range[4]; row++, rowC++){ //iterate through all rows

        this.data[rowC] = this.data[rowC] || []; //create new offset if it's required
        rowLength = 1;

        if(addSheetName)
            this.data[rowC].push(sheetName);

        for(var i = 0; i<list.length; i++){ //iterate through all columns
            if(worksheet[list[i]+row] === undefined){
                this.data[rowC].push("");
                continue;
            }
            rowLength ++;
            //result[row] = result[row][i] || [];
            //rowData.push(worksheet[list[i]+row].v);

            this.data[rowC].push(worksheet[list[i]+row].v);
        }

        if( rowLength > this.longestRowLength )
            this.longestRowLength = rowLength;
    }

    return this;
};



module.exports = xlsxReader;