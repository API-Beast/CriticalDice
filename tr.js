"use strict";

var STRINGS = {};

function tr(template, args)
{
	if(STRINGS[template]) template = STRINGS[template];
	return subs(template, args);
}