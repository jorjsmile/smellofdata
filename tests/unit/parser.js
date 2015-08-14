/**
 * Created by george on 8/13/15.
 */
var Parser = require("../../src/parser"),
    Session = require("../../src/session").session;

exports.testGeneral = function(test){
    var p = new Parser(__dirname+"/../resources/files/testXLSX.xlsx", {
            //concat();
        }),
        sess = new Session();

    var sessionName = sess.open();

    p.process(function(err, info){
        if(err){
            console.log(err);
            return test.done();
        }

        var r = p.getReader();


        test.ok(r);
        test.ok(p.getData()[ info.sheets[0] ]);
        test.equal(17, p.getData({ "sheetName" : info.sheets[0] }).length);
        test.equal(26, p.getData({ "concatSheets" : true }).length);


        var sessParser = new Parser(sess);


        test.ok(sessParser.getReader());
        info = sessParser.getReader().info();
        test.ok(sessParser.getData()[ info.sheets[0] ]);
        test.equal(17, sessParser.getData({ "sheetName" : info.sheets[0] }).length);
        test.equal(26, sessParser.getData({ "concatSheets" : true }).length);

        sess.destroy(sessionName);
        test.done();
    }, sess);

};