const _service = require("./user.service");
const AuctionService = require("../../auction/v1/auction.service");
const { Wrapper } = require("../../../common/helpers/serviceResponse.Handler");

const PatchUser = Wrapper(async function (req, res) {
	const { name, email, gender } = req.body;
	const userId = req.user._id;

	const response = await _service.editUser(userId, { name, email, gender });
	

	if (response.status === false) return res.error.BadRequest(response.message);

	res.success.OK("Edit successfull", response.data);
});

const FetchAllMyAuctions = Wrapper(async function (req, res) {
	const userId = req.user._id;
	const fetchMyAuctions = await AuctionService.fetchAllAuctions(userId);

	if (fetchMyAuctions.status === false) return res.error.NotFound("No data Found");
	res.success.OK("Fetched Successfully", fetchMyAuctions.data);
});

const FetchAllMyBids = Wrapper(async function (req, res) {
	const userId = req.user._id;
	const fetchMyBids = await AuctionService.fetchAllBids(userId);

	if (fetchMyBids.status === false) return res.error.NotFound("No data Found");
	res.success.OK("Fetched Successfully", fetchMyBids.data);
});
module.exports = { PatchUser, FetchAllMyAuctions, FetchAllMyBids };
