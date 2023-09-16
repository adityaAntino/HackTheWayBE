const mongoose = require("mongoose");
const moment = require("moment");

const userSchema = new mongoose.Schema(
	{
		name: {
			type: String,
			required: true,
		},
		mobileNo: {
			type: String,
			unique: true,
		},
	},
	{ timestamps: true }
);

// auctionSchema.pre("save", async function (next) {
// 	if (!this.serialNo) {
// 		const last = await this.db
// 			.model("votersPledge")
// 			.findOne({ serialNo: { $exists: true } })
// 			.sort({ createdAt: -1 })
// 			.select("-_id serialNo");

// 		const currentDate = moment().format("YYMMDD");
// 		let newSerialNo = currentDate + "0000";
// 		if (last) {
// 			const uniqueNumber = last.serialNo.split("IL")[1];
// 			const date = uniqueNumber.slice(0, 6);

// 			const count =
// 				Number(currentDate) > Number(date) ? "0000" : `${Number(uniqueNumber.slice(6)) + 1}`.padStart(4, "0");
// 			newSerialNo = currentDate + count;
// 		}
// 		this.serialNo = "IL" + newSerialNo;
// 	}
// 	next();
// });

module.exports = User = mongoose.model("user", userSchema);
