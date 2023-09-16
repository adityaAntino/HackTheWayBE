const mongoose = require("mongoose");
const AuctionModel = require("./auction.model");
const { Response } = require("../../../common/helpers/serviceResponse.Handler");

const addNewAuction = async function ({ itemName, initialPrice, itemInfo }) {
	const auction = await AuctionModel.create({ itemName, initialPrice, itemInfo });

	if (!auction) return Response(false, "Error in creating new auction");
	return Response(true, "New Auction Created", auction);
};

const editAuction = async function (id, { chain, winningBid }) {
	const auction = await AuctionModel.findByIdAndUpdate(
		mongoose.Types.ObjectId(id),
		{ chain, winningBid },
		{ new: true }
	);

	if (!auction) return Response(false, "Error in editing auction");
	return Response(true, "Auction is updated", auction);
};
module.exports = { addNewAuction, editAuction };