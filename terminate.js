const mongoose = require("mongoose");

const logger = require("./src/app/common/logger/logs");
const env = require("./src/config/env/config");


//Error model created to store crashing error
const ErrorSchema = mongoose.Schema(
	{
		environment: String,
		message: String,
		stack: String,
		error: String,
	},
	{ timestamps: true }
);

const errorModel = mongoose.model("Error", ErrorSchema);

//General function for handling crashing error and graceful shutdown
function terminate(server, options = { coredump: false, timeout: 500 }) {
	const exit = (code) => (options.coredump ? process.abort() : process.exit(code));

	return (code, reason) => (err, promise) => {
		if (err && err instanceof Error) {
			logger.error(env.envName, err.message, err.stack);

			errorModel.create({
				environment: env.envName,
				message: err.message,
				stack: err.stack,
				error: err,
			});
		}

		server.close(exit);
		setTimeout(exit, options.timeout).unref();
	};
}

module.exports = terminate;
