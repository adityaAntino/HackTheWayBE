const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		mobileNo: {
			type: String,
			unique: true,
		},
		userType: {
			type: String,
			enum: ["bidder", "auctioneer", "admin"],
			default: "bidder",
		},
	},
	{ timestamps: true }
);

module.exports = User = mongoose.model("user", userSchema);
