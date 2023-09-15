exports.Wrapper = function (fn) {
	return async function wrappedFn(req, res, next) {
		try {
			await fn(req, res);
		} catch (err) {
			next(err);
		}
	};
};
