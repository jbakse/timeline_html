////////////////////////////////////////////////////////////////////
// Timeline

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
	

	this.jsonRactive = new Ractive({
		el: '#json-container',
		template: `{{JSON.stringify(data, null, " ")}}`,
		data: {data: this.data},
		magic: true
	});

	this.inspectorRactive = new Ractive({
		el: '.inspector-container',
		template: `#inspector-template`,
		data: this,
		magic: true
	});

	this.inspectorObserver = this.inspectorRactive.observe( 'activeKeyFrame.*', ()=>{
		if (this.activeKeyFrame._draw) { this.activeKeyFrame._draw(); }
	});

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
	this.activeKeyFrame = keyFrame;
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

	this._element = $('<div class="track"></div>');
	this.timeline._element.find(".track-scroll").append(this._element);

	this._labelElement = $('<div class="track-label"></div>');
	this.timeline._element.find(".track-labels").append(this._labelElement);

	this.setName(data.name);

	this._keyFrames = [];
	_.forEach(data.keyFrames, (keyFrameData) => {
		let k = new KeyFrame(this.timeline, this._element, keyFrameData);
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
			element: $('<div class="tick"></div>').text(label)
		})._draw();
	}	
};


////////////////////////////////////////////////////////////////////
// Marker

function Marker(timeline, parentElement, data = {}) {
	this.timeline = timeline;
	this._parentElement = parentElement;
	this.loadData(data);
}

Marker.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		time: 0,
		element: $('<div class="key-frame"></div>'),
		locked: true
	});
	
	this._time = data.time;
	this._element = data.element;
	this._parentElement.append(this._element);

	if (!data.locked) {
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
	this._time = round(ui.position.left / this.timeline.data.scale, 0.01);
};

function round(value, grid) {
	return Number((Math.round(value/grid) * grid).toFixed(3));
}

Marker.prototype._draw = function() {
	this._element.css("left", this._time * this.timeline.data.scale + "px");
};

Marker.prototype.setTime = function(time) {
	this._time = time;
	this._draw();
};



function KeyFrame(timeline, parentElement, data = {}) {
	Marker.call(this, timeline, parentElement, data);
}

KeyFrame.prototype = Object.create(Marker.prototype);
KeyFrame.prototype.constructor = KeyFrame;

KeyFrame.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		value: 0,
		locked: false
	});

	Marker.prototype.loadData.call(this, data);
	this._value = data.value;

	this._element.on("mousedown", ()=>this.timeline.setActiveKeyFrame(this));

	this.update = this.update.bind(this);
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
	this._time = round(ui.position.left / this.timeline.data.scale, 0.1);
	ui.position.left = this._time * this.timeline.data.scale;

	// console.log(ui.position.left / this.timeline.data.scale, 0.01, round(ui.position.left / this.timeline.data.scale, 0.01));

	// this.timeline.updateData();
};

KeyFrame.prototype.update = function() {
	console.log("update", this._value, this);
	this._draw();
	// this.timeline.updateData();
};



function inspect(keyframe) {
	console.log("rivets", rivets, $(".inspector-container"), keyframe);
	if (!inspect.once) {
		inspect.data = {};
		inspect.data.keyframe = keyframe;
		rivets.bind($(".inspector-container")[0], inspect.data);
	}
	inspect.data.keyframe = keyframe;
	inspect.once = true;
}


function PlaybackHead(timeline, data = {}) {
	let parentElement = timeline._element.find(".ruler");
	Marker.call(this, timeline, parentElement, data);
}

PlaybackHead.prototype = Object.create(Marker.prototype);
PlaybackHead.prototype.constructor = PlaybackHead;

PlaybackHead.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		element: $('<div class="playback-head"></div>'),
		lineElement: $('<div class="playback-line"></div>'),
		locked: false
	});

	Marker.prototype.loadData.call(this, data);

	this._lineElement = data.lineElement;
	this.timeline._element.find(".track-scroll").append(this._lineElement);
};


PlaybackHead.prototype._dragHandler = function(e, ui) {
	this._time = ui.position.left / this.timeline.data.scale;
	this._lineElement.css("left", this._time * this.timeline.data.scale + "px");
};

PlaybackHead.prototype._draw = function() {
	this._element.css("left", this._time * this.timeline.data.scale + "px");
	this._lineElement.css("left", this._time * this.timeline.data.scale + "px");
};
