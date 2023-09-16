const mongoose = require("mongoose");
const AuctionModel = require("./auction.model");
const { Response } = require("../../../common/helpers/serviceResponse.Handler");

const addNewAuction = async function ({ itemName, initialPrice, itemInfo, userId }) {
	const auction = await AuctionModel.create({
		auctioneer: mongoose.Types.ObjectId(userId),
		itemDescription: { itemName, initialPrice, itemInfo },
	});

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

const fetchAllAuctions = async function (userId) {
	const auctions = await AuctionModel.find({ auctioneer: mongoose.Types.ObjectId(userId) });

	if (!auctions) return Response(false, "Error in fetching auction");
	else if (!auctions.length) return Response(false, "No data found");
	return Response(true, "Auction is fetched", auctions);
};

module.exports = { addNewAuction, editAuction, fetchAllAuctions };
