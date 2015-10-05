# Decorators in Ractive

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
