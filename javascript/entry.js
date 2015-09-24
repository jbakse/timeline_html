require('../styles/style.scss');
import {Timeline} from "./timeline.js";

$(main);

function main() {
	console.log("Hello.!");
	
	$(".timeline").each(function() {
		new Timeline(this);
	});
}
