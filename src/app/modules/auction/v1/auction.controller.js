const _service = require("./auction.service");
const { Wrapper } = require("../../../common/helpers/serviceResponse.Handler");
const { Blockchain, Block } = require("../../../common/utils/blockchain/blockchain");
const { blockChainStatus } = require("../../../common/utils/enums");
const UserService = require("../../user/v1/user.service");
const moment = require("moment");

let auctionChain = null;

const InitializeAuction = Wrapper(async function (req, res) {
	if (auctionChain) return res.error.NotFound("One auction is already going on");

	const { itemName, initialPrice, itemInfo, duration } = req.body;
	const userId = req.user._id;

	const endtime = moment().add(duration, "hours").format("DD-MM-YYYYTHH:mm:ss") + "Z";

	const auction = await _service.addNewAuction({ itemName, initialPrice, itemInfo, userId });

	if (auction.status === false) return res.error.NotAcceptable(auction.message);

	auctionChain = new Blockchain({
		itemName,
		initialPrice,
		itemInfo,
		endTime: endtime,
		auctionId: auction.data._id,
		auctioneer: userId,
		status: blockChainStatus.start,
	});

	res.success.Created("Auction has started");
});

const BidOnAuction = Wrapper(async function (req, res) {
	if (!auctionChain) return res.error.NotFound("No auction is going on for bid");

	const { BidAmount } = req.body;
	const userId = req.user._id;

	const { auctioneer: auctioneerId, auctionId, initialPrice } = auctionChain.getGenesisBlock().data;

	const endtime = auctionChain.getGenesisBlock().data.endTime;
	const currentTime = moment().format("DD-MM-YYYYTHH:mm:ss") + "Z";

	if (endtime < currentTime) {
		const userName = await UserService.GetSingleUser(auctioneerId);

		await closeAuctionAndMarkNull(userName, initialPrice);
		return res.error.BadRequest("Bidding is now closed");
	}

	if (userId.toString() == auctioneerId.toString())
		return res.error.NotAcceptable("You cannot place bid in your own auction");

	if (auctionChain.isChainValid()) {
		if (Number(BidAmount) > Number(auctionChain.getGenesisBlock().data.initialPrice)) {
			auctionChain.addBlock(
				new Block(null, null, { amount: BidAmount, userId, status: blockChainStatus.running })
			);
			await _service.addBidder(auctionId, userId);
		} else {
			return res.error.BadRequest(
				`Your bid amount should be greater than ${auctionChain.getGenesisBlock().data.initialPrice}`
			);
		}
	} else {
		return res.error.Conflict("We will get back to you");
	}

	res.success.OK("Your bid is placed");
});

const CloseAuction = Wrapper(async function (req, res) {
	if (!auctionChain) return res.error.NotFound("No auction Found");

	const response = auctionChain.getTheHighestBidder();
	if (response.status === false) {
		return res.error.BadRequest(response.message);
	}

	const { user, bidAmount } = response.data;

	const userData = await UserService.GetSingleUser(user);

	if (userData.status === false) return res.error.BadRequest("No User found");

	const responseToSend = {
		userName: userData.data.name,
		highestBidPlaced: bidAmount,
	};

	auctionChain.addBlock(
		new Block(null, null, { userName: userData.data.name, bidAmount, status: blockChainStatus.end })
	);

	await closeAuctionAndMarkNull(userData, bidAmount);
	res.success.OK("Your bid is now closed", responseToSend);
});

const FetchAllMyAuctions = Wrapper(async function (req, res) {
	const userId = req.user._id;
	const fetchMyAuctions = await _service.fetchAllAuctions(userId);

	if (fetchMyAuctions.status === false) return res.error.NotFound("No data Found");
	res.success.OK("Fetched Successfully", fetchMyAuctions.data);
});

const FetchAllMyBids = Wrapper(async function (req, res) {
	const userId = req.user._id;
	const fetchMyBids = await _service.fetchAllBids(userId);

	if (fetchMyBids.status === false) return res.error.NotFound("No data Found");
	res.success.OK("Fetched Successfully", fetchMyBids.data);
});

const FetchCurrentRunningAuctions = Wrapper(async function (req, res) {
	if (!auctionChain) return res.error.NotFound("No auction Found");

	const auctionData = auctionChain.getGenesisBlock().data;
	const owner = await UserService.GetSingleUser(auctionData.auctioneer);

	if (owner.status === false) return res.error.BadRequest("No Auctioneer found");

	auctionData.owner = owner.data.name;

	const arrToReturn = [];
	let data = 7;

	while (data > 0) {
		arrToReturn.push(auctionData);
		data -= 1;
	}
	res.success.OK("Fetched Succefully", arrToReturn);
});

module.exports = {
	InitializeAuction,
	BidOnAuction,
	CloseAuction,
	FetchAllMyAuctions,
	FetchCurrentRunningAuctions,
	FetchAllMyBids,
};
const closeAuctionAndMarkNull = async function (userData, bidAmount) {
	const auctionId = auctionChain.getGenesisBlock().data.auctionId;

	await _service.editAuction(auctionId, {
		chain: auctionChain.getChain(),
		winningBid: { user: userData.data._id, amount: bidAmount },
	});

	auctionChain = null;
};

