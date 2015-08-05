"use strict";

var Sidebar = function(netstate, iface)
{
	this.NetState      = netstate;
	this.Interface     = iface;
	this.Modules       = [];
	Script.API.Sidebar = this;

	this.Modules.push(new Sidebar.Properties(netstate));

	this.Interface.OnSelectionChanged.push(this.OnSelectionChanged.bind(this));
	this.NetState.Script.OnUpdate.push(this.OnObjectChange.bind(this));
}

Sidebar.prototype.OnSelectionChanged = function(newSelection)
{
	for(var i = 0; i < this.Modules.length; i++)
		this.Modules[i].OnSelectionChanged(newSelection);
}

Sidebar.prototype.OnObjectChange = function(iface, handle, oldState, delta)
{
	for(var i = 0; i < this.Modules.length; i++)
		this.Modules[i].OnObjectChange(iface, handle, oldState, delta);
}
