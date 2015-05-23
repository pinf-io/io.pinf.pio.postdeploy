

console.log("Running postdeploy NodeJS module!", process.env);


// TODO: Use 'org.pinf.genesis.lib' to laod config & then process postdeploy for package.


require('org.pinf.genesis.lib/lib/api').forModule(require, module, function (API, exports) {

	// TODO: init env from package.json overlayed by package.service.json

	console.log("BOOTED postdeploy module with API!");


});

