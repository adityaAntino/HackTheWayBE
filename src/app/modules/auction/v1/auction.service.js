const mongoose = require("mongoose");
const AuctionModel = require("./auction.model");
const { Response } = require("../../../common/helpers/serviceResponse.Handler");
const { blockChainStatus } = require("../../../common/utils/enums");

const addNewAuction = async function ({ itemName, initialPrice, itemInfo, userId, endTime, status }) {
	const auction = await AuctionModel.create({
		auctioneer: mongoose.Types.ObjectId(userId),
		itemDescription: { itemName, initialPrice, itemInfo },
		endTime,
		status,
	});

	if (!auction) return Response(false, "Error in creating new auction");
	return Response(true, "New Auction Created", auction);
};

const editAuction = async function (id, { chain, winningBid, status }) {
	const auction = await AuctionModel.findByIdAndUpdate(
		mongoose.Types.ObjectId(id),
		{ chain, winningBid, status },
		{ new: true }
	);

	if (!auction) return Response(false, "Error in editing auction");
	return Response(true, "Auction is updated", auction);
};

const fetchAllAuctions = async function (userId) {
	const auctions = await AuctionModel.find({ auctioneer: mongoose.Types.ObjectId(userId) });
	if (!auctions.length) return Response(false, "Error in fetching auction");
	return Response(true, "Auction is fetched", auctions);
};

const fetchAllBids = async function (userId) {
	let auctions = await AuctionModel.find({ bidder: mongoose.Types.ObjectId(userId) });

	auctions = auctions.map((elem) => {
		return {
			...elem._doc,
			auctioneer: elem.auctioneer.name,
			won: elem.winningBid?.user.toString() == userId.toString(),
		};
	});

	if (!auctions) return Response(false, "Error in fetching auction");
	else if (!auctions.length) return Response(false, "No data found");
	return Response(true, "Auction is fetched", auctions);
};

const fetchAuctions = async function () {
	let auctions = await AuctionModel.find().populate("auctioneer");

	auctions = auctions.map((elem) => {
		return { ...elem._doc, auctioneer: elem.auctioneer.name };
	});

	if (!auctions) return Response(false, "Error in fetching auction");
	else if (!auctions.length) return Response(false, "No data found");
	return Response(true, "Auction is fetched", auctions);
};

const auctionStatusCount = async function () {
	let auctions = Promise.all([
		AuctionModel.find({ status: blockChainStatus.start }).countDocuments(),
		AuctionModel.find({ status: blockChainStatus.running }).countDocuments(),
		AuctionModel.find({ status: blockChainStatus.end }).countDocuments(),
	]);

	auctions = {
		[blockChainStatus.start]: auctions[0] || 0,
		[blockChainStatus.running]: auctions[1] || 0,
		[blockChainStatus.end]: auctions[2] || 0,
	};

	return Response(true, "Auction is fetched", auctions);
};

const addBidder = async function (auctionId, userId) {
	const auction = await AuctionModel.findOneAndUpdate(
		{
			_id: mongoose.Types.ObjectId(auctionId),
		},
		{
			$push: {
				bidder: mongoose.Types.ObjectId(userId),
			},
			status: blockChainStatus.running,
		}
	);
	if (!auction) Response(false, "No auction found");
	return Response(true, "Bidder is added", auction);
};

const FetchAllAuctions = async function (offset, limit, match, query) {
	const auctions = await AuctionModel.aggregate([
		{
			$match: query,
		},
		{
			$lookup: {
				from: "users",
				localField: "auctioneer",
				foreignField: "_id",
				as: "auctioneer",
			},
		},
		{
			$unwind: { path: "$auctioneer" },
		},
		{
			$match: {
				"auctioneer.name": { $regex: `^${match}`, $options: "i" },
			},
		},
		{
			$facet: {
				metadata: [{ $count: "total" }],
				auctions: [
					{ $skip: offset },
					{ $limit: limit },
					{
						$project: {
							chain: 0,
							bidder: 0,
						},
					},
				],
			},
		},
		{
			$addFields: {
				metadata: {
					$cond: [{ $eq: ["$metadata", []] }, [{ total: 0 }], "$metadata"],
				},
			},
		},
	]);
	if (auctions.length) Response(false, "No auctions found");
	return Response(true, "auctions fetched", auctions);
};

const GetBiddersCount = async function (id) {
	const auctions = await AuctionModel.findById(mongoose.Types.ObjectId(id)).select("bidder");

	if (!auctions) return Response(false, "Error in fetching auction");
	const count = auctions.bidder.length;
	return Response(true, "Auction is fetched", { count });
};

module.exports = {
	addNewAuction,
	editAuction,
	fetchAllAuctions,
	addBidder,
	fetchAllBids,
	fetchAuctions,
	FetchAllAuctions,
	auctionStatusCount,
	GetBiddersCount,
};
