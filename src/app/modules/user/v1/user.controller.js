const _service = require("./user.service");
const { Wrapper } = require("../../../common/helpers/serviceResponse.Handler");

const PatchUser = Wrapper(async function (req, res) {
	const { name, email, gender } = req.body;
	const userId = req.user._id;

	const response = _service.editUser(userId, { name, email, gender });

	if (response.status === false) return res.error.BadRequest(response.message);

	res.success.OK("Edit successfull", response.data);
});

module.exports = { PatchUser };
