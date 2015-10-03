export var lerp = function(start, stop, amt) {
	return amt * (stop - start) + start;
};

export var map = function(n, start1, stop1, start2, stop2) {
	return ((n - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
};

export var roundTo = function(value, grid = 1) {
	let decimalPlaces = (('' + grid).split('.')[1] || []).length;
	return Number((Math.round(value / grid) * grid).toFixed(decimalPlaces));
};
