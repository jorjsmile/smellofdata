/**
 * Created by george on 8/13/15.
 */
var Parser = require("../../src/parser"),
    Session = require("../../src/session");


exports.testGeneral = function(test){
    var p = new Parser(__dirname+"/../resources/files/testXLSX.xlsx", {
            //concat();
        }),
        sess = new Session();


    console.log(s);
    p.process(function(err, info){
        if(err){
            console.log(err);
            return test.done();
        }

        var r = p.getReader();

        console.log(info);
        test.ok(r);
        test.ok(p.getData()[ info.sheets[0] ]);
        test.equal(17, p.getData({ "sheetName" : info.sheets[0] }).length);
        test.equal(26, p.getData({ "concatSheets" : true }).length);



        test.done();
    }, s);

};