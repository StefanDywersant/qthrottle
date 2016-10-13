var q = require('q');

module.exports = function(limit, progress) {

	
	function QThrottle(limit) {


		var queue = [];


		var running = 0;


		this.fapply = function(fn, thisArg, args) {
			var deferred = q.defer();

			queue.push({
				deferred: deferred,
				fn: fn,
				thisArg: thisArg,
				args: args
			});

			run();

			return deferred.promise;
		};


		this.fcall = function(fn, thisArg) {
			var deferred = q.defer();

			queue.push({
				deferred: deferred,
				fn: fn,
				thisArg: thisArg,
				args: Array.prototype.slice.call(arguments, 2)
			});

			run();

			return deferred.promise;
		};


		this.throttlize = function(fns, thisArg) {
			var self = this;

			var wrap = function(fn, thisArg) {
				return function() {
					return self.fapply(fn, thisArg, Array.prototype.slice.call(arguments));
				};
			};

			if (Array.isArray(fns)) {
				return fns.map(function(fn) {
					return wrap(fn, thisArg);
				});
			}

			if (typeof(fns) === 'object') {
				Object.keys(fns)
					.forEach(function(key) {
						fns[key] = wrap(fns[key], thisArg);
					});

				return fns;
			}

			throw new Error('Invalid 1st argument type, expected array or object');
		};


		var run = function() {
			if (running < limit && queue.length > 0) {
				running++;

				if (progress)
					progress(running, queue.length);

				var job = queue.pop();
				job.fn.apply(job.thisArg, job.args)
					.then(function(value) {
						running--;
						job.deferred.resolve(value);
						run();
					})
					.fail(function(error) {
						running--;
						job.deferred.reject(error);
						run();
					});
			} else {
				if (progress)
					progress(running, queue.length);
			}
		};


	}


	return new QThrottle(limit);


};
