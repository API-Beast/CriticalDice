"use strict";

var Sidebar = function(netstate, iface)
{
	this.NetState      = netstate;
	this.Interface     = iface;
	this.Modules       = [];
	Script.API.Sidebar = this;

	this.Modules.push(new Sidebar.Properties(netstate));
	this.Modules.push(new Sidebar.Archive(netstate));

	this.Interface.OnSelectionChanged.push(this.OnSelectionChanged.bind(this));
	this.NetState.Script.OnUpdate.push(this.OnObjectChange.bind(this));
}

Sidebar.prototype.OnSelectionChanged = function(newSelection)
{
	var i, f;
	for(i = 0; i < this.Modules.length; i++)
	if(f = this.Modules[i].OnSelectionChanged)
		f.call(this.Modules[i], newSelection);
}

Sidebar.prototype.OnObjectChange = function(iface, handle, oldState, delta)
{
	var i, f;
	for(i = 0; i < this.Modules.length; i++)
	if(f = this.Modules[i].OnObjectChange)
		f.call(this.Modules[i], iface, handle, oldState, delta);
}
