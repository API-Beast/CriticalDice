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

	// Volatile objects don't have permanent state
	// and will be destroyed during state resets.
	if(proto.Volatile === undefined)
		proto.Volatile = true;
};

transIface.Creation = function(handle)
{
	handle.TargetHandle  = Script.API.NetState.Script.GetHandleByID(handle.State.Target);
	handle.Target        = handle.TargetHandle.State;
	handle.OriginalState = Merge(handle.Target);
	handle.StartTime     = Script.API.NetState.Clock();
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
	handle.TargetHandle.UpdateHTML();
};

transIface.Deletion = function(handle)
{
	if(!handle.Finished)
		handle.Reset();
};
