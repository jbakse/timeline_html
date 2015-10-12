"use strict";

import { map, roundTo } from "./utility.js";
import { Emitter } from "./emitter.js";

////////////////////////////////////////////////////////////////////
// Timeline

let mixValues = function(fromValue, toValue, mix) {
	if (typeof fromValue !== typeof toValue) {
		// can't mix
		return fromValue;
	}

	

	if (typeof fromValue === "number") {
		return fromValue + (toValue-fromValue) * mix;
	}

	if (Array.isArray(fromValue) && Array.isArray(toValue) && fromValue.length === toValue.length) {
		let mixArray = [];
		for (let i = 0; i < fromValue.length; i++) {
			mixArray[i] = mixValues(fromValue[i], toValue[i], mix);
		}
		return mixArray;
	}

	// can't mix
	return fromValue;

};


let types = {
	"number": {
		"mixValues": function(fromValue, toValue, mix) {
			return fromValue + (toValue-fromValue) * mix;
		}, 
		"valueTemplate": `<span class="value">{{roundTo(trackValueAtTime(this, time), .01)}}</span>`,
		"inspectorTemplate": `number
			<label>time</label>
			<input name="time" type="number" value="{{activeKeyFrame.data.time}}">

			<label>value</label>
			<input name="value" type="number" value="{{activeKeyFrame.data.value}}">

			<label>tween</label>
			<select name="tween" value="{{activeKeyFrame.data.tween}}">
				<option value="none">None</option> 
				<option value="linear">Linear</option>
			</select>`
	},

	"color": {
		"mixValues": function(fromValue, toValue, mix) {
			let mixedColor = [];
			for (let i = 0; i < fromValue.length; i++) {
				mixedColor[i] = fromValue[i] + (toValue[i]-fromValue[i]) * mix;
			}
			return mixedColor;
		}, 
		"valueTemplate": `
			<span class="value color" style="background:rgba({{roundTo(trackValueAtTime(this, time)[0], 1)}},{{roundTo(trackValueAtTime(this, time)[1], 1)}},{{roundTo(trackValueAtTime(this, time)[2], 1)}},{{roundTo(trackValueAtTime(this, time)[3], 1)}});"></span>
		`,
		"inspectorTemplate": `color
			<label>time</label>
			<input name="time" type="number" value="{{activeKeyFrame.data.time}}">

			<label>value</label>
			<input name="red" type="number" value="{{activeKeyFrame.data.value[0]}}">
			<input name="green" type="number" value="{{activeKeyFrame.data.value[1]}}">
			<input name="blue" type="number" value="{{activeKeyFrame.data.value[2]}}">

			<label>tween</label>
			<select name="tween" value="{{activeKeyFrame.data.tween}}">
				<option value="none">None</option> 
				<option value="linear">Linear</option>
			</select>`
	}
};


export function Timeline(element, data = {}) {
	console.log("Construct Timeline");
	console.log("timeline", this);
	this._element = $(element);
	this.types = types;
	this.loadData(data);
}

_.mixin(Timeline.prototype, Emitter);

Timeline.prototype.loadData = function(data = {}) {
	this.data = _.defaults(data, {
		duration: 60,
		tracks: []
	});
	
	
	this.ractiveData = {
		data: this.data,
		time: 0,
		scale: 50,
		activeKeyFrame: undefined,
		trackValueAtTime: Track.trackValueAtTime,
		roundTo: roundTo,
		types: ["number", "color"]
	};

	//
	// json view

	this.eventRactive = new Ractive({
		data: this.ractiveData,
		magic: true
	});
	// force jsonRactive to notice changes to keyframes, even though they are not directly accessed in template
	this.eventObserver = this.eventRactive.observe('data.tracks.*.keyFrames.*.*', () => {
		if (this.ractiveData.activeKeyFrame && this.ractiveData.activeKeyFrame.track && this.ractiveData.activeKeyFrame.track._draw) {
			this.ractiveData.activeKeyFrame.track._draw();
		}

		this.trigger("datachanged", this.data);
	});


	this.eventObserver = this.eventRactive.observe('time', () => {
		this.trigger("timechanged", this.timeData(this.ractiveData.time));
	});

	//
	// inspector view

	this.inspectorRactive = new Ractive({
		el: this._element.find('.inspector'),
		// template: '#inspector-template',
		template: this.types.number.inspectorTemplate,
		data: this.ractiveData,
		magic: true
	});

	this.inspectorObserver = this.inspectorRactive.observe('activeKeyFrame.*', () => {
		if (this.ractiveData.activeKeyFrame._draw) {
			this.ractiveData.activeKeyFrame._draw();
		}
	});



	//
	// labels view

	this.trackLabelsRactive = new Ractive({
		el: this._element.find('.track-labels'),
		template: '#track-labels-template',
		data: this.ractiveData,
		magic: true
	});
	this.trackLabelObserver = this.trackLabelsRactive.observe('data.tracks.*.keyFrames.*.*', () => {});

	//
	// track controllers

	this._tracks = _.map(data.tracks, (trackData) => {
		return new Track(this, trackData);
	});
	_.invoke(this._tracks, "sort");

	//
	// ruler

	this._ruler = new Ruler(this);

	//
	// playback head

	this._playbackHead = new PlaybackHead(this, {
		time: 1
	});

	//
	// scale slider

	let timeline = this;
	this._slider = this._element.find(".scale");
	this._slider.val(this.ractiveData.scale);
	this._slider.on("input", function() {
		timeline.setScale($(this).val());
	});

	//
	// syncronize scrolling
	
	this._element.find(".track-scroll").scroll( () => {
		this._element.find(".track-labels").scrollTop(this._element.find(".track-scroll").scrollTop());
		this._element.find(".ruler-scroll").scrollLeft(this._element.find(".track-scroll").scrollLeft());
	});
	
	this._draw();
};


Timeline.prototype.timeData = function(time) {
	time = time || this.ractiveData.time;
	let d = {};
	
	_.each(this.data.tracks, (t)=>{
		d[t.name] = Track.trackValueAtTime(t, time);
	});

	return d;
};

Timeline.prototype.setScale = function(scale) {
	this.ractiveData.scale = scale;
	this._draw();
};

Timeline.prototype.setActiveKeyFrame = function(keyFrame) {
	this.ractiveData.activeKeyFrame = keyFrame;
	console.log(keyFrame.track.data.type);
	console.log(this.inspectorRactive);

	this.inspectorRactive.teardown();
	this.inspectorRactive = new Ractive({
		el: this._element.find('.inspector'),
		// template: '#inspector-template',
		template: this.types[keyFrame.track.data.type].inspectorTemplate,
		data: this.ractiveData,
		magic: true
	});

	this.inspectorObserver = this.inspectorRactive.observe('activeKeyFrame.*', () => {
		if (this.ractiveData.activeKeyFrame._draw) {
			this.ractiveData.activeKeyFrame._draw();
		}
	});


	this._element.find(".key-frame").removeClass("active");
	keyFrame._element.addClass("active");
};

Timeline.prototype._draw = function() {
	this._ruler._draw();
	this._playbackHead._draw();
	_.invoke(this._tracks, "_draw");
};






////////////////////////////////////////////////////////////////////
// Track

function Track(timeline, data = {}) {
	this.timeline = timeline;
	this.loadData(data);
}

Track.prototype.loadData = function(data = {}) {
	this.data =  _.defaults(data, {
		name: "unnamed",
		keyFrames: [],
	});
	
	this._element = $('<div class="track"></div>');
	this.timeline._element.find(".track-scroll").append(this._element);

	this._keyFrames = _.map(data.keyFrames, (keyFrameData) => {
		return new KeyFrame(this.timeline, this, keyFrameData);
	});

};

Track.prototype._draw = function() {
	this._element.width(this.timeline.data.duration * this.timeline.ractiveData.scale);
	_.invoke(this._keyFrames, "_draw");
};

Track.prototype.sort = function() {
	this.data.keyFrames =  _.sortBy(this.data.keyFrames, 'time');
	this._keyFrames =  _.sortBy(this._keyFrames, 'data.time');
};


Track.trackValueAtTime = function(track, time) {

	if (track.keyFrames.length === 0) {
		return undefined;
	}


	let rightIndex = 0; // index of the keyframe to the right of `time`
	var leftIndex = 0; // left of `time`
	let value;

	// walk through the keyframes until we find the first one to the right of `time`
	while (rightIndex < track.keyFrames.length && track.keyFrames[rightIndex].time < time) {
		rightIndex++;
	}
	leftIndex = rightIndex - 1;

	if (rightIndex === 0) {
		//first keyframe is after current time
		value = track.keyFrames[0].value;
	}
	else if (rightIndex === track.keyFrames.length) {
		//last keyframe is before current time
		value = track.keyFrames[track.keyFrames.length - 1].value;
	}
	else {
		// time between keyframes, interpolate
		if (track.keyFrames[leftIndex].tween === "linear") {
			let mix = map(time,
				track.keyFrames[leftIndex].time, track.keyFrames[rightIndex].time,
				0, 1);
			value = mixValues(track.keyFrames[leftIndex].value, track.keyFrames[rightIndex].value, mix);

		} else if (track.keyFrames[leftIndex].tween === "none") {
			value = track.keyFrames[leftIndex].value;
		} 
	}

	return value;
};






////////////////////////////////////////////////////////////////////
// Ruler

function Ruler(timeline, options = {}) {
	this.timeline = timeline;

	this.options = _.defaults(options, {
		minSpacing: 75,
	});

	this._element = $('<div class="ruler"></div>');
	this.timeline._element.find(".ruler-scroll").append(this._element);

	this._ticksElement = $('<div class="ticks"></div>');
	this._element.append(this._ticksElement);
}

Ruler.prototype._draw = function() {
	// resize
	let width = this.timeline.data.duration * this.timeline.ractiveData.scale;
	this._element.width(width);

	// remove existing ticks
	this._ticksElement.empty();

	// find the smallest spacing that doesn't put the ticks to close together
	let timeSpacings = [0.1, 0.25, 0.5, 1, 2, 5, 10, 30, 60];
	let timeSpacing = _.find(timeSpacings, (timeSpacing)=> {
		return map(timeSpacing, 0, this.timeline.data.duration, 0, width) > this.options.minSpacing;
	});
	let spacing = map(timeSpacing, 0, this.timeline.data.duration, 0, width);

	// repopulate ticks at that spacing
 	for (let i = 0; i * spacing < width; i++) {
 		let label = Number((i * timeSpacing).toFixed(2));

		new Marker(this.timeline, this._ticksElement, {
			time: i * timeSpacing,
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
	this.data = _.defaults(data, {
		time: 0,
	});
};

Marker.prototype.loadOptions = function(options = {}) {
	this.options = _.defaults(options, {
		element: $('<div class="marker"></div>'),
		locked: true
	});

	this._element = options.element;
	this._parentElement.append(this._element);

	if (!this.options.locked) {
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
	this.data.time = roundTo(ui.position.left / this.timeline.ractiveData.scale, this.timeline.data.grid);
};

Marker.prototype._draw = function() {
	this._element.css("left", this.data.time * this.timeline.ractiveData.scale + "px");
};

Marker.prototype.setTime = function(time) {
	this.data.time = time;
	this._draw();
};


////////////////////////////////////////////////////////////////////
// KeyFrame

function KeyFrame(timeline, track, data = {}, options = {}) {
	Marker.call(this, timeline, track._element, data, options);
	this.track = track;
}

KeyFrame.prototype = Object.create(Marker.prototype);
KeyFrame.prototype.constructor = KeyFrame;

KeyFrame.prototype.loadData = function(data = {}) {
	_.defaults(data, {
		value: 0,
		tween: "linear"
	});
	Marker.prototype.loadData.call(this, data);
};

KeyFrame.prototype.loadOptions = function(options = {}) {
	_.defaults(options, {
		locked: false,
		element: $('<div class="key-frame"></div>'),
		tweenElement: $('<div class="tween-bar"></div>')
	});
	Marker.prototype.loadOptions.call(this, options);

	this._tweenElement = options.tweenElement;
	this._parentElement.append(this._tweenElement);

	this._element.on("mousedown", () => {
		this.timeline.setActiveKeyFrame(this);
	});
};

KeyFrame.prototype._dragHandler = function(e, ui) {
	// convert postion to time and snap to grid
	this.data.time = roundTo(ui.position.left / this.timeline.ractiveData.scale, this.timeline.data.grid);
	ui.position.left = this.data.time * this.timeline.ractiveData.scale;

	this.track.sort();
	this.track._draw();
};

KeyFrame.prototype._draw = function() {
	let position = this.data.time * this.timeline.ractiveData.scale;
	let width = this.timeline.data.duration * this.timeline.ractiveData.scale;
	let endPosition = width;

	let thisFrameIndex = _.indexOf(this.track.data.keyFrames, this.data);
	if (thisFrameIndex < this.track.data.keyFrames.length - 1) {
		endPosition = this.track.data.keyFrames[thisFrameIndex+1].time * this.timeline.ractiveData.scale;
	}

	this._element.css("left", position + "px");
	this._tweenElement.css("left", position + 10 + "px");
	this._tweenElement.css("width", endPosition - position - 12 + "px");
	
	if (endPosition - position - 12 < 14) {
		this._tweenElement.addClass("small");
	} else {
		this._tweenElement.removeClass("small");
	}

	this._tweenElement.removeClass("none linear").addClass(this.data.tween);

	this._element.appendTo(this._parentElement);
};


////////////////////////////////////////////////////////////////////
// Playback Head

function PlaybackHead(timeline, data = {}, options = {}) {
	let parentElement = timeline._element.find(".ruler");
	Marker.call(this, timeline, parentElement, data, options);
}

PlaybackHead.prototype = Object.create(Marker.prototype);
PlaybackHead.prototype.constructor = PlaybackHead;

PlaybackHead.prototype.loadData = function(data = {}) {
	_.defaults(data, {});
	Marker.prototype.loadData.call(this, data);
};


PlaybackHead.prototype.loadOptions = function(options = {}) {
	_.defaults(options, {
		element: $('<div class="playback-head"></div>'),
		locked: false,
		lineElement: $('<div class="playback-line"></div>')
	});
	Marker.prototype.loadOptions.call(this, options);

	this._lineElement = options.lineElement;
	this.timeline._element.find(".track-scroll").append(this._lineElement);
};


PlaybackHead.prototype._dragHandler = function(e, ui) {
	this.timeline.ractiveData.time = roundTo(ui.position.left / this.timeline.ractiveData.scale, this.timeline.data.grid);
	ui.position.left = this.timeline.ractiveData.time * this.timeline.ractiveData.scale;

	//this.timeline.ractiveData.time = ui.position.left / this.timeline.ractiveData.scale;
	this._element.css("left", this.timeline.ractiveData.time * this.timeline.ractiveData.scale + "px");
	this._lineElement.css("left", this.timeline.ractiveData.time * this.timeline.ractiveData.scale + "px");
};

PlaybackHead.prototype._draw = function() {
	this._element.css("left", this.timeline.ractiveData.time * this.timeline.ractiveData.scale + "px");
	this._lineElement.css("left", this.timeline.ractiveData.time * this.timeline.ractiveData.scale + "px");
};



