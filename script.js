$(main);

function main() {
	$(".timeline").each(function() {
		new Timeline(this);
	});

}

function Timeline(element) {
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
	this._tracks.push(new Track(this));
	this._tracks.push(new Track(this));
	this._tracks.push(new Track(this));

	this.draw();
}

Timeline.prototype.setScale = function(scale) {
	this._scale = scale;
	this.draw();
};

Timeline.prototype.draw = function() {
	
	this._tracks.forEach( function(t) {
		t.draw();
	});
};

function Track(timeline) {
	console.log("Construct Track");
	
	this._timeline = timeline;

	this._element = $('<div class="track"></div>');
	this._timeline._element.append(this._element);
	
	this._keyFrames = [];
	var num = Math.random()*15;
	for (var i = 0; i < num; i++) {
		var k = new KeyFrame(this);
		k.setTime(Math.random()*40);
		this._keyFrames.push(k);
	}
}


Track.prototype.draw = function() {
	console.log("draw track", this);
	this._element.width(this._timeline._duration * this._timeline._scale);
	this._keyFrames.forEach( function(k) {
		k.draw();
	});
};

function KeyFrame(track) {
	console.log("Construct Keyframe");

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
	console.log("draw key frame");
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
