export function Timeline(element) {
	console.log("Construct Timeline");
	this._element = $(element);
	this._slider = $('<input type="range" value="100" min="10" max="100">');

	

	var that = this;
	this._slider.on("input", function() {
		that.setScale($(this).val());
	} );


	this._element.after(this._slider);

	this._duration = 50;
	this._scale = 100;
	
	this._tracks = [];
	for (var i = 0; i < 30; i++) {
		this._tracks.push(new Track(this));
	}

	this._ruler = new Ruler(this);


	this.draw();

	this._element.find(".track-scroll").scroll( (e) => {
		this._element.find(".track-labels").scrollTop(this._element.find(".track-scroll").scrollTop());
		this._element.find(".ruler-scroll").scrollLeft(this._element.find(".track-scroll").scrollLeft());
	});
}

Timeline.prototype.setScale = function(scale) {
	this._scale = scale;
	this.draw();
};

Timeline.prototype.draw = function() {
	this._ruler.draw();

	this._tracks.forEach( function(t) {
		t.draw();
	});
};

function Ruler(timeline) {
	this._timeline = timeline;

	this._element = $('<div class="ruler"></div>');
	this._timeline._element.find(".ruler-scroll").append(this._element);
}

Ruler.prototype.draw = function() {
	this._element.width(this._timeline._duration * this._timeline._scale);
	this._element.text("This is some text");
	// this._keyFrames.forEach( function(k) {
	// 	k.draw();
	// });
};


function Track(timeline) {
	console.log("Construct Track");
	
	this._timeline = timeline;

	this._element = $('<div class="track"></div>');
	this._timeline._element.find(".track-scroll").append(this._element);

	this._labelElement = $('<div class="track-label"></div>');
	this._labelElement.text("hi");
	this._timeline._element.find(".track-labels").append(this._labelElement);
	// this._element.before( $('<div class="label">Track X</div>') );
	
	this._keyFrames = [];
	for (var i = 0; i < 50; i++) {
		var k = new KeyFrame(this);
		k.setTime(Math.random()*this._timeline._duration);
		this._keyFrames.push(k);
	}
}


Track.prototype.draw = function() {
	this._element.width(this._timeline._duration * this._timeline._scale);
	this._keyFrames.forEach( function(k) {
		k.draw();
	});
};

function KeyFrame(track) {
	// console.log("Construct Keyframe");

	this._track = track;

	this._time = 0;

	this._element = $('<div class="key-frame"></div>');
	this._track._element.append(this._element);
	
	this._mousedownHandler = this.mousedown.bind(this);
	this._element.mousedown(this._mousedownHandler);
}

KeyFrame.prototype.setTime = function(time) {
	this._time = time;
	this.draw();
};

KeyFrame.prototype.draw = function() {
	this._element.css("left", this._time * this._track._timeline._scale + "px");
};

KeyFrame.prototype.mousedown = function(e) {
	// console.log("mousedown", this);

	var mouseX = e.pageX - this._element.parent().position().left;
	this.dragOffsetX = mouseX - this._element.position().left;
	this._element.parent().append(this._element);
	this._mousemoveHandler = this.mousemove.bind(this);
	$(window).mousemove(this._mousemoveHandler);

	this._mouseupHandler = this.mouseup.bind(this);
	$(window).mouseup(this._mouseupHandler);
};



KeyFrame.prototype.mousemove = function(e) {
	var mouseX = e.pageX - this._element.parent().position().left;
	var pos = mouseX - this.dragOffsetX;
	this._time = pos /  this._track._timeline._scale;
	this.draw();
};


KeyFrame.prototype.mouseup = function(e) {
	// console.log("mouseup", this);

	$(window).off("mousemove", this._mousemoveHandler);
	$(window).off("mouseup", this._mouseupHandler);

};
