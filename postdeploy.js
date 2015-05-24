
const SPAWN = require("child_process").spawn;


require('org.pinf.genesis.lib/lib/api').forModule(require, module, function (API, exports) {

	// TODO: init env from package.json overlayed by package.service.json

	console.log("BOOTED postdeploy module with API11!", "API.OS", API.OS);


	// TODO: Write wile: /etc/init/app-$PIO_SERVICE_ID_SAFE.conf

	if (API.FS.existsSync(API.PATH.join(process.env.PIO_SERVICE_HOME, "sync/runtime/configs/app.conf"))) {


		function replaceVariables (fromPath, toPath) {

			var appConfig = API.FS.readFileSync(
				fromPath,
				"utf8"
			);

			var re = /%%([^%]+)%%/g;
		    var m = null;
		    while (m = re.exec(appConfig)) {
		    	if (typeof process.env[m[1]] === "undefined") {
		    		throw new Error("Environment variable '" + m[1] + "' not set!");
		    	}
				appConfig = appConfig.replace(new RegExp(m[0], "g"), process.env[m[1]]);
		    }

		    console.log("Writing file to path:", toPath);

			API.FS.writeFileSync(
				toPath,
				appConfig,
				"utf8"
			);
		}

		replaceVariables(
			API.PATH.join(process.env.PIO_SERVICE_HOME, "sync/runtime/configs/app.conf"),
			"/etc/init/app-" + process.env.PIO_SERVICE_ID_SAFE + ".conf"
		);
		replaceVariables(
			API.PATH.join(process.env.PIO_SERVICE_HOME, "sync/runtime/scripts/launch.sh"),
			API.PATH.join(process.env.PIO_SERVICE_LIVE_RUNTIME_DIRPATH, "scripts/launch.sh")
		);


		var env = require(API.PATH.join(process.env.PIO_SERVICE_HOME, "sync", process.env.PIO_SERVICE_DESCRIPTOR_PATH)).env;
		API.FS.writeFileSync(
			process.env.PIO_SERVICE_ACTIVATE_FILEPATH,
			[
				'#!/bin/bash',

                // These are needed at minimum to boot the pinf.io environment.
				'export HOME=' + env.HOME,
				'export BO_ROOT_SCRIPT_PATH=' + env.BO_ROOT_SCRIPT_PATH,

				'# Source https://github.com/cadorn/bash.origin',
				'. "' + env.BO_ROOT_SCRIPT_PATH + '"',
				'function init {',
				'	eval BO_SELF_BASH_SOURCE="$BO_READ_SELF_BASH_SOURCE"',
				'	BO_deriveSelfDir ___TMP___ "$BO_SELF_BASH_SOURCE"',
				'	PGS_DIR="$___TMP___"',
				'',
				'	BO_sourcePrototype "' + env.PIO_BIN_DIRPATH + '/activate"',
				(Object.keys(env).map(function (name) {
					return "	export " + name + "=" + env[name];
				})).join("\n"),
				'}',
				'init $@'
			].join("\n"),
			"utf8"
		);


		if (!API.FS.existsSync(API.PATH.join(process.env.PIO_SERVICE_LIVE_RUNTIME_DIRPATH, "scripts/run.sh"))) {
			return;
		}

		return API.Q.denodeify(function (callback) {

			var proc = SPAWN("/bin/bash", [
				"run.sh"
			], {
				cwd: API.PATH.join(process.env.PIO_SERVICE_LIVE_RUNTIME_DIRPATH, "scripts"),
	            env: process.env
	        });
	        proc.stdout.on('data', function (data) {
	            process.stdout.write(data);
	        });
	        proc.stderr.on('data', function (data) {
	            process.stderr.write(data);
	        });
	        proc.on('close', function (code) {
	            if (code !== 0) {
	                console.error("ERROR: Remote command exited with code '" + code + "'");
	                return callback(new Error("Remote command exited with code '" + code + "'"));
	            }
	            return callback(null);
	        });
		})();
	}

});

