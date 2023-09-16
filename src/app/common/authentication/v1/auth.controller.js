const jwt = require("jsonwebtoken");
const env = require("../../../../config/env/config");

const { Wrapper } = require("../../helpers/serviceResponse.Handler");
const { sendOTP, verifyOTP } = require("../../utils/twillio");
const UserService = require("../../../modules/user/v1/user.service");

const SendOTP = Wrapper(async (req, res) => {
	const { mobileNo } = req.body;
	if (!mobileNo) return res.error.BadRequest("No mobile number found");

	const response = await sendOTP(mobileNo);
	if (response.status == true) return res.success.OK(response.message);
	res.error.BadRequest(response.message);
});

const VerifyOTP = Wrapper(async (req, res) => {
	const { mobileNo, otp } = req.body;
	const platform = req.get("Platform");

	const response = await verifyOTP(mobileNo, otp);
	if (response.status == false) return res.error.BadRequest(response.message);

	let user = await UserService.GetUserFromMobile({ mobileNo, userType: platform });

	if (user.status === false) {
		const response = await UserService.AddNewUser({ mobileNo, userType: platform });
		if (response.status === false) return res.error.BadRequest(response.message);
		user = response;
	}

	const token = await jwt.sign({ mobileNo }, env.JWT_TOKEN, {
		expiresIn: "30d",
	});

	res.success.OK(response.message, { token, user: user.data });
});

module.exports = {
	SendOTP,
	VerifyOTP,
};
