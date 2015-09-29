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
						decorator='draggable:{{.}},{{scale}}'
						style="left: {{time * scale}}px"
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
	
	
	`;
//<div class="json-view">{{data}}{{JSON.stringify(data, null, " ")}}</div>
