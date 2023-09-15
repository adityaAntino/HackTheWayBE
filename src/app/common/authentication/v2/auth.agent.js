const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const env = require("../../../../config/env/config");
const STATEAGENT = require("../../../modules/agents/models/stateAgent.model");
const DISTRICTAGENT = require("../../../modules/agents/models/districtAgent.model");
const CSCAGENT = require("../../../modules/agents/models/cscAgnet.model");
const ADMIN = require("../../../modules/admins/admin.model");
const BUSINESSAGENT = require("../../../modules/agents/models/businessAssociate.model");
const logger = require("../../../../app/common/logger/logs");
const Response = require("../../utils/serviceResponse.Handler");
const { Wrapper } = require("../../handlers/error.handler");

exports.hashPassword = async (password) => {
	return await bcrypt.hash(password, 10);
};

exports.comparePassword = async (plainPassword, hashedPassword) => {
	return await bcrypt.compare(plainPassword, hashedPassword);
};

exports.generateToken = async (email, index) => {
	try {
		if (index == 0) {
			return jwt.sign({ email: email }, env.TOKEN_KEY_CSC_AGENT, { expiresIn: "1d" });
		} else if (index == 1) {
			return jwt.sign({ email: email }, env.TOKEN_KEY_DISTRICT_AGENT, { expiresIn: "1d" });
		} else if (index == 2) {
			return jwt.sign({ email: email }, env.TOKEN_KEY_STATE_AGENT, { expiresIn: "1d" });
		} else if (index == 3) {
			return jwt.sign({ email: email }, env.TOKEN_KEY_BUSINESS_AGENT, { expiresIn: "1d" });
		} else {
			return "";
		}
	} catch (error) {
		logger.error("Auth Agent", "generate token", error);
		return "";
	}
};

const _decodeToken = (idToken, salt) => {
	try {
		const token = jwt.verify(idToken, salt);
		return { status: true, token };
	} catch (error) {
		return { status: false };
	}
};

exports.verifyAgentToken = async (req, res, next) => {
	try {
		if (!req.headers.authorization) return res.error.BadRequest("No token found in authorization header!");

		if (!req.headers.authorization.startsWith("Bearer "))
			return res.error.BadRequest("Token format not correct !! Only Bearer token is accepted");

		const idToken = req.headers.authorization.split("Bearer ")[1];

		let dataToFind = {};
		let decodedToken = _decodeToken(idToken, env.TOKEN_KEY_ADMIN);
		if (decodedToken.status) {
			const admin = await ADMIN.findOne({ mobileNo: decodedToken.mobileNo });
			if (!admin) return res.error.BadRequest(`No admin found with mobileNo = ${decodedToken.mobileNo} `);
			req.admin = admin;
			dataToFind["_id"] = req.query.id;
		} else {
			decodedToken = _decodeToken(idToken, env.TOKEN_KEY_CSC_AGENT);
			if (!decodedToken.status) decodedToken = _decodeToken(idToken, env.TOKEN_KEY_DISTRICT_AGENT);
			if (!decodedToken.status) decodedToken = _decodeToken(idToken, env.TOKEN_KEY_STATE_AGENT);
			if (!decodedToken.status) decodedToken = _decodeToken(idToken, env.TOKEN_KEY_BUSINESS_AGENT);
			if (!decodedToken) return res.error.Unauthorized("Invalid Auth Token");
			dataToFind["email"] = decodedToken.token.email;
		}
		const agents = await Promise.all([
			CSCAGENT.findOne(dataToFind),
			DISTRICTAGENT.findOne(dataToFind),
			STATEAGENT.findOne(dataToFind),
			BUSINESSAGENT.findOne(dataToFind),
		]);

		let agentData = {};
		for (let i = 0; i < agents.length; i++) {
			if (agents[i] != null) {
				agentData.index = i;
				agentData.agent = agents[i];
				break;
			}
		}

		if (agentData.index == undefined)
			return res.error.BadRequest(`No agent found with email = ${decodedToken.token.email} `);

		if (agentData.index == 0) {
			req.cscAgent = agentData.agent.toJSON();
		} else if (agentData.index == 1) {
			req.districtAgent = agentData.agent.toJSON();
		} else if (agentData.index == 2) {
			req.stateAgent = agentData.agent.toJSON();
		} else if (agentData.index == 3) {
			req.businessAgent = agentData.agent.toJSON();
		}
		next();
	} catch (err) {
		return res.error.Unauthorized(err);
	}
};
const agentLogin = async (username, password) => {
	try {
		const dataToFind = { email: username };
		const agents = await Promise.all([
			CSCAGENT.findOne(dataToFind).select('name email password mobileNo isDeleted isDeactivated type cut state profileImg'),
			DISTRICTAGENT.findOne(dataToFind).select('name email password mobileNo isDeleted isDeactivated type cut state profileImg'),
			STATEAGENT.findOne(dataToFind).select('name email password mobileNo isDeleted isDeactivated type cut state profileImg'),
			BUSINESSAGENT.findOne(dataToFind).select('name email password mobileNo isDeleted isDeactivated type cut state profileImg'),
		]);

		let agentData = {};
		for (let i = 0; i < agents.length; i++) {
			if (agents[i] != null) {
				agentData.index = i;
				agentData.agent = agents[i];
				break;
			}
		}

		if (agentData.index == undefined) return Response(false, "No agent found");
		else if (agentData.agent.isDeleted) return Response(false, "your account has been deleted");
		else if (agentData.agent.isDeactivated) return Response(false, "your account has been deactivated");
		else if (!(await this.comparePassword(password, agentData.agent.password)))
			return Response(false, "Incorrect password");

		agentData.agent.password = undefined;
		const token = await this.generateToken(agentData.agent.email, agentData.index);
		return Response(true, "agent logged in Successfully", {
			token: token,
			agent: agentData.agent,
		});
	} catch (error) {
		logger.error("/common/authentication/auth.agent.js", "agentLogin", error);
		if (error.code === 11000) {
			return Response(false, "error while login agent", "MongoDB");
		} else {
			return Response(false, "error while login agent, Try after some time!");
		}
	}
};

exports.agentLogin = async (req, res, next) => {
	try {
		if (!req.body.username) return res.error.BadRequest("Username is required");
		if (!req.body.password) return res.error.BadRequest("Password is required");

		const response = await agentLogin(req.body.username, req.body.password);
		return response.status === true
			? res.success.OK(response.message, response.data)
			: response.errorType == "MongoDB"
			? res.error.UnprocessableEntity(response.message)
			: res.error.BadRequest(response.message);
	} catch (error) {
		return res.error.Unauthorized(error);
	}
};
exports.checkAgentPermission = (agentTypes) => {
	return function (req, res, next) {
		for (let agent of agentTypes) {
			if (req[`${agent}`]) return next();
		}

		return res.error.Unauthorized("Don't have required permission to access this route.");
	};
};
