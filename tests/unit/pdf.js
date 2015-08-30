/**
 * Created by george on 7/25/15.
 */

var pdfReader = require("../../src/data_readers/pdf");

exports.testDelimiter = function(test){
    var r = new pdfReader(__dirname+"/../resources/files/testPDF.pdf", {
        //"columnDelimiter" : /\s/
    });

    r.readData(function(){
        test.ok(r.getData()[0]);
        test.equal(58, r.getData({page:0}).length);
        test.equal(4505, r.getData({concatPages : true}).length);
        test.done();
    });
};