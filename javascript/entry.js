"use strict";

require('../styles/style.scss');
import { Timeline } from "./timeline.js";


let data = {
	duration: 15,
	grid: 0.1,
	tracks: [{
		name: "position_x",
		keyFrames: [{
			time: 1,
			value: 10
		}, {
			time: 3,
			value: 10
		}, {
			time: 2,
			value: 20
		}]
	}, {
		name: "rotation",
		keyFrames: [{
			time: 1,
			value: 12.4433
		}]
	}]
};

function injectTestData(data) {
	for (let t = 0; t < 10; t++) {
		let tData = {
			name: "unnamed",
			keyFrames: []
		};
		for (let k = 0; k < 20; k++) {
			tData.keyFrames.push({
				time: Math.random() * data.duration,
				value: Math.random() * 10,
				tween: Math.random() < .25 ? "linear" : "none"
			});
		}
		data.tracks.push(tData);
	}
	return data;
}



function main() {
	console.clear();
	console.log("Hello, Timeline!");

	data = injectTestData(data);

	$(".timeline").each(function AttachTimeline() {
		let t = new Timeline(this, data);
		t.on("test", (a,b,c)=>console.log("test",a,b,c));
	});
}
$(main);

// data.dataChanged = function(data) {
// 	$(".json-view").text(JSON.stringify(data, null, ' '));
// };








