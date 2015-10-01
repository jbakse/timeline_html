export function Timeline(element, data = {}) {
	console.log("Construct Timeline");
	this._element = $(element);
	this.loadData(data);
}

Timeline.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		time: 0,
		duration: 60,
		scale: 100,
		tracks: []
	});

	this.data = data;
	
	this.data.tracks.forEach( function(track) {
		track.keyFrames.sort( function compare(a, b) {
			return a.time < b.time ? -1 : 1;
		});
	});


	this.jsonRactive = new Ractive({
		el: '#json-container',
		template: `{{JSON.stringify(data, null, " ")}}`,
		data: {data: this.data}, /* isolate on data property so output not poluted with ractive attached fields */
		magic: true
	});
	
	// force json to notice changes to keyframes
	this.jsonObserver = this.jsonRactive.observe( 'data.tracks.*.keyFrames.*.*', ()=>{});

// {{data.tracks[0].keyFrames[0].time}}

	this.inspectorRactive = new Ractive({
		el: '.inspector-container',
		template: '#inspector-template',
		data: this,
		magic: true
	});

	this.inspectorObserver = this.inspectorRactive.observe( 'activeKeyFrame.*', ()=>{
		if (this.activeKeyFrame._draw) { this.activeKeyFrame._draw(); }
	});

	var trackValueAtTime = function(track, time){
		console.log("calc");
		let i = 0;
		let value = undefined;

		if (track.keyFrames.length === 0) {
			return undefined;
		}
		



		while(i < track.keyFrames.length && track.keyFrames[i].time < time) {
			i++;
		}

		if (i === 0) {
			value = track.keyFrames[0].value;
		}
		else if (i === track.keyFrames.length) {
			value = track.keyFrames[track.keyFrames.length-1].value;
		}
		else {
			let n = (time - track.keyFrames[i-1].time) / (track.keyFrames[i].time -  track.keyFrames[i-1].time);
			value = track.keyFrames[i-1].value + n * (track.keyFrames[i].value -  track.keyFrames[i-1].value);
		}
		return round(value, .01);
	};


	// i was working here
	this.trackLabelsRactive = new Ractive({
		el: '.track-labels',
		template: '#track-labels-template',
		data: {
			calculate: trackValueAtTime,
			data: this.data
		},
		magic: true
	});
	console.log("tlr", this.trackLabelsRactive);


	this._tracks = [];


	_.forEach(data.tracks, (trackData) => {
			let t = new Track(this, trackData);
			this._tracks.push(t);
		}
	);

	this._ruler = new Ruler(this);
	this._playbackHead = new PlaybackHead(this, {time: 1});
	
	// scale slider
	let that = this;
	this._slider = this._element.find(".scale");
	this._slider.val(data.scale);
	this._slider.on("input", function() {
		that.setScale($(this).val());
	} );

	// syncronize scrolling
	this._element.find(".track-scroll").scroll( (e) => {
		this._element.find(".track-labels").scrollTop(this._element.find(".track-scroll").scrollTop());
		this._element.find(".ruler-scroll").scrollLeft(this._element.find(".track-scroll").scrollLeft());
	});
	// this.updateData();
	this._draw();
};




Timeline.prototype.setScale = function(scale) {
	this.data.scale = scale;
	this._draw();
};

Timeline.prototype.setActiveKeyFrame = function(keyFrame) {
	console.log(this.data);
	this.activeKeyFrame = keyFrame;
	//this.jsonRactive.update();
};

Timeline.prototype._draw = function() {
	this._ruler._draw();
	this._playbackHead._draw();
	this._tracks.forEach( function(t) {
		t._draw();
	});
};




////////////////////////////////////////////////////////////////////
// Track

function Track(timeline, data = {}) {
	this.timeline = timeline;
	this.loadData(data);
}

Track.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		name: "unnamed",
		keyFrames: [],
	});

	this.data = data;
	this._element = $('<div class="track"></div>');
	this.timeline._element.find(".track-scroll").append(this._element);

	// this._labelElement = $('<div class="track-label"></div>');
	// this.timeline._element.find(".track-labels").append(this._labelElement);

	// this.setName(data.name);

	this._keyFrames = [];
	_.forEach(data.keyFrames, (keyFrameData) => {
		let k = new KeyFrame(this.timeline, this, keyFrameData);
		this._keyFrames.push(k);
	});
};

Track.prototype.setName = function(name) {
	this._name = name;
	this._labelElement.text(this._name);
};

Track.prototype._draw = function() {
	this._element.width(this.timeline.data.duration * this.timeline.data.scale);
	this._keyFrames.forEach( function(k) {
		k._draw();
	});
};

// Track.prototype.getData = function() {
// 	let data = {
// 		name: this._name,
// 		keyFrames: []
// 	};

// 	_.forEach(this._keyFrames,  (keyFrame) => {
// 		data.keyFrames.push(keyFrame.getData());
// 	});

// 	return data;

// };




////////////////////////////////////////////////////////////////////
// Ruler

function Ruler(timeline) {
	this.timeline = timeline;

	this._targetSpacing = 75;

	this._element = $('<div class="ruler"></div>');
	this.timeline._element.find(".ruler-scroll").append(this._element);
	
	this._ticksElement = $('<div class="ticks"></div>');
	this._element.append(this._ticksElement);
}

Ruler.prototype._draw = function() {

	let width = this.timeline.data.duration * this.timeline.data.scale;
	this._element.width(width);

	//populate
	this._ticksElement.empty();

	let tickCount = Math.floor(width / this._targetSpacing);
	let tickSpacing = width / tickCount;
	let tickSpacingSeconds = tickSpacing / this.timeline.data.scale;
	tickSpacingSeconds = Math.round(tickSpacingSeconds);
	if (tickSpacingSeconds < 1) {
		tickSpacingSeconds = 1;
	}

	for(let i = 0; tickSpacingSeconds * i < this.timeline.data.duration ; i++) {
		let label = Number((tickSpacingSeconds * i).toFixed(2));

		new Marker(this.timeline, this._ticksElement, {
			time: i * tickSpacingSeconds,
		}, {
			element: $('<div class="tick"></div>').text(label)
		})._draw();
	}	
};


////////////////////////////////////////////////////////////////////
// Marker

function Marker(timeline, parentElement, data = {}, options = {}) {
	this.timeline = timeline;
	this._parentElement = parentElement;
	this.loadData(data);
	this.loadOptions(options);
}

Marker.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		time: 0,
	});
	
	this.data = data;
};

Marker.prototype.loadOptions = function(options = {}) {
	_.defaults(options, {
		element: $('<div class="marker"></div>'),
		locked: true
	});

	this._element = options.element;
	this._parentElement.append(this._element);

	if (!options.locked) {
		this._enableDrag();
	}
};


Marker.prototype._enableDrag = function() {
	this._element.draggable({
		axis: "x",
		cursor: "-webkit-grabbing",
		scroll: true,
		containment: "parent",
		drag: this._dragHandler.bind(this)
	});
	this._element.css("position", "absolute");
};

Marker.prototype._dragHandler = function(e, ui) {
	this.data.time = round(ui.position.left / this.timeline.data.scale, 0.01);
};

Marker.prototype._draw = function() {
	this._element.css("left", this.data.time * this.timeline.data.scale + "px");
};

Marker.prototype.setTime = function(time) {
	this.data.time = time;
	this._draw();
};



function KeyFrame(timeline, track, data = {}, options = {}) {
	Marker.call(this, timeline, track._element, data, options);
	this.track = track;
}

KeyFrame.prototype = Object.create(Marker.prototype);
KeyFrame.prototype.constructor = KeyFrame;

KeyFrame.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		value: 0,
	});

	Marker.prototype.loadData.call(this, data);
	this._value = data.value;

	

	this.update = this.update.bind(this);
};

KeyFrame.prototype.loadOptions = function(options = {}) {
	_.defaults(options, {
		locked: false,
		element: $('<div class="key-frame"></div>')
	});

	Marker.prototype.loadOptions.call(this, options);
	this._element.on("mousedown", ()=>this.timeline.setActiveKeyFrame(this));
};


// KeyFrame.prototype.getData = function() {
// 	let data = {
// 		value: this._value,
// 		time: this._time
// 	};

// 	return data;
// };

KeyFrame.prototype._dragHandler = function(e, ui) {
	// this._time = ui.position.left / this.timeline.data.scale;
	this.data.time = round(ui.position.left / this.timeline.data.scale, 0.1);
	ui.position.left = this.data.time * this.timeline.data.scale;
	

	this.track.data.keyFrames.sort( function compare(a, b) {
		return a.time < b.time ? -1 : 1;
	});
	// console.log(ui.position.left / this.timeline.data.scale, 0.01, round(ui.position.left / this.timeline.data.scale, 0.01));

	// this.timeline.updateData();
};


// @todo: who is calling this?
KeyFrame.prototype.update = function() {
	console.log("update", this._value, this);
	this._draw();
	// this.timeline.updateData();
};



// function inspect(keyframe) {
// 	console.log("rivets", rivets, $(".inspector-container"), keyframe);
// 	if (!inspect.once) {
// 		inspect.data = {};
// 		inspect.data.keyframe = keyframe;
// 		rivets.bind($(".inspector-container")[0], inspect.data);
// 	}
// 	inspect.data.keyframe = keyframe;
// 	inspect.once = true;
// }


function PlaybackHead(timeline, data = {}, options = {}) {
	let parentElement = timeline._element.find(".ruler");
	Marker.call(this, timeline, parentElement, data, options);
}

PlaybackHead.prototype = Object.create(Marker.prototype);
PlaybackHead.prototype.constructor = PlaybackHead;

PlaybackHead.prototype.loadData = function(data = {}) {
	_.defaults(data, {});

	Marker.prototype.loadData.call(this, data);

	this._lineElement = data.lineElement;
	this.timeline._element.find(".track-scroll").append(this._lineElement);
};


PlaybackHead.prototype.loadOptions = function(options = {}) {
	_.defaults(options, {
		element: $('<div class="playback-head"></div>'),
		lineElement: $('<div class="playback-line"></div>'),
		locked: false
	});

	Marker.prototype.loadOptions.call(this, options);

	this._lineElement = options.lineElement;
	this.timeline._element.find(".track-scroll").append(this._lineElement);
};


PlaybackHead.prototype._dragHandler = function(e, ui) {
	this.timeline.data.time = ui.position.left / this.timeline.data.scale;
	this._lineElement.css("left", this.timeline.data.time * this.timeline.data.scale + "px");
};

PlaybackHead.prototype._draw = function() {
	this._element.css("left", this.timeline.data.time * this.timeline.data.scale + "px");
	this._lineElement.css("left", this.timeline.data.time * this.timeline.data.scale + "px");
};


function round(value, grid) {
	return Number((Math.round(value/grid) * grid).toFixed(3));
}
