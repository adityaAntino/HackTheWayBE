const _userAuth = require("./auth.user");
const _agentAuth = require("./auth.agent");
const _lawyerAuth = require("./auth.lawyer");
const _adminAuth = require("./auth.admin");
const express = require("express");

const prefix = "/api/v2/auth";

const userRouter = express.Router();
const adminRouter = express.Router();
const lawyerRouter = express.Router();
const associateRouter = express.Router();

associateRouter.post("/associate/login", _agentAuth.agentLogin);
adminRouter.route("/admin/otp/:mobileNo").get(_adminAuth.sendAdminOTP).post(_adminAuth.verifyAdminOTP);
lawyerRouter.route("/lawyer/otp/:mobileNo").get(_lawyerAuth.sendOTP).post(_lawyerAuth.verifyOTP);
userRouter.route("/user/otp/:mobileNo").get(_userAuth.sendOTP).post(_userAuth.verifyOTP);

module.exports = (app) => {
	app.use(prefix, (req, res, next) => {
		const apiSource = req.get("Platform");

		const UserRoutes = function () {
			userRouter(req, res, next);
		};

		const LawyerRoutes = function () {
			lawyerRouter(req, res, next);
		};

		const AdminRoutes = function () {
			adminRouter(req, res, next);
		};

		const AssociateRoutes = function () {
			associateRouter(req, res, next);
		};

		if (apiSource === "user") UserRoutes();
		else if (apiSource === "lawyer") LawyerRoutes();
		else if (apiSource === "admin") AdminRoutes();
		else if (apiSource === "associate") AssociateRoutes();
		else next();
	});
};
