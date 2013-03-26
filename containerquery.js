if( !Date.now ) { Date.now = function now() { return +(new Date); }; }

(function( window, document ) {
	var containerqueries = window.containerqueries = {};
	
	// VARIABLE DECLARATIONS

	var testDiv, documentPixelsPerEm, lastCompleteTestRequest = Date.now() - 1000;
	var loadLoop, nodesWeChanged = [], rules = {}, loadedSheets = {};
	
	// PUBLIC API

	containerqueries.load = function( data ) {
		var selector = data.selector;
		rules[ selector ] = rules[ selector ] || [];
		rules[ selector ].push( { className: data.className, test: data.test } );
	};

	containerqueries.zoomPollTimeout = 300;
	containerqueries.testBuffer = 30;

	containerqueries.watchDOM = canWatchDOM();
	containerqueries.runPeriodically = !canWatchDOM();
	containerqueries.runPeriodicallyTimeout = 500;

	init();

	// STYLESHEET LOADER

	function init() {
		var i, _ref, stylesheets = qsa('link[rel=stylesheet]');
		if( document.addEventListener ) {
			addEvent( document, 'DOMContentLoaded', contentReady );
		} else if( document.attachEvent ) { // Old IE
			addEvent( document, 'readystatechange', contentReady );
		}
		for( i = 0, _ref = stylesheets.length; i < _ref; i++ ) {
			if( stylesheets[ i ].href ) loadStylesheet( stylesheets[ i ] );
		}
		loadLoop = setInterval( runAllTests, containerqueries.testBuffer );
	}

	function loadStylesheet( stylesheet ) {
		var href = stylesheet.href;
		if( !loadedSheets[ href ] ) {
			loadedSheets[ href ] = {
				original: stylesheet
			};
			loadXHR( href, function( xhr ) {
				var rules = createContainerRules( xhr.responseText );
				var style = document.createElement('style');
				style.setAttribute( 'type', 'text/css' );
				if( style.styleSheet ) style.styleSheet.cssText = rules; //oldIE
	     		else style.appendChild( document.createTextNode( rules ) );
	     		document.getElementsByTagName( 'head' )[ 0 ].appendChild( style );
	     		loadedSheets[ href ].additional = style.sheet;
			} );
		}
	}

	function createContainerRules( cssText ) {
		var i, _ref, rule, newRules = '', rules = cssText.match( /[^}]+@container[^}]+\}/g );
		for( i = 0, _ref = rules.length; i < _ref; ++i ) {
			rule = rules[ i ];
			newRules += convertAndWatch( rule );
		}
		return newRules;
	}

	function convertAndWatch( rule ) {
		var i, _ref, data, query, selector, tester, className, selectors = rule.match(/[^,]+@container[^@{,]+/g);
		for( i = 0, _ref = selectors.length; i < _ref; ++i ) {
			selector = selectors[ i ];
			query = getQuery( selector );
			data = {
				selector: selector.substring( 0, selector.indexOf( '@container' ) ).replace( /^\s*|\s*$/g, '' ),
				className: createClassNameFromQuery( query ),
				test: createTestFunction( query )
			};
			containerqueries.load( data );
			rule = rule.replace( /\s*@container\s*/, '.' ).replace( query, data.className );
		}
		return rule;
	}

	function createClassNameFromQuery( query ) {
		return '_cq-'+query.replace( /,/g, ' or ' ).replace( /(\s|\:|\(|\))+/g, '-' ).replace( /^[\s\-]+|[\s\-]+$/g, '' )
			.replace(/(max|min)-(?:aspect-)?(\w)\w+/g, '$1$2');
	}

	function createTestFunction( query ) {
		return new Function( 'container', 'return ' + queryToBooleanStatement( query ) );
	}

	function queryToBooleanStatement( query ) {
		var pattern = '\\(\\s*(max|min)-(?:aspect-)?(width|height|ratio)\\s*:\\s*([\\d\\.]+)(px|em)\\s*\\)';
		return '('+query.replace( RegExp( pattern , 'g' ), function( substring ) {
			var matches = substring.match( RegExp( pattern ) );
			return 'container.' + matches[2] + '.' + matches[4] + ( 
				matches[1] == 'max' ? '<=' : '>=' 
			) + matches[3];
		} ).replace( /\s*and\s*/g, '&&' ).replace( /\s*(,|or)\s*/g, ')||(' ).replace( /^\s+|\s+$/g, '' ) + ')';
	}

	function getQuery( string ) {
		var first, current, ended = false;
		var string = string; var lastRelevant = 0;
		first = current = string.indexOf( '(', string.indexOf( '@container' ) );
		while( !ended && current < string.length ) {
			var character = string[ current ];
			if( character === '(' ) {
				lastRelevant = 0;
				current = string.indexOf( ')', current ) + 1;
			} else if( character.toLowerCase() === 'a' ) {
				if( current + 2 < string.length && string[ current+1 ].toLowerCase() === 'n' && string[ current+2 ].toLowerCase() === 'd' ) {
					lastRelevant = 0;
					current += 3;
				} else {
					ended = true;
				}
			} else if( character === ',' ) {
				lastRelevant = current;
				current++;
			} else if( /\s/.test( character ) ) {
				lastRelevant = current;
				do {
					character = string[ ++current ];
				} while( /\s/.test( character ) );
			} else {
				ended = true;
			}
		}
		return string.substring( first, lastRelevant || current );
	}

	function loadXHR(url, callback) {  
		var xhr = new XMLHttpRequest();  
		xhr.onreadystatechange = function () {  
			if( xhr.readyState === 4 && xhr.status === 200 ) {  
				callback( xhr );  
			}             
		}
		xhr.open('GET', url, true);  
		xhr.send('');  
	}  

	// CLASS APPLICATION

	function contentReady() {
		if( containerqueries.watchDOM ) { 
			DOMWatch(); 
		}
		if( containerqueries.runPeriodically ) { 
			runTestsPeriodically(); 
		} else {
			runAllTests();
			zoomPoll();
		}
		setTimeout( function() {
			clearInterval( loadLoop );
		}, containerqueries.testBuffer * 2 );
		addEvent( window, 'resize', runAllTests );
	}

	function runTestsPeriodically() {
		runAllTests();
		setTimeout( runTestsPeriodically, containerqueries.runPeriodicallyTimeout );
	}

	function zoomPoll() {
		var current = getPixelEquivalent( '1em' );
		if( documentPixelsPerEm != current ) {
			documentPixelsPerEm = current;
			runAllTests();
		}
		setTimeout( zoomPoll, containerqueries.zoomPollTimeout );
	}

	function runAllTests() {
		if( lastCompleteTestRequest + containerqueries.testBuffer <= Date.now() ) {
			lastCompleteTestRequest = Date.now();
			setTimeout( function() {
				runTestsOnElementSubtree( document.body );
			}, containerqueries.testBuffer );
		}
	}

	function runTestsOnElement( element ) {
		if( lastCompleteTestRequest + containerqueries.testBuffer <= Date.now() ) {
			for( selector in rules ) {
				 if( matches( selector, element ) ) {
				 	runQueryTests( selector, element );
				 } 
			}
		}
	}

	function runTestsOnElementSubtree( element ) {
		if( lastCompleteTestRequest + containerqueries.testBuffer <= Date.now() ) {
			for( selector in rules ) {
				var elements = qsa( selector, element );
				for( var i = 0; i < elements.length; i++ ){
					runQueryTests( selector, elements[ i ] );
				}
			}
			containerCache = {};
		}
	}

	function runQueryTests( selector, element ) {
		nodesWeChanged.push( element );
		removeContainerQueryClasses( element );
		testAndAddClasses( element, rules[ selector ] );

		function removeContainerQueryClasses( element ) {
			element.className = element.className.replace( 
				/_cq-[\w-]+|^\s+|\s+$/g, '' 
			).replace( /\s+/g, ' ' );
		}

		function testAndAddClasses( element, rules ) {
			var classes = [];
			var container = getContainerObject( element );
			for( var i = 0; i < rules.length; i++ ) {
				var rule = rules[ i ];
				if( rule.test( container ) ) {
					addClass( element, rule.className );
				}
			}
			
			function getContainerObject( element ) {
				var pixelsPerEm = getPixelEquivalent( '1em', element );
				var pixelsWide = getPixelEquivalent( '100%', element, 'width' );
				var pixelsHigh = getPixelEquivalent( '100%', element, 'height' );
				var container = { 
					width:{
						px: pixelsWide,
						em: pixelsWide / pixelsPerEm
					},
					height:{
						px: pixelsHigh,
						em: pixelsHigh / pixelsPerEm
					},
					ratio: pixelsWide / pixelsHigh
				};
				return container;
			}

			function addClass( element, className ) {
				if( element.className.indexOf( className ) === -1 ) {
					element.className += ' ' + className;
				}
			}
		}
	}

	function getPixelEquivalent( unit, element, dimension ) {
		var dimension = ( dimension || 'width' ).toLowerCase();
		var element = element || document.body;
		var testDiv = getBasicDiv();
        testDiv.style[ dimension ] = unit;
        element.appendChild( testDiv );
        pixelEquivalent = testDiv[ 'offset'+capitalize( dimension ) ];
        element.removeChild( testDiv );
        nodesWeChanged.push( testDiv );
        return pixelEquivalent;
	}

	// DOM WATCHING

	function DOMWatch() {
		var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
		if( MutationObserver ) {
			var observer = new MutationObserver( function( mutations ) {
				var addedNodes = [], removedNodes = [],  changedNodes = [];
				summarizeMutations( mutations, addedNodes, removedNodes, changedNodes )

				for( var i = 0, ref = addedNodes.length; i < ref; i++ ) {
					runTestsOnElement( addedNodes[ i ] );
				}

				for( var i = 0, ref = changedNodes.length; i < ref; i++ ) {
					runTestsOnElement( changedNodes[ i ] );
					runTestsOnElementSubtree( changedNodes[ i ] );
				}
			} );
			observer.observe( document.body, { attributes: true, childList: true, subtree: true } );
		} else if( 'MutationEvent' in window ) {
			addEvent( document.body, 'DOMNodeInserted', onNodesWeDidntChange( function( element ) {
				runTestsOnElement( element );
			} ) );
			addEvent( document.body, 'DOMAttrModified', onNodesWeDidntChange( function( element ) {
				runTestsOnElement( element );
				runTestsOnElementSubtree( element );
			} ) );
		}
	}

	function onNodesWeDidntChange( fn ) {
		return function( event ) {
			var index = nodesWeChanged.indexOf( event.target )
			if( index === -1 ) {
				fn( event.target );
			} else {
				nodesWeChanged = nodesWeChanged.splice( index, 1 );
			}
		};
	}

	function summarizeMutations( mutations, addedNodes, removedNodes, changedNodes ) {
		mutations.forEach( function( mutation ) {
			if( mutation.type === 'attributes' ) {
				if( nodesWeChanged.indexOf( mutation.target ) === -1 ) {
					changedNodes.push( mutation.target );
				}
			} else if( mutation.type === 'childList' ) {
				addOrRemove( mutation.addedNodes, addedNodes, removedNodes );
				addOrRemove( mutation.removedNodes, removedNodes, addedNodes );
			}
		} );
		nodesWeChanged = [];

		function addOrRemove( mutatedList, correspondingList, oppositeList ) {
			for( var i = 0, ref = mutatedList.length; i < ref; i++ ) {
				var index = oppositeList.indexOf( mutatedList[ i ] )
				if( nodesWeChanged.indexOf( mutatedList[ i ] ) === -1 ) {
					if( index === -1 ) {
						correspondingList.push( mutatedList[ i ] );
					} else {
						oppositeList.splice( index, 1 );
					}
				}
			}
		}
	}

	function addEvent( element, eventName, fn ) {
		if( element.addEventListener ) {
			element.addEventListener( eventName, fn, false );
		} else if( element.attachEvent ) { // Old IE
			element.attachEvent( 'on'+eventName, fn );
		}
	}

	function canWatchDOM() {
		return window.MutationObserver 
			|| window.WebKitMutationObserver 
			|| ( 'MutationEvent' in window );
	}

	function getBasicDiv() {
		var div = document.createElement( 'div' );
		div.style.fontSize = '1em';
	    div.style.margin = div.style.padding = '0';
	    div.style.border = 'none';
	    return div;
	}

	function capitalize( string ) {
		return string.charAt( 0 ).toUpperCase() + string.slice( 1 ).toLowerCase();
	}

	function qsa( selector, element ) {
		var element = element || document;
		return element.querySelectorAll ? element.querySelectorAll( selector ) : $( element ).find( selector );
	}

	function matches( selector, element ) {
		var match = document.matches || document.matchesSelector || document.mozMatchesSelector || document.webkitMatchesSelector || document.oMatchesSelector || document.msMatchesSelector;
		return match ? match.call( element, selector ) : $( element ).is( selector );
	}

}( window, document ));