// const environments = {};
// const dev = require("./env-files/development.json");
// const prod = require("./env-files/production.json");

// // Staging (default) environment
// environments.staging = { ...dev };

// // Production environment
// environments.production = { ...prod };

// // Determine which environment was passed as a command-line argument
// const currentEnvironment = typeof process.env.NODE_ENV == "string" ? process.env.NODE_ENV.toLowerCase() : "";

// // Check that the current environment is one of the environments above, if not default to staging
// const environmentToExport =
// 	typeof environments[currentEnvironment] == "object" ? environments[currentEnvironment] : environments.staging;

// module.exports = environmentToExport;
