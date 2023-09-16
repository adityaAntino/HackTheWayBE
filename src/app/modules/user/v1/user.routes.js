const express = require("express");

const _controller = require("./user.controller");
const { VerifyToken } = require("../../../common/authentication/v1/auth.controller");

const prefix = "/api/v1/user";

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.get("/", _controller.GetUser);
userRouter.patch("/", _controller.PatchUser);
userRouter.get("/auctions", _controller.FetchAllMyAuctions);
userRouter.get("/bids", _controller.FetchAllMyBids);

adminRouter.patch("/", _controller.PatchUser);
adminRouter.get("/", _controller.GetUser);

// adminRouter.get("/", _controller.FetchAllAuctions);

module.exports = (app) => {
	app.use(prefix, (req, res, next) => {
		const apiSource = req.get("Platform");

		const UserRoutes = function () {
			VerifyToken(req, res, () => userRouter(req, res, next));
		};

		const AdminRoutes = function () {
			VerifyToken(req, res, () => adminRouter(req, res, next));
		};

		if (apiSource === "user") UserRoutes();
		else if (apiSource === "admin") AdminRoutes();
		else next();
	});
};
