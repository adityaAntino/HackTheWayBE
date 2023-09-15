const jwt = require("jsonwebtoken");

const Response = require("../../utils/serviceResponse.Handler");
const env = require("../../../../config/env/config");
const { sendOTP, verifyOTP } = require("../../utils/twilio");
const _authValidator = require("./auth.validate");

const USER = require("../../../modules/users/user.model");
const errorParser = require("../../helpers/error.parser");
const errors = {};
const { Wrapper } = require("../../handlers/error.handler");
const { sendNotificationToAdmin } = require("../../../modules/notifications/notification.service");

const logger = require("../../logger/logs");

exports.sendOTP = Wrapper(async (req, res) => {
	const mobileNo = req.params.mobileNo;
	const countryCode = req.location.countryCode;
	const { error } = _authValidator.sendOTP.validate({ mobileNo, countryCode });
	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const user = await USER.findOne({ mobileNo });

	if (user) {
		const userStatusCheckResponse = await _checkUserStatus;
		if (userStatusCheckResponse.status === false)
			return res.error.Conflict(userStatusCheckResponse.message, userStatusCheckResponse.data);
	}

	const response = await sendOTP(mobileNo, countryCode);
	if (response.status == true) return res.success.OK(response.message);
	return res.error.BadRequest(response.message);
});

const _checkUserStatus = async function (user) {
	try {
		if (user.isDeleted) {
			return !user.finalDeleteDate
				? Response(false, "Your profile has been locked by India Legal", { status: "banned", check: 1 })
				: Response(false, `Account linked with mobile number ${user.mobileNo} has been deleted`, {
						status: "deleted",
						check: 2,
				  });
		} else if (user.finalDeleteDate < new Date()) {
			USER.findOneAndUpdate({ mobileNo }, { isDeleted: true });
			return Response(false, `Account linked with mobile number ${user.mobileNo} has been deleted`, {
				status: "deleted",
				check: 2,
			});
		}

		USER.findOneAndUpdate({ mobileNo }, { $unset: { finalDeleteDate: 1 } });
		return Response(true);
	} catch (error) {
		logger.error("Auth user", "check User Status", error);
		Response(false);
	}
};

exports.verifyOTP = Wrapper(async (req, res) => {
	const { otp } = req.body;

	const { countryCode } = req.location;
	const mobileNo = req.params.mobileNo;
	const { error } = _authValidator.verifyOTP.validate({ otp, mobileNo, countryCode });
	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const response = await verifyOTP(mobileNo, otp, countryCode);

	if (response.status == false) return res.error.BadRequest(response.message);

	let user = await USER.findOne({ mobileNo: mobileNo });

	if (!user) {
		user = await USER.create({ mobileNo, country: req.location._id });

		const message = require("../../utils/messages").newUserAdminNotificataion(mobileNo);
		sendNotificationToAdmin(user._id, message, "Users", "profile", { userId: user._id });
	}
	const token = await jwt.sign({ mobileNo }, env.TOKEN_KEY, {
		expiresIn: "30d",
	});

	return res.success.OK(response.message, {
		token,
		...user.toObject({ virtuals: true }),
		tax: env.TAX_PERCENTAGE,
	});
});

exports.verifyToken = async (req, res, next) => {
	if (!req.headers.authorization) return res.error.BadRequest("No token found in authorization header!");

	if (!req.headers.authorization.startsWith("Bearer "))
		return res.error.BadRequest("Token format not correct !! Only Bearer token is accepted");

	const idToken = req.headers.authorization.split("Bearer ")[1];

	try {
		const decodedToken = jwt.verify(idToken, env.TOKEN_KEY);

		const userInDb = await USER.findOne({
			mobileNo: decodedToken.mobileNo,
		});

		if (!userInDb) return res.error.BadRequest(`No user found with ${decodedToken.mobileNo} Phone Number`);

		if (userInDb.isDeleted) return res.error.Conflict("user already deleted", 409);

		req.user = userInDb;
		next();
	} catch (err) {
		return res.error.Unauthorized(err);
	}
};
