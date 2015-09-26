
// if (!data.locked) {
	// 	this._mousedownHandler = this.mousedown.bind(this);
	// 	this._element.mousedown(this._mousedownHandler);
	// }

KeyFrame.prototype.mousedown = function(e) {
	// console.log("mousedown", this);

	let mouseX = e.pageX - this._element.parent().position().left;
	this._dragOffsetX = mouseX - this._element.position().left;
	this._element.parent().append(this._element);
	this._mousemoveHandler = this.mousemove.bind(this);
	$(window).mousemove(this._mousemoveHandler);

	this._mouseupHandler = this.mouseup.bind(this);
	$(window).mouseup(this._mouseupHandler);
};



KeyFrame.prototype.mousemove = function(e) {
	let mouseX = e.pageX - this._element.parent().position().left;
	let pos = mouseX - this._dragOffsetX;
	this._element.css("left", pos + "px");
	this.dragHandler(pos);
	
};


KeyFrame.prototype.mouseup = function(e) {
	// console.log("mouseup", this);

	$(window).off("mousemove", this._mousemoveHandler);
	$(window).off("mouseup", this._mouseupHandler);

};
