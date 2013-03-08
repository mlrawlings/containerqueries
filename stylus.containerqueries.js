var stylus = require( 'stylus' );
var containerqueries = require( './containerqueries.parse' );

module.exports = function( css, options ) {
	var renderer = stylus( css, options );
	var render = renderer.render;
	renderer.render = renderHook( renderer );
	return renderer;
}

for( prop in stylus ) {
	module.exports[ prop ] = stylus[ prop ];
}

module.exports.render = function( css, options, fn ) {
	if ('function' == typeof options) fn = options, options = {};
	module.exports( css, options ).render( fn );
}

function renderHook( renderer ) {
	var render = renderer.render;
	return function( fn ) {
		renderer.str = preHook( renderer.str );
		render.call( renderer, function( err, css ) {
			var compiled = postHook( css );
			fn( err, compiled.css || css, compiled.js );
		} );
	};
};

function preHook( css ) {
	return css;
}

function postHook( css ) {
	return containerqueries( css );
}