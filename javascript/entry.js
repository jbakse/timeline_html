require('../styles/style.scss');
import { Timeline } from "./timeline.js";

$(main);

function main() {
	console.clear();


	data = injectTestData(data);
	main_ractive();
	
}

function injectTestData(data) {
	for (let t = 0; t < 10; t++) {
		let tData = {
			name: "unnamed",
			keyFrames: []
		};
		for (let k = 0; k < 100; k++) {
			tData.keyFrames.push({
				time: Math.random() * 10,
				value: Math.random() * 10
			});
		}
		data.tracks.push(tData);
	}
	return data;
}

function main_ractive(){
	var ractive = new Ractive({
		el: '#container',
		template: template,
		data: {data: data},
		magic: true,
		decorators: {draggable: draggableDecorator}
	});

	ractive.on('activateKeyFrame', function(event) {
		this.set("activeKeyFrame", event.context);
	});
}
var draggableDecorator = function(node, data, scale) {

	$(node).draggable({
		axis: "x",
		cursor: "-webkit-grabbing",
		scroll: true,
		containment: "parent",
		drag: function(e, ui) {
			data.time = ui.position.left / scale;
		}
	});

	$(node).css("position", "absolute");

	return {
		teardown: function() {
			// ...any cleanup work goes here
		}
	};
};


function main_js() {
	console.clear();
	console.log("Hello.");

	$(".timeline").each(function AttachTimeline() {
		data.dataChanged = function(data) {
			// console.log("data changed", data);
			$(".json-view").text(JSON.stringify(data, null, ' '));
		};
		let t = new Timeline(this, data);
	});

}

let template = `
	{{#with data}}
	<div class="timeline noselect">
		<div class="track-legend"></div>
		<div class="ruler-scroll"></div>
		<div class="track-labels">
		{{#each tracks}}
			<div class="track-label">{{name}}</div>
		{{/each}}
		</div>
		<div class="track-scroll">
		{{#each tracks}}
			<div class="track-label">
				{{#each keyFrames}}
					<div 
						class="key-frame" 
						on-mousedown="activateKeyFrame"
						
						data-value={{value}}
					>
					</div>
				{{/each}}
			</div>
		{{/each}}
		</div>
		<input class="scale" type="range" value="{{scale}}" min="10" max="100">
		

	</div>
	{{/with}}


	<div class="inspector-container">
		<label>time</label>
		<input name="time" type="number" value="{{activeKeyFrame.time}}">

		<label>value</label>
		<input name="value" type="number" value="{{activeKeyFrame.value}}">
	</div>
	
	<div class="json-view">{{data}}{{JSON.stringify(data, null, " ")}}</div>
	`;

// decorator='draggable:{{.}},{{scale}}'
// 						style="left: {{time * scale}}px"
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
			value: 5
		}, {
			time: 3,
			value: 2
		}]
	}, {
		name: "rotation"
	}]
};
