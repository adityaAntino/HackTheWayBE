const colors = require("colors");
const logger = require("./logger");
// module.exports = {
//   error: (path, message, err) => console.log(colors.red(`Error: ${path} | ${message} \n ${err}`)),
//   warn: (path, message) => console.log(colors.yellow(`Warning:${message}`)),
//   info: (path, message, data) => console.log(colors.blue(`${path} | ${message} | ${data}`))
// };

module.exports = {
	error: (path, message, err) => logger.error({ message: `${path} | ${message} | ${JSON.stringify(err.message)}` }),
	warn: (path, message) => logger.warn({ message: `${path} | ${message}` }),
	info: (path, message, data) => logger.info({ message: `${path} | ${message} | ${JSON.stringify(data)}` }),
	debug: (path, message, data) => logger.debug({ message: `${path} | ${message} | ${JSON.stringify(data)}` }),
};
