const Joi = require("joi");

exports.sendOTP = Joi.object().keys({
	mobileNo: Joi.string()
		.min(8)
		.pattern(/^[0-9]+$/)
		.required(),
	countryCode: Joi.string().required(),
});

exports.verifyOTP = Joi.object().keys({
	mobileNo: Joi.string()
		.min(8)
		.pattern(/^[0-9]+$/)
		.required(),
	otp: Joi.string()
		.length(6)
		.pattern(/^[0-9]+$/)
		.required(),
	countryCode: Joi.string().required(),
});

exports.sendAdminOTP = Joi.object().keys({
	mobileNo: Joi.string()
		.length(10)
		.pattern(/^[0-9]+$/)
		.required(),
});

exports.verifyAdminOTP = Joi.object().keys({
	mobileNo: Joi.string()
		.length(10)
		.pattern(/^[0-9]+$/)
		.required(),
	otp: Joi.string()
		.length(6)
		.pattern(/^[0-9]+$/)
		.required(),
});
