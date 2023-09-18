const express = require("express");
const cors = require("cors");
const responseHandler = require("./../app/common/handlers/response.handler");
const config = require("./env/config");
const logger = require("morgan");


module.exports = () => {
	const app = express();
	app.use(express.json({ extended: false, limit: "50mb" }));
	app.use(express.urlencoded({ extended: false, limit: "50mb" }));
	app.use(cors());
	app.use(express.static("./app"));
	app.use(responseHandler());
	app.use(logger("dev"));

	require("../app/common/authentication/v1/auth.routes")(app);
	require("../app/modules/auction/v1/auction.routes")(app);
	require("../app/modules/user/v1/user.routes")(app);

	const PORT =  process.env.PORT;
	app.get("/", (req, res) => {
		return res.status(200).send("Server is running on Port - " + PORT);
	});

	// 404 - Not Found
	app.use((req, res, next) => {
		return res.error.NotFound("Requested Route [ " + req.url + " ] Not found.");
	});

	// 500 - Any server error
	app.use(function (err, req, res, next) {
		console.error(err);
		return res.error.ServerError("Internal Server Error", err);
	});

	return app;
};
