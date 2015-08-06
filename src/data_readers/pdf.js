/**
 * Created by george on 7/24/15.
 */
var reader = require("./../reader"),
    pdf = require("pdf-text-extract"),
    fs = require("fs");

function pdfReader(){
    reader.apply(this, arguments);


    this.getColumnDelimiter = function(){
        return this.getOption("columnDelimiter") || false;
    }
}

pdfReader.prototype = Object.create(reader);
pdfReader.prototype.constructor = pdf;

pdfReader.prototype.readData = function(done){
    var file = this.getFile(),
        _this = this;


    pdf(file, function(err, pages){
        var documentRows = [],
            delimiter = _this.getColumnDelimiter();
        this.data = [];
        this.longestRowLength = 0;

        console.log("Delimiter - ",delimiter);
        for( var p in pages )
        {
            //console.log(pages[p]);
            documentRows  = pages[p].split("\n");
            if(documentRows.length == 0) continue;
            for(var row in documentRows){
                var columns = null;

                columns = documentRows[row].split( delimiter );

                _this.data = _this.data.concat([columns]);
                if(_this.longestRowLength < columns.length)
                    _this.longestRowLength = columns.length;
            }
        }

        done(null, _this);
    });

    //console.log(parser.data);
};

module.exports = pdfReader;