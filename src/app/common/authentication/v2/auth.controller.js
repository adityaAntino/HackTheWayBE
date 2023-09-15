const { verifyAdminToken, checkPermission, checkSuperAdmin } = require("./auth.admin");
const { verifyAgentToken, agentLogin, checkAgentPermission } = require("./auth.agent");
const { verifyLawyerToken, forgotPassword, resetPassword } = require("./auth.lawyer");
const { verifyToken } = require("./auth.user");

module.exports = {
	verifyAdminToken,
	checkPermission,
	checkSuperAdmin,
	verifyAgentToken,
	checkAgentPermission,
	verifyLawyerToken,
	forgotPassword,
	resetPassword,
	verifyToken,
};
