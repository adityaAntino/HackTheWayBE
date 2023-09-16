const express = require("express");

const _controller = require("./auction.controller");
const { VerifyToken } = require("../../../common/authentication/v1/auth.controller");

const prefix = "/api/v1/auction";

const userRouter = express.Router();
const adminRouter = express.Router();

userRouter.post("/", _controller.InitializeAuction);
userRouter.post("/:auctionId/bid", _controller.BidOnAuction);
userRouter.get("/:auctionId/bid-count", _controller.GetBidCount);
userRouter.post("/:auctionId/close", _controller.CloseAuction);
userRouter.get("/", _controller.FetchCurrentRunningAuctions);

// userRouter.get("/open", _controller.FetchCurrentRunningAuctions);

adminRouter.get("/", _controller.FetchAllAuctions);

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
