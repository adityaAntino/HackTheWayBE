const _lawyerValidator = require("../../../modules/lawyers/lawyer.validator");
const errorParser = require("../../helpers/error.parser");
const { sendOTP, verifyOTP } = require("../../utils/twilio");
const errors = {};
const lawyerModel = require("../../../modules/lawyers/lawyer.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../../../../config/env/config");
const _authValidator = require("./auth.validate");
const { Wrapper } = require("../../handlers/error.handler");
const logger = require("../../logger/logs");
const { sendNotificationToAdmin } = require("../../../modules/notifications/notification.service");

exports.verifyLawyerToken = async (req, res, next) => {
	try {
		if (!req.headers.authorization) return res.error.BadRequest("No token found in authorization header!");

		if (!req.headers.authorization.startsWith("Bearer "))
			return res.error.BadRequest("Token format not correct !! Only Bearer token is accepted");

		const idToken = req.headers.authorization.split("Bearer ")[1];

		const decodedToken = jwt.verify(idToken, env.TOKEN_KEY_LAWYER);

		if (!decodedToken) return res.error.Unauthorized("Invalid Auth Token");

		const lawyer = await lawyerModel.findOne({
			mobileNo: decodedToken.mobileNo,
		});

		if (!lawyer) return res.error.BadRequest(`No lawyer found with mobileNo: ${decodedToken.mobileNo} `);

		req.lawyer = lawyer;
		next();
	} catch (err) {
		return res.error.Unauthorized(err);
	}
};

exports.forgotPassword = Wrapper(async (req, res) => {
	const { error } = _lawyerValidator.forgotPasswordSchema.validate(req.body);

	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const mobileNo = req.body.mobileNo ? req.body.mobileNo : null;
	const email = req.body.email ? req.body.email : null;

	const lawyer = await lawyerModel.findOne({ $or: [{ mobileNo }, { email }] });

	if (!lawyer) return res.error.NotFound("No User found");

	const response = await sendOTP(lawyer.mobileNo);

	if (response.status == true) return res.success.OK(response.message);
	else if (response.status == false) return res.error.BadRequest(response.message);
});

exports.resetPassword = Wrapper(async (req, res) => {
	const { error } = _lawyerValidator.updatePasswordSchema.validate(req.body);

	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const lawyer = await lawyerModel.findById(req.lawyer._id);

	let authentic = await bcrypt.compare(req.body.oldPassword, lawyer.password);
	if (authentic) {
		const encryptedPassword = await bcrypt.hash(req.body.newPassword, 10);

		const updatedLawyer = await lawyerModel.findOneAndUpdate(
			{ email: lawyer.email },
			{ password: encryptedPassword }
		);

		if (!updatedLawyer) return res.error.NotFound("No Lawyer found");
		return res.success.OK("Password Reset successful");
	}

	return res.error.BadRequest("invalid old password");
});

exports.sendOTP = Wrapper(async (req, res, next) => {
	const mobileNo = req.params.mobileNo ?? req.body.mobileNo;
	const countryCode = req.location.countryCode;
	const { error } = _authValidator.sendOTP.validate({ mobileNo, countryCode });

	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const lawyer = await lawyerModel.findOne({ mobileNo });

	if (lawyer) {
		const userStatusCheckResponse = await _checkLawyerStatus;
		if (userStatusCheckResponse.status == false)
			return res.error.Conflict(userStatusCheckResponse.message, userStatusCheckResponse.data);
	}

	const response = await sendOTP(mobileNo);

	return response.status ? res.success.OK(response.message) : res.error.BadRequest(response.message);
});

const _checkLawyerStatus = async function (lawyer) {
	try {
		if (lawyer.isDeleted) {
			return !lawyer.finalDeleteDate
				? Response(false, "Your profile has been locked by India Legal", { status: "banned", check: 1 })
				: Response(false, `Account linked with mobile number ${lawyer.mobileNo} has been deleted`, {
						status: "deleted",
						check: 2,
				  });
		} else if (lawyer.finalDeleteDate < new Date()) {
			lawyerModel.findOneAndUpdate({ mobileNo }, { isDeleted: true });
			return Response(false, `Account linked with mobile number ${lawyer.mobileNo} has been deleted`, {
				status: "deleted",
				check: 2,
			});
		}

		lawyerModel.findOneAndUpdate({ mobileNo }, { $unset: { finalDeleteDate: 1 } });
		return Response(true);
	} catch (error) {
		logger.error("Auth Lawyer", "check lawyer Status", error);
		Response(false);
	}
};

exports.verifyOTP = Wrapper(async (req, res, next) => {
	const { otp } = req.body;
	const { countryCode } = req.location;
	const mobileNo = req.params.mobileNo ?? req.body.mobileNo;

	const { error } = _authValidator.verifyOTP.validate({ otp, mobileNo, countryCode });

	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const response = await verifyOTP(mobileNo, otp);

	if (response.status == false) return res.error.BadRequest(response.message);

	let lawyer = await lawyerModel.findOne({ mobileNo: mobileNo });

	if (!lawyer) {
		lawyer = await lawyerModel.create({ mobileNo: mobileNo });

		const message = require("../../../common/utils/messages").newLawyerAdminNotificataion(mobileNo);
		const page = "Lawyers";
		const tab = "unverified";
		const payload = { lawyerId: lawyer._id };
		sendNotificationToAdmin(lawyer._id, message, page, tab, payload);
	}

	const token = jwt.sign({ mobileNo: mobileNo }, env.TOKEN_KEY_LAWYER, { expiresIn: "30d" });

	return res.success.OK(response.message, { token, ...lawyer.toObject() });
});
