"use strict";

var ObjHandle = function(state)
{
	this.State = state;
	this.Div   = undefined;
	this.Type  = ObjHandle.Types[this.State.Type];
	this.call("Initialize");
}

ObjHandle.Types = {};

ObjHandle.RegisterObjectType = function(name, ptr)
{
	ObjHandle.Types[name] = ptr;
};

ObjHandle.prototype.initHTML = function(ui)
{
	this.Div = document.createElement("div");
	this.Div.classList.add("obj");
	this.Div.GameHandle = this;
	this.call("InitHTML", this.Div, ui);
	this.updateHTML(ui);
	return this.Div;
};

ObjHandle.prototype.updateHTML = function(ui)
{
	this.call("UpdateHTML", this.Div, ui);
};

ObjHandle.prototype.call = function(fn)
{
	var args = Array.prototype.slice.call(arguments, 1);

	// Call all inherited functions first
	if(this.Type.Inheritance)
	for(var i = 0; i < this.Type.Inheritance.length; i++)
	{
		var f = ObjHandle.Types[this.Type.Inheritance[i]][fn];
		if(f)
			f.apply(this, args);
	};

	// Then the final one.
	if(this.Type)
	if(this.Type[fn])
		this.Type[fn].apply(this, args);
};

ObjHandle.prototype.get = function(property)
{
	return this.Type[property];
};