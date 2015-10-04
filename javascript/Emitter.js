"use strict";

export var Emitter = {};


Emitter.on = function(event, handler) {	
	this._events = this._events || {};
	this._events[event] = this._events[event] || [];
	this._events[event].push(handler);
	return this;
};

Emitter.off = function(event, handler) {
	_.pull(this._events[event], handler); 
	return this;

};

Emitter.trigger = function(event, ...args) {
	if (!this._events || !this._events[event]) {
		return this;
	}
	_.invoke(this._events[event], "apply", undefined, args);
	return this;
};
