exports.Response = function (status, message, data, code) {
	const toReturn = {};
	toReturn.status = status;
	toReturn.message = message;
	toReturn.code = code;
	if (data && data.constructor.name == "String") toReturn.errorType = data;
	else if (data && typeof data == "object") toReturn.data = data;
	return toReturn;
};

exports.Wrapper = function (fn) {
	return async function wrappedFn(req, res, next) {
		try {
			await fn(req, res, next);
		} catch (err) {
			next(err);
		}
	};
};
