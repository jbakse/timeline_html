require('../styles/style.scss');
import { Timeline } from "./timeline.js";

$(main);

function main() {
	console.clear();
	console.log("Hello.");

	// for(let t = 0; t < 100; t++) {
	// 	let tData = {name: "unnamed", keyFrames: []};
	// 	for(let k = 0; k < 100; k++) {
	// 		tData.keyFrames.push(
	// 			{time: Math.random() * 10, value: Math.random() * 10}
	// 		);
	// 	}
	// 	data.tracks.push(tData);
	// }

	$(".timeline").each(function AttachTimeline() {
		let t = new Timeline(this, data);
	});

}

let data = {
	duration: 15,
	tracks: [{
		name: "position_x",
		keyFrames: [
			{time: 1, value: 10},
			{time: 2, value: 5},
			{time: 3, value: 2}
		]
	}, {
		name: "rotation"
	}]
};
