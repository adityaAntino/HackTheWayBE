const env = require("../../../config/env/config");
const client = require("twilio")(env.TWILIO_ACCOUNT_SID, env.TWILIO_AUTH_TOKEN);
const { Response } = require("../helpers/serviceResponse.Handler");

const sendOTP = async (mobileNo) => {
	try {
		if (process.env.NODE_ENV != "production") return Response(true, "OTP sent successfully");

		await client.verify.v2
			.services(env.VERIFY_SERVICE_SID)
			.verifications.create({ to: `+91${mobileNo}`, channel: "sms" });
		return Response(true, "OTP sent successfully");
	} catch (error) {
		return Response(false, "Error occurred during sending notification:", error);
	}
};

const verifyOTP = async (mobileNo, otp) => {
	try {
		if (process.env.NODE_ENV != "production") return Response(true, "OTP verified successfully", { data: {} });

		const response = await client.verify.v2
			.services(env.VERIFY_SERVICE_SID)
			.verificationChecks.create({ to: `+91${mobileNo}`, code: `${otp}` });

		if (response && response.status === "approved") {
			return Response(true, "OTP verified successfully", { data: {} });
		}

		return Response(false, "Invalid otp");
	} catch (error) {
		return Response(false, "Error occurred during OTP verification", error);
	}
};

module.exports = { sendOTP, verifyOTP };
