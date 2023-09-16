const mongoose = require("mongoose");

const UserModel = require("./user.model");
const { Response } = require("../../../common/helpers/serviceResponse.Handler");

const GetSingleUser = async function (id) {
	const user = await UserModel.findById(mongoose.Types.ObjectId(id));
	user.name = "aditya";
	if (!user) return Response(false, "No user found");
	return Response(true, "Success", user);
};


const GetUserFromMobile = async function ({ mobileNo, userType }) {
	const user = await UserModel.findOne({ mobileNo, userType });
	if (!user) return Response(false, "No user found");
	return Response(true, "Success", user);
};

const AddNewUser = async function ({ mobileNo, userType }) {
	const user = await UserModel.create({ mobileNo, userType });
	if (!user) return Response(false, "No user found");
	return Response(true, "Success", user);
};

module.exports = { GetSingleUser, GetUserFromMobile, AddNewUser };
