const express = require("express");

const _controller = require("./auction.controller");

const prefix = "/api/v1/auction";

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.post("/", _controller.InitializeAuction);
userRouter.post("/bid", _controller.BidOnAuction);
userRouter.post("/bid/close", _controller.CloseAuction);

module.exports = (app) => {
	app.use(prefix, (req, res, next) => {
		const apiSource = req.get("Platform");

		const UserRoutes = function () {
			userRouter(req, res, next);
		};

		const AdminRoutes = function () {
			adminRouter(req, res, next);
		};

		if (apiSource === "user") UserRoutes();
		else if (apiSource === "admin") AdminRoutes();
		else next();
	});
};
