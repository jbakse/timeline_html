"use strict";

require('../styles/style.scss');
import { Timeline } from "./timeline.js";

let timeHandle = {
	data: {}
};


let data = {
	duration: 15,
	grid: 0.01,
	tracks: [{
		name: "x",
		type: "number",
		keyFrames: [{
			time: 1,
			value: 100
		}, {
			time: 2,
			value: 200
		}, {
			time: 3,
			value: 300
		}]
	}, {
		name: "y",
		type: "number",
		keyFrames: [{
			time: 1,
			value: 300
		}, {
			time: 2,
			value: 100
		}, {
			time: 3,
			value: 300
		}]
	}, {
		name: "color",
		type: "color",
		keyFrames: [{
			time: 1,
			value: [255,0,0, 255]
		}, {
			time: 2,
			value: [0,255,0, 255]
		}, {
			time: 3,
			value: [0,0,255, 255]
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
				tween: Math.random() < 0.25 ? "linear" : "none"
			});
		}
		data.tracks.push(tData);
	}
	return data;
}




function main() {
	console.clear();
	console.log("Hello, Timeline!");

	// data = injectTestData(data);

	$(".timeline").each(function AttachTimeline() {
		let t = new Timeline(this, data);

		t.on("datachanged", (data) => {
			$("#data-json").text(JSON.stringify(data, null, " "));
		});

		t.on("timechanged", (data) => {
			console.log("timechanged");
			$("#time-json").text(JSON.stringify(data, null, " "));
			timeHandle.data = data;
		});


		let ballRactive = new Ractive({
			data: timeHandle,
			magic: true,
			el: 'stage',
			template: `<div class="ball" style="
				left: {{data.x}}px;
				top: {{data.y}}px;
				background: rgba({{Math.round(data.color[0])}},{{Math.round(data.color[1])}},{{Math.round(data.color[2])}},{{Math.round(data.color[3])}});
			"></div>`
		});
	});
}

$(main);





// data.dataChanged = function(data) {
// 	$(".json-view").text(JSON.stringify(data, null, ' '));
// };
