"use strict";

var ObjHandle = function(state)
{
	this.Data = state;
	this.Div  = undefined;
	this.Type = ObjHandle.Types[this.Data.Type];
	this.call("Initialize", this);
	this.enableInteraction(this.Type.ClickAction);

	var menu = this.Type.MenuActions;
	for(var i = 0; i < menu.length; i++)
		this.enableInteraction(menu[i]);
}

ObjHandle.Types       = {};
ObjHandle.Actions     = {};
ObjHandle.Transitions = {};

ObjHandle.prototype.enableInteraction = function(interaction)
{
	var fn = ObjHandle.Actions[interaction].Enable;
	if(fn) fn(this.Data);
}

ObjHandle.prototype.initHTML = function(ui)
{
	this.Div = document.createElement("div");
	this.Div.classList.add("obj");
	this.Div.GameHandle = this;
	this.call("InitHTML",   this, this.Div, ui);
	this.updateHTML(ui);
	return this.Div;
};

ObjHandle.prototype.updateHTML = function(ui)
{
	this.call("OnUpdate", this);

	if(this.Data.X !== undefined && this.Data.Y !== undefined)
	{
		this.Div.style.position = "absolute";
		this.Div.style.left = this.Data.X+"px";
		this.Div.style.top  = this.Data.Y+"px";
	}
	var transform = "";
	if(this.Data.Z      !== undefined) this.Div.style.zIndex = this.Data.Z;
	if(this.Data.Width  !== undefined) this.Div.style.width  = this.Data.Width +"px";
	if(this.Data.Height !== undefined) this.Div.style.height = this.Data.Height+"px";
	if(this.Data.ScaleX !== undefined) transform += "scaleX("+this.Data.ScaleX+") ";
	if(this.Data.ScaleY !== undefined) transform += "scaleY("+this.Data.ScaleY+") ";
	if(this.Data.Rotation !== undefined) transform += "rotate("+this.Data.Rotation+"deg) ";

	if(transform !== "")
		this.Div.style.transform = transform;

	this.call("UpdateHTML", this, this.Div, ui);
};

ObjHandle.prototype.call = function(fn)
{
	if(this.Type)
	if(this.Type[fn])
		this.Type[fn].apply(this, Array.prototype.slice.call(arguments, 1));
};

ObjHandle.prototype.get = function(property)
{
	return this.Type[property];
};