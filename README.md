Container Queries
=================

*This is in early development, syntax and other aspects may change.*
You can watch the [video introduction](http://www.youtube.com/watch?v=RuEM93Ff50E) recorded March 8, 2013.

What are container queries?
---------------------------

Container queries are much like media queries, except instead of querying the media/device, they query the parent container of an element. Where media queries use the `@media` directive, container queries use the `@container` directive.  The `@container` directive follows a selector and the rule is formatted similarly to a media rule. 

An Example:
```css 
.myselector @container ( max-width: 40em ) and ( min-width: 20em ) { ... }
```

A `@container` directive can be contained within a more complex query as well:
```css 
a.myselector[href],
.listselector @container ( max-width: 40em ) and ( min-width: 20em ) li { ... }
```

The `@container` directive supports `min-width`, `max-width`, `min-height`, `max-height`, `min-aspect-ratio` and `max-aspect-ratio` for the query rules.

Why are container queries awesome?
----------------------------------

Container queries are a major step forward in building modular web sites and applications.  Say we have a fairly common layout consisting of a `.main-content-area` and a `.sidebar`, and we also have a `.blog-module` that displays the most recent three blog posts from our blog.  This `.blog-module` should display differently based on it's available width. If it is in the `.main-content-area` where there is plenty of horizontal space, it should display the three blog posts side-by-side, however if it is in the `.sidebar` where there is limited horizontal space, it should display the posts vertically on top of each other.

Without container queries, something like this can be done, but we would need to define separate queries eg. `.main-content-area .blog-module` and `.sidebar .blog-module`.  This module cannot be truly separated from it's parent document. And if there exists a media query that repositions the `.sidebar` below the `.main-content-area`, then we need to write more queries.

With container queries we can simply write:
```css
.blog-module .post { width: 33.3% }
.blog-module @container ( max-width:30em ) .post { width: 100% }
```

This module is no longer dependent on it's parent document or parent containers.  If we wanted to stick our `.blog-module` in a smaller block within the `.main-content-area`, no additional css is required.  If the `.blog-module` has less than 30ems of space, it'll display the posts vertically, otherwise it'll display them side-by-side. **Simple.** 

Plus, this module can be pulled out and used in another web site or application and it will (visually at least) **just work**. Container queries are the solution to one of the biggest problems standing in the way of interchangeable, responsive HTML5 modules.

But wait... `@container` doesn't actually exist
-----------------------------------------------

Sadly, this is true.  However I am working on a [specification](specification.md) which will hopefully be standardized and in the meantime I have developed a polyfill that mimics how the native version should work.

How to use the polyfill
-----------------------
**The polyfill is still under heavy development. Please check back soon, or contribute.**

It requires pre-processing your style sheets to generate javascript rules that are applied upon page load, window resize, dom changes, and browser zoom.  If you're already using a stylesheet preprocessor (less/sass/stylus) you can hook into the rendering process to provide container queries with minimal change to your existing code.

To Do
-----
- [ ] Implement client side parsing
- [ ] Finalize syntax
- [ ] Complete formal specification of behavior
