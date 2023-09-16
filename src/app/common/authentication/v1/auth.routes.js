const express = require("express");

const _controller = require("./auth.controller");

const prefix = "/api/v1/auth";

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.post("/send-otp", _controller.SendOTP);
userRouter.post("/verify-otp", _controller.VerifyOTP);

adminRouter.post("/send-otp", _controller.SendOTP);
adminRouter.post("/verify-otp", _controller.VerifyOTP);

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
