const express = require("./src/config/express");
const config = require("./src/config/env/config");
const connectDB = require("./src/config/database/dbConnection");
const terminate = require("./terminate");

const app = express();
const server = require("http").createServer(app);



connectDB();
express();

// const PORT = config.port ? config.port : process.env.PORT;
const PORT =  process.env.PORT;

server.listen(process.env.PORT || process.env.PORT, function () {
	console.log("----------------------------------------------------------");
	console.log("Server listening at port : " + PORT);
	console.log("Time : " + new Date());
	console.log("Hack your way now...");
	console.log("----------------------------------------------------------");
});

//For Graceful shutdown
const exitHandler = terminate(server, {
	coredump: false,
	timeout: 500,
});

process.on("uncaughtException", exitHandler(1, "Unexpected Error"));
process.on("unhandledRejection", exitHandler(1, "Unhandled Promise"));
process.on("SIGTERM", exitHandler(0, "SIGTERM"));
process.on("SIGINT", exitHandler(0, "SIGINT"));
