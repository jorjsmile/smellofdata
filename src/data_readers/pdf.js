/**
 * Created by george on 7/24/15.
 */
var reader = require("./../reader"),
    fs = require("fs"),
    PDFParser = require("pdf2json/pdfparser");

function pdfReader(){
    reader.apply(this, arguments);

    var _pdfDoc = null;

    this.setPdfDoc = function(pdfDoc){
        _pdfDoc = pdfDoc;
        return this;
    }

    this.getPdfDoc= function() { return _pdfDoc; }
}

pdfReader.prototype = new reader();
pdfReader.prototype.constructor = pdfReader;

pdfReader.prototype.getData = function(options){
    var options = options || {};

    if(options.page !== undefined)
        return this.data[options.page];


    if(options.concatPages){
        var data = [];
        for(var s in this.data)
            data = data.concat(this.data[s]);

        return data;
    }

    return this.data;
};

pdfReader.prototype.info = function(){
    var doc = this.getPdfDoc();
    return {
        "type" : "pdf",
        "pages" : doc.length
    };
};

pdfReader.prototype.readData = function(done){

    var e = 0.00001,
        positionalSort = function(a, b){
            var dY = a.y - b.y,
                dX = a.x - b.x,
                absDY = Math.abs(dY),
                absDX = Math.abs(dX);

            if( absDY < e && absDX < e ) return 0; //equal row, column
            if( absDY < e ) return dX; //equal row, position in column

            return dY; //position in row
        },
        splitByRow = function(prev, curr, i, ar){
            if( !(prev instanceof Array) ){
                prev.text = decodeURIComponent(prev["R"][0]["T"]);
                prev = [[prev]];
            }

            var prevRow = prev[prev.length-1],
                y = prevRow[0].y; //take row and y-position of the first element in it

            curr.text = decodeURIComponent(curr["R"][0]["T"]);
            if( Math.abs(y - curr.y) < e )
                prevRow.push(curr);
            else
                prev.push([curr]);

            return prev;
        },
        _this = this,
        file = this.getFile(),
        pdfParser = new PDFParser();

    pdfParser.on("pdfParser_dataReady", function(data){

        _this.setPdfDoc(data.data.Pages);

        _this.data = [];

        for(var p in data.data.Pages){
            var page = data.data.Pages[p].Texts
                .sort(positionalSort)
                .reduce(splitByRow);

            //leave only text
            for(var row in page){
                for(var o in page[row])
                    page[row][o] = page[row][o].text;
            }

            _this.data.push(page);
        }


        done(null, _this);
    });

    pdfParser.on("pdfParser_dataError", function(e){
        console.log(e);
        done(e, _this);
    });

    fs.readFile(file, function (err, pdfBuffer) {
        console.log("readed");
        if(err){
            console.log(err);
            done(err, _this);
        }

        pdfParser.parseBuffer(pdfBuffer);
    });
};


module.exports = pdfReader;