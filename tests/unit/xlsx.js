var xlsxReader = require("../../src/data_readers/xlsx");

exports.testGeneral = function(test){
    var r = new xlsxReader(__dirname+"/../resources/files/testXLSX.xlsx", {
        //concat();
    });

    r.readData(function(){
        //console.log();
        //console.log(r.getData());
        test.ok(r.getData()[ r.info().sheets[0] ]);
        test.equal(17, r.getData({ "sheetName" : r.info().sheets[0] }).length);
        test.equal(26, r.getData({ "concatSheets" : true }).length);

        test.done();
    });
};