const moment = require("moment");

const _service = require("./auction.service");
const { Wrapper } = require("../../../common/helpers/serviceResponse.Handler");
const { Blockchain, Block } = require("../../../common/utils/blockchain");
const { blockChainStatus } = require("../../../common/utils/enums");
const UserService = require("../../user/v1/user.service");
const { getValue, setEntry, deleteEntry } = require("../../../common/cache/cache");

const InitializeAuction = Wrapper(async function (req, res) {
	const { itemName, initialPrice, itemInfo, duration } = req.body;
	const userId = req.user._id;

	const endtime = moment().add(duration, "hours").format("DD-MM-YYYYTHH:mm:ss") + "Z";

	const auction = await _service.addNewAuction({
		itemName,
		initialPrice,
		itemInfo,
		userId,
		endTime: endtime,
		status: blockChainStatus.start,
	});

	if (auction.status === false) return res.error.NotAcceptable(auction.message);

	const val = new Blockchain({
		itemName,
		initialPrice,
		itemInfo,
		endTime: endtime,
		auctionId: auction.data._id,
		auctioneer: userId,
		status: blockChainStatus.start,
	});

	setEntry(auction.data._id, val);

	res.success.Created("Auction has started");
});

const BidOnAuction = Wrapper(async function (req, res) {
	const id = req.params.auctionId;
	const blockchain = getValue(id);
	if (!blockchain) return res.error.NotFound("No auction is going on for bid");

	const { BidAmount } = req.body;
	const userId = req.user._id;

	const { auctioneer: auctioneerId, auctionId, initialPrice } = blockchain.getGenesisBlock().data;

	const endtime = blockchain.getGenesisBlock().data.endTime;
	const currentTime = moment().format("DD-MM-YYYYTHH:mm:ss") + "Z";

	if (endtime < currentTime) {
		const userName = await UserService.GetSingleUser(auctioneerId);

		await closeAuctionAndMarkNull(userName, initialPrice);
		return res.error.BadRequest("Bidding is now closed");
	}

	if (userId.toString() == auctioneerId.toString())
		return res.error.NotAcceptable("You cannot place bid in your own auction");

	if (blockchain.isChainValid()) {
		if (Number(BidAmount) > Number(blockchain.getGenesisBlock().data.initialPrice)) {
			blockchain.addBlock(new Block(null, null, { amount: BidAmount, userId, status: blockChainStatus.running }));
			setEntry(auctionId, blockchain);
			await _service.addBidder(auctionId, userId);
		} else {
			return res.error.BadRequest(
				`Your bid amount should be greater than ${blockchain.getGenesisBlock().data.initialPrice}`
			);
		}
	} else {
		return res.error.Conflict("We will get back to you");
	}

	res.success.OK("Your bid is placed");
});

const CloseAuction = Wrapper(async function (req, res) {
	const id = req.params.auctionId;
	const blockchain = getValue(id);
	if (!blockchain) return res.error.NotFound("No auction Found");

	const response = blockchain.getTheHighestBidder();

	const { user, bidAmount } = response.data;

	const userData = await UserService.GetSingleUser(user);

	if (userData.status === false) return res.error.BadRequest("No User found");

	const responseToSend = {
		userName: userData.data.name,
		highestBidPlaced: bidAmount,
	};

	blockchain.addBlock(
		new Block(null, null, { userName: userData.data.name, bidAmount, status: blockChainStatus.end })
	);

	await closeAuctionAndMarkNull(userData, bidAmount, blockchain);
	res.success.OK("Your bid is now closed", responseToSend);
});

const FetchCurrentRunningAuctions = Wrapper(async function (req, res) {
	const allRunningBlockchains = await _service.fetchAuctions();

	if (!allRunningBlockchains) return res.error.NotFound("No Running auction found");

	res.success.OK("Fetched Succefully", allRunningBlockchains.data);
});

const FetchAllAuctions = Wrapper(async function (req, res) {
	const { page = 1, limit = 15, match = "", status = blockChainStatus.end } = req.query;
	const offset = (page - 1) * limit;

	const response = await _service.FetchAllAuctions(offset, Number(limit), match, {
		status,
	});

	if (response.status === false) return res.error.NotFound("No data found for given parameters");
	res.success.OK("Success full", response.data[0]);
});

const GetBidCount = Wrapper(async function (req, res) {
	const id = req.params.auctionId;
	const blockchain = getValue(id);
	if (!blockchain) return res.error.NotFound("No auction Found");

	const response = blockchain.getChain().length - 1;

	res.success.OK("Fetched count", { count: response });
});

const closeAuctionAndMarkNull = async function (userData, bidAmount, blockchain) {
	const auctionId = blockchain.getGenesisBlock().data.auctionId;

	await _service.editAuction(auctionId, {
		chain: blockchain.getChain(),
		winningBid: { user: userData.data._id, amount: bidAmount },
		status: blockChainStatus.end,
	});

	deleteEntry(auctionId);
};

const FetchAllAuctionsCount = Wrapper(async function (req, res) {
	const auctions = await _service.auctionStatusCount();
	res.success.OK("Success", auctions.data);
});

module.exports = {
	InitializeAuction,
	BidOnAuction,
	CloseAuction,
	FetchCurrentRunningAuctions,
	FetchAllAuctions,
	GetBidCount,
	FetchAllAuctionsCount,
};

