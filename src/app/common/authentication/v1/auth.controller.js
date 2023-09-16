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

const VerifyToken = Wrapper(async (req, res, next) => {
	if (!req.headers.authorization) return res.error.BadRequest("No token found in authorization header!");

	if (!req.headers.authorization.startsWith("Bearer "))
		return res.error.BadRequest("Token format not correct !! Only Bearer token is accepted");

	const idToken = req.headers.authorization.split("Bearer ")[1];

	const platform = req.get("Platform");

	try {
		const decodedToken = jwt.verify(idToken, env.JWT_TOKEN);

		const userInDb = await UserService.GetUserFromMobile({ mobileNo: decodedToken.mobileNo, userType: platform });

		if (!userInDb) return res.error.BadRequest(`No user found with ${decodedToken.mobileNo} Phone Number`);

		req.user = userInDb.data;
		next();
	} catch (err) {
		return res.error.Unauthorized("Not Authorized", err);
	}
});


module.exports = {
	SendOTP,
	VerifyOTP,
	VerifyToken,
};
