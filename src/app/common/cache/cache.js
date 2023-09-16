const storedBlockChains = {};

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
