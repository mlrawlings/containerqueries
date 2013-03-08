module.exports = getCompiled;

function getCompiled( css ) {
	var selectorRulesAndCss = getSelectorRulesAndCss( css );
	var selectorRules = selectorRulesAndCss.selectors;
	var css = selectorRulesAndCss.css;
	for( var i = 0; i < selectorRules.length; i++ ) {
		selectorRules[ i ] = stringifySelectorRule( selectorRules[ i ] );
	}
	var js = 'containerqueries.load(['+selectorRules.join(',')+']);';
	return { css: css, js: js };
}

function stringifySelectorRule( selectorRule ) {
	return '{selector:"'
		+selectorRule.selector
		+'",className:"'
		+selectorRule.className
		+'",test:'
		+wrapBooleanWithFunction(selectorRule.booleanStatement)
		+'}';
}

function wrapBooleanWithFunction( booleanStatement ) {
	return 'function(container){return ' + booleanStatement + ';}';
}

function getSelectorRulesAndCss( css ) {
	var selectorsObject = {}, selectorsArray = [];

	var css = replaceContainerDirectives( css )

	for( key in selectorsObject ) {
		selectorsArray.push( selectorsObject[ key ] );
	}

	return { css: css, selectors: selectorsArray };

	function replaceContainerDirectives( css ) {	
		var pattern = '([^,\\@\\}]+)\s*\\@container\\s*(\\([^\\{]+)';
		return css.replace( RegExp( pattern , 'g' ), function( substring ) {
			var partMatches = substring.match( RegExp( pattern ) );
			var rule = getRule( partMatches[2] );
			var selector = {
				selector: partMatches[1].replace( /^\s+|\s+$/g, '' ).replace( /s+/g, ' ' ),
				className: createClassNameFromRule( rule ),
				booleanStatement: createBooleanStatementFromRule( rule )
			}
			selectorsObject[ selector.selector+selector.className ] = selector;
			var result = substring.replace( RegExp( '\\s*\\@container\\s*'+regexEscape(rule) ), '.'+selector.className );
			return RegExp( pattern ).test( result ) ? replaceContainerDirectives( result ) : result;
		});
	}
}

function regexEscape( string ) {
	return string.replace( /\(/g, '\\(' ).replace( /\)/g, '\\)' );
}

function createBooleanStatementFromRule( rule ) {
	var pattern = '\\(\\s*(max|min)-(width|height|aspect-ratio)\\s*:\\s*([\\d\\.]+)(px|em)\\s*\\)';
	return '('+rule.replace( RegExp( pattern , 'g' ), function( substring ) {
		var matches = substring.match( RegExp( pattern ) );
		return 'container.' + matches[2] + '.' + matches[4] + ( 
			matches[1] == 'max' ? '<=' : '>=' 
		) + matches[3];
	} ).replace( /\s*and\s*/g, '&&' ).replace( /\s*(,|or)\s*/g, ')||(' ).replace( /^\s+|\s+$/g, '' ) + ')';
}

function createClassNameFromRule( rule ) {
	return '_cq-'+rule.replace( /,/g, ' or ' ).replace( /(\s|\:|\(|\))+/g, '-' ).replace( /^[\s\-]+|[\s\-]+$/g, '' )
		.replace(/(max|min)-(\w)\w+/g, '$1$2');
}

function getRule( string ) {

	var first, current, ended = false;
	var string = string; var lastRelevant = 0;
	first = current = string.indexOf( '(' );
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