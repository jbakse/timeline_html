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
		tracks: [],
		dataChanged: function(){}
	});

	this._time = data.time;
	this._duration = data.duration;
	this._scale = data.scale;
	this._tracks = [];
	_.forEach(data.tracks, (trackData) => {
			let t = new Track(this, trackData);
			this._tracks.push(t);
		}
	);
	this.dataChanged = data.dataChanged;

	this._ruler = new Ruler(this);
	this._playbackHead = new PlaybackHead(this, {time: 1});
	
	// slider
	let that = this;
	this._slider = this._element.find(".scale");
	this._slider.on("input", function() {
		that.setScale($(this).val());
	} );

	// syncronize scrolling
	this._element.find(".track-scroll").scroll( (e) => {
		this._element.find(".track-labels").scrollTop(this._element.find(".track-scroll").scrollTop());
		this._element.find(".ruler-scroll").scrollLeft(this._element.find(".track-scroll").scrollLeft());
	});
	this.updateData();
	this._draw();
};

Timeline.prototype.updateData = function(){
	let d = {
		time: this._time,
		duration: this._duration,
		tracks: []
	};

	_.forEach(this._tracks,  (track)=> {
		d.tracks.push(track.getData());
	});

	this.dataChanged(d);
};


Timeline.prototype.setScale = function(scale) {
	this._scale = scale;
	this._draw();
};

Timeline.prototype._draw = function() {
	this._ruler._draw();
	this._playbackHead._draw();
	this._tracks.forEach( function(t) {
		t._draw();
	});
};


function Track(timeline, data = {}) {
	this._timeline = timeline;
	this.loadData(data);
}

Track.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		name: "unnamed",
		keyFrames: [],
		element: $('<div class="track"></div>'),
		labelElement: $('<div class="track-label"></div>')
	});

	this._element = data.element;
	this._timeline._element.find(".track-scroll").append(this._element);

	this._labelElement = data.labelElement;
	this._timeline._element.find(".track-labels").append(this._labelElement);

	this.setName(data.name);

	this._keyFrames = [];
	_.forEach(data.keyFrames, (keyFrameData) => {
		let k = new KeyFrame(this._timeline, this._element, keyFrameData);
		this._keyFrames.push(k);
	});
};

Track.prototype.getData = function() {
	let data = {
		name: this._name,
		keyFrames: []
	};

	_.forEach(this._keyFrames,  (keyFrame) => {
		data.keyFrames.push(keyFrame.getData());
	});

	return data;

};

Track.prototype.setName = function(name) {
	this._name = name;
	this._labelElement.text(this._name);
};

Track.prototype._draw = function() {
	this._element.width(this._timeline._duration * this._timeline._scale);
	this._keyFrames.forEach( function(k) {
		k._draw();
	});
};


function Ruler(timeline) {
	this._timeline = timeline;

	this._targetSpacing = 75;

	this._element = $('<div class="ruler"></div>');
	this._timeline._element.find(".ruler-scroll").append(this._element);
	
	this._ticksElement = $('<div class="ticks"></div>');
	this._element.append(this._ticksElement);
}

Ruler.prototype._draw = function() {
	let width = this._timeline._duration * this._timeline._scale;
	this._element.width(width);

	//populate
	this._ticksElement.empty();


	
	let ticks = Math.floor(width / this._targetSpacing);
	let spacing = width / ticks;
	let spacingSeconds = spacing / this._timeline._scale;
	spacingSeconds = Math.round(spacingSeconds);


	for(let i = 0; spacingSeconds * i < this._timeline._duration ; i++) {
		let label = Number((spacingSeconds * i).toFixed(2));

		new Marker(this._timeline, this._ticksElement, {
			time: i * spacingSeconds,
			element: $('<div class="tick"></div>').text(label)
		})._draw();
	}	
};



function Marker(timeline, parentElement, data = {}) {
	this._timeline = timeline;
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
	this._time = ui.position.left / this._timeline._scale;
};

Marker.prototype._draw = function() {
	this._element.css("left", this._time * this._timeline._scale + "px");
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

	this._element.on("mousedown", ()=>inspect(this));

	this.update = this.update.bind(this);
};

KeyFrame.prototype.getData = function() {
	let data = {
		value: this._value,
		time: this._time
	};

	return data;
};

KeyFrame.prototype._dragHandler = function(e, ui) {
	this._time = ui.position.left / this._timeline._scale;
	this._timeline.updateData();
};

KeyFrame.prototype.update = function() {
	console.log("update", this._value, this);
	this._draw();
	this._timeline.updateData();
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
	this._timeline._element.find(".track-scroll").append(this._lineElement);
};


PlaybackHead.prototype._dragHandler = function(e, ui) {
	this._time = ui.position.left / this._timeline._scale;
	this._lineElement.css("left", this._time * this._timeline._scale + "px");
};

PlaybackHead.prototype._draw = function() {
	this._element.css("left", this._time * this._timeline._scale + "px");
	this._lineElement.css("left", this._time * this._timeline._scale + "px");
};
