const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
		},
		mobileNo: {
			type: String,
		},
		gender: String,
		email: String,
		userType: {
			type: String,
			enum: ["user", "admin"],
			default: "user",
		},
	},
	{ timestamps: true }
);

module.exports = User = mongoose.model("user", userSchema);
