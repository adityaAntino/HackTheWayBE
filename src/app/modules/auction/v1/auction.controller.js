const _service = require("./auction.service");
const { Wrapper } = require("../../../common/helpers/serviceResponse.Handler");
const { Blockchain, Block } = require("../../../common/utils/blockchain/blockchain");
const { blockChainStatus } = require("../../../common/utils/enums");
const UserService = require("../../user/v1/user.service");

let auctionChain = null;

const InitializeAuction = Wrapper(async function (req, res) {
	if (auctionChain) return res.error.NotFound("One auction is already going on");

	const { itemName, initialPrice, itemInfo } = req.body;

	const auction = await _service.addNewAuction({ itemName, initialPrice, itemInfo });

	if (auction.status === false) return res.error.NotAcceptable(auction.message);

	auctionChain = new Blockchain({
		itemName,
		initialPrice,
		itemInfo,
		auctionId: auction.data._id,
		status: blockChainStatus.start,
	});

	res.success.Created("Auction has started");
});

const BidOnAuction = Wrapper(async function (req, res) {
	if (!auctionChain) return res.error.NotFound("No auction is going on for bid");

	const { BidAmount } = req.body;
	const userId = Math.floor(Math.random() * (10 - 1)) + 1 || req.user._id;

	if (auctionChain.isChainValid()) {
		if (Number(BidAmount) > Number(auctionChain.getGenesisBlock().data.initialPrice)) {
			auctionChain.addBlock(
				new Block(null, null, { amount: BidAmount, userId, status: blockChainStatus.running })
			);
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

	if (userData.status === false) return res.error.BadRequest("Your Bid is closed but the matching user is not found");

	const responseToSend = {
		userName: userData.data.name,
		highestBidPlaced: bidAmount,
	};

	auctionChain.addBlock(
		new Block(null, null, { userName: userData.data.name, bidAmount, status: blockChainStatus.end })
	);

	const auctionId = auctionChain.getGenesisBlock().data.auctionId;

	console.log(auctionId, userData);
	console.log(auctionChain.getChain());

	await _service.editAuction(auctionId, {
		chain: auctionChain.getChain(),
		winningBid: { user: userData.data._id, amount: bidAmount },
	});

	auctionChain = null;
	res.success.OK("Your bid is now closed", responseToSend);
});

module.exports = { InitializeAuction, BidOnAuction, CloseAuction };
