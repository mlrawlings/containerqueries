var fs = require( 'fs' );
var http = require( 'http' );
var static = require( 'node-static' );
var stylus = require( '../stylus.containerqueries' );

var fileServer = new static.Server( './' );

var server = http.createServer( function ( request, response ) {
    request.addListener( 'end', function () {
    	console.log( request.url );
    	if( request.url === '/containerqueries.core.js' ) {
    		fileServer.serveFile( '../containerqueries.core.js', 200, {}, request, response );
    	}
        else {
        	fileServer.serve( request, response );
        }
    });
});

server.listen( 8000 );

fs.readFile( 'style.styl', function( err, data ) {
	stylus.render( String( data ), function( err, css, js ) {
		fs.writeFile( './compiled/styles.css', css );
		fs.writeFile( './compiled/containerqueries.rules.js', js );
	});
} );

//fs.createReadStream( '../containerqueries.js' ).pipe( fs.createWriteStream( './compiled/containerqueries.js' ) );