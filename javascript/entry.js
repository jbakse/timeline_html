require('../styles/style.scss');
import { Timeline } from "./timeline.js";

$(main);

function main() {
	console.clear();
	console.log("Hello.");

	$(".timeline").each(function() {
		let t = new Timeline(this, data);
	});

}

var data = {
	duration: 10,
	tracks: [{
		name: "position_x",
		keyFrames: [
			{time: 1, value: 10},
			{time: 2, value: 5}
		]
	}, {
		name: "rotation"
	}]
};
