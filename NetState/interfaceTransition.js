"use strict";

// Interfaces are a extension of the Script Object module,
// which handle how certain script objects are interacted with,
// what functions are called and with which arguments.

// This Interface is for "Transitions"
// Transitions are constantly updated effects, usually used to animate between two states for a Object.
// They have a target who they will apply their effect on.

var transIface = {};
Script.Interfaces["Transition"] = transIface;

transIface.FixPrototype = function(proto)
{
	var dummy = function() {};
	proto.Start    = proto.Start    || dummy;
	proto.GameTick = proto.GameTick || function(){ return true; };
	proto.Finish   = proto.Finish   || dummy;
	proto.Reset    = proto.Reset    || dummy;
};

transIface.Creation = function(handle)
{
	handle.Start();
};

transIface.GameTick = function(handle, time)
{
	if(handle.GameTick(time))
	{
		handle.Finish();
		handle.Finished = true;
		Script.API.NetState.Script.Remove(handle, NO_BROADCAST);
	}
};

transIface.Deletion = function(handle)
{
	if(!handle.Finished)
		handle.Reset();
};
