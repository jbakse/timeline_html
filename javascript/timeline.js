export function Timeline(element, data = {}) {
	console.log("Construct Timeline");
	
	this._element = $(element);
	this._duration = 60;
	this._scale = 100;
	this._tracks = [];
	this._ruler = new Ruler(this);

	this._draw();

	// slider
	let that = this;
	this._slider = $('<input type="range" value="100" min="10" max="100">');
	this._element.after(this._slider);
	this._slider.on("input", function() {
		that.setScale($(this).val());
	} );

	// scrolling
	this._element.find(".track-scroll").scroll( (e) => {
		this._element.find(".track-labels").scrollTop(this._element.find(".track-scroll").scrollTop());
		this._element.find(".ruler-scroll").scrollLeft(this._element.find(".track-scroll").scrollLeft());
	});

	this.loadData(data);
}

Timeline.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		duration: 60,
		tracks: []
	});
	this._duration = data.duration;
	
	console.log(data.tracks);
	_.forEach(data.tracks, (trackData) => {
			let t = new Track(this, trackData);
			this._tracks.push(t);
		}
	);

	this._draw();
};

Timeline.prototype.setScale = function(scale) {
	this._scale = scale;
	this._draw();
};

Timeline.prototype._draw = function() {
	this._ruler._draw();

	this._tracks.forEach( function(t) {
		t._draw();
	});
};


function Track(timeline, data = {}) {
	console.log("Construct Track");

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
		let k = new KeyFrame(this, keyFrameData);
		this._keyFrames.push(k);
	});

};

Track.prototype.setName = function(name) {
	this._name = name;
	console.log(this);
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

	this._element = $('<div class="ruler"></div>');
	this._timeline._element.find(".ruler-scroll").append(this._element);
}

Ruler.prototype._draw = function() {
	let width = this._timeline._duration * this._timeline._scale;
	this._element.width(width);

	//populate
	this._element.empty();
	// this.keyFrames = [];

	let targetSpacing = 100;
	let ticks = Math.floor(width / targetSpacing);
	let spacing = (width / ticks).toFixed(2);
	let spacingSeconds = spacing / this._timeline._scale;
	
	for(let i = 0; i < ticks; i++) {
		let label = Number((spacingSeconds * i).toFixed(2)) + " s"

		let k = new KeyFrame(this, {
			time: i * spacingSeconds,
			element: $('<div class="tick"></div>').text(label)
		});
		k._draw();
		console.log("k", k);
	}

	
	
};



function KeyFrame(track, data = {}) {
	console.log("Construct Keyframe");

	this._track = track;
	
	this.loadData(data);


}

KeyFrame.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		time: 0,
		value: 0,
		element: $('<div class="key-frame"></div>')
	});
	
	this._element = data.element;
	this._track._element.append(this._element);
	this._mousedownHandler = this.mousedown.bind(this);
	this._element.mousedown(this._mousedownHandler);

	this._time = data.time;
	this._value = data.value;
};

KeyFrame.prototype.setTime = function(time) {
	this._time = time;
	this._draw();
};

KeyFrame.prototype._draw = function() {
	this._element.css("left", this._time * this._track._timeline._scale + "px");
};

KeyFrame.prototype.mousedown = function(e) {
	// console.log("mousedown", this);

	let mouseX = e.pageX - this._element.parent().position().left;
	this.dragOffsetX = mouseX - this._element.position().left;
	this._element.parent().append(this._element);
	this._mousemoveHandler = this.mousemove.bind(this);
	$(window).mousemove(this._mousemoveHandler);

	this._mouseupHandler = this.mouseup.bind(this);
	$(window).mouseup(this._mouseupHandler);
};



KeyFrame.prototype.mousemove = function(e) {
	let mouseX = e.pageX - this._element.parent().position().left;
	let pos = mouseX - this.dragOffsetX;
	this._time = pos /  this._track._timeline._scale;
	this._draw();
};


KeyFrame.prototype.mouseup = function(e) {
	// console.log("mouseup", this);

	$(window).off("mousemove", this._mousemoveHandler);
	$(window).off("mouseup", this._mouseupHandler);

};
