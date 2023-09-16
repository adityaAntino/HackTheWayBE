const mongoose = require("mongoose");

const UserModel = require("./user.model");
const { Response } = require("../../../common/helpers/serviceResponse.Handler");

const GetSingleUser = async function (id) {
	return Response(true, "abcd", {
		_id: "65056af0ca1e2b3c01492e0f",
		name: "aditya",
	});
	const user = await UserModel.findById(mongoose.Types.ObjectId(id));
	if (!user) return Response(false, "No user found");
	return Response(true, "Success", user);
};

module.exports = { GetSingleUser };
