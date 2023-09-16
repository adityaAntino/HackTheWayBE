const AuctionModel = require("../../modules/auction/v1/auction.model");
const { Blockchain } = require("../utils/blockchain");
const storedBlockChains = {};

(async function () {
	const response = await AuctionModel.find({ status: "Paused" });
	response.forEach((elem) => {
		const blockchain = new Blockchain();
		blockchain.chain = elem.chain;
		storedBlockChains[elem._id] = blockchain;
	});
	await AuctionModel.updateMany({ status: "Paused" }, { status: "ongoing", chain: null });
})();

exports.getValue = function (key) {
	return storedBlockChains[key];
};

exports.setEntry = function (key, value) {
	storedBlockChains[key] = value;
	console.log(storedBlockChains);
};
exports.deleteEntry = function (key) {
	delete storedBlockChains[key];
};

exports.safeClose = async function () {
	Object.keys(storedBlockChains).forEach(async (key) => {
		const blockchain = storedBlockChains(key);
		const id = blockchain.getGenesisBlock().data.auctionId;
		await AuctionService.editAuction(id, { chain: blockchain.getChain(), status: "Paused" });
	});
};
