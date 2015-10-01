require('../styles/style.scss');
import { Timeline } from "./timeline.js";

$(main);

function main() {
	console.clear();


	data = injectTestData(data);
	main_js();
	
}






function main_js() {
	console.clear();
	console.log("Hello.");

	$(".timeline").each(function AttachTimeline() {
		let t = new Timeline(this, data);
	});

}


// data.dataChanged = function(data) {
// 	$(".json-view").text(JSON.stringify(data, null, ' '));
// };



let data = {
	duration: 15,
	scale: 50,
	tracks: [{
		name: "position_x",
		keyFrames: [{
			time: 1,
			value: 10
		}, {
			time: 2,
			value: 20
		}, {
			time: 3,
			value: 10
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
				time: Math.random() * 10,
				value: Math.random() * 10
			});
		}
		data.tracks.push(tData);
	}
	return data;
}
