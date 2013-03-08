# Container Queries

##1. Background

##2. Container Queries

##3. Syntax

The container query syntax is very similar to the [media query syntax][MediaQuerySyntax] 
and is described in terms of the [CSS2 grammar][CSS2Grammar]. As such, rules not defined 
here are defined in CSS2. The `simple_selector` production defined below replaces the
 `simple_selector` production from CSS2.

[MediaQuerySyntax]: "http://www.w3.org/TR/css3-mediaqueries/#syntax"
[CSS2Grammar]: "http://www.w3.org/TR/CSS21/grammar.html"

<!--- not actually smalltalk, just like the syntax highlighting -->
```smalltalk

simple_selector
  : element_name [ HASH | class | attrib | pseudo ]* S* container?
  | [ HASH | class | attrib | pseudo ]+ S* container?
  ;

container
  : CONTAINER_SYM S* container_query_list
  ;

container_query_list
  : S* [container_query [ ',' S* container_query ]* ]?
  ;

container_query
  : container_expression [ AND S* container_expression ]*
  ;

container_expression
  : '(' S* container_property S* [ ':' S* expr ]? ')' S*
  ;

container_property
  : IDENT
  ;
```

The following new token is introduced:

<!--- not actually smalltalk, just like the syntax highlighting -->
```smalltalk
@{C}{O}{N}{T}{A}{I}{N}{E}{R}  {return CONTAINER_SYM;}
```

`COMMENT` tokens, as defined by CSS2, do not occur in the grammar (to keep it readable),
but any number of these tokens may appear anywhere between other tokens. Additionally, CSS
style sheets are generally case-insensitive, and this is also the case for container 
queries.
