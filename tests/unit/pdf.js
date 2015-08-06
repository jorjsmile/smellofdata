/**
 * Created by george on 7/25/15.
 */

var pdfReader = require("../../src/data_readers/pdf");

exports.testDelimiter = function(test){
    var r = new pdfReader("/var/node/smellofdata/tests/resources/files/testPDF.pdf", {
        //"columnDelimiter" : /\s/
    });

    r.readData(function(){
        console.log(r.data);
        console.log(r.longestRowLength);
        test.done();
    });
};