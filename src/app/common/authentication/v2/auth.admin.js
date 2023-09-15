const jwt = require("jsonwebtoken");
const env = require("../../../../config/env/config");
const adminModel = require("../../../modules/admins/admin.model");
const _authValidator = require("./auth.validate");
const errorParser = require("../../helpers/error.parser");
const errors = {};
const { sendOTP, verifyOTP } = require("../../utils/twilio");
const { Wrapper } = require("../../handlers/error.handler");
const logger = require("../../logger/logs");

const _getAdminByMobile = async (mobileNo) => {
	try {
		return await adminModel.findOne({ mobileNo });
	} catch (error) {
		logger.error("Auth Admin", "_getAdminByMobile", error);
		return {};
	}
};

exports.sendAdminOTP = Wrapper(async (req, res) => {
	const mobileNo = req.params.mobileNo ?? req.body.mobileNo;
	const { countryCode } = req.location;

	const { error } = _authValidator.sendOTP.validate({ mobileNo, countryCode });
	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const existingAdmin = await _getAdminByMobile(mobileNo);
	if (!existingAdmin) {
		return res.error.Unauthorized("admin with given mobileNo doesn't exist");
	}
	if (existingAdmin.isDeactivated) return res.error.Unauthorized("your account has been deactivated");

	const response = await sendOTP(mobileNo, countryCode);
	return response.status ? res.success.OK(response.message) : res.error.BadRequest(response.message);
});

exports.verifyAdminOTP = Wrapper(async (req, res) => {
	const { otp } = req.body;
	const { countryCode, name: country } = req.location;
	const mobileNo = req.params.mobileNo ?? req.body.mobileNo;

	const { error } = _authValidator.verifyOTP.validate({ otp, mobileNo, countryCode });
	if (error) return res.error.BadRequest("Incorrect Parameters", errorParser.ValidationError(error));

	const response = await verifyOTP(mobileNo, otp, countryCode);

	if (response.status === false) return res.error.BadRequest(response.message);

	const adminDetails = await _getAdminByMobile(mobileNo);
	if (!adminDetails) {
		return res.error.Unauthorized("admin with given mobileNo doesn't exist");
	}
	const token = jwt.sign({ mobileNo }, env.TOKEN_KEY_ADMIN, { expiresIn: "30d" });

	return res.success.OK(response.message, { admin: adminDetails, token });
});

exports.verifyAdminToken = async (req, res, next) => {
	try {
		if (!req.headers.authorization) return res.error.BadRequest("No token found in authorization header!");

		if (!req.headers.authorization.startsWith("Bearer "))
			return res.error.BadRequest("Token format not correct !! Only Bearer token is accepted");

		const idToken = req.headers.authorization.split("Bearer ")[1];

		const decodedToken = jwt.verify(idToken, env.TOKEN_KEY_ADMIN);

		if (!decodedToken) return res.error.Unauthorized("Invalid Auth Token");

		const admin = await adminModel.findOne({ mobileNo: decodedToken.mobileNo });

		if (!admin) return res.error.BadRequest(`No admin found with mobileNo = ${decodedToken.mobileNo} `);

		req.admin = admin;
		next();
	} catch (err) {
		return res.error.Unauthorized(err);
	}
};

exports.checkPermission = (permissionRequired) => {
	return function (req, res, next) {
		if (req.admin.role === "superAdmin") return next();

		const validPermissions = req.admin.permissions.includes(permissionRequired);

		return validPermissions
			? next()
			: res.error.Unauthorized("Don't have required permission to access this route.");
	};
};

exports.checkSuperAdmin = (req, res, next) => {
	if (req.admin.role === "superAdmin") return next();
	else return res.error.Unauthorized("Don't have required permission to access this route.");
};
