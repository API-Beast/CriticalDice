"use strict";

// Interfaces are a extension of the Script Object module,
// which handle how certain script objects are interacted with,
// what functions are called and with which arguments.

// This Interface is for "Actions"

var actionIface = {};
Script.Interfaces["Action"] = actionIface;

actionIface.FixPrototype = function(proto)
{
	var dummy = function() {};
	proto.Init    = proto.Init    || dummy;
	proto.Update  = proto.Update  || dummy;
	proto.Finish  = proto.Finish  || dummy;
	proto.Undo    = proto.Undo    || dummy;
	proto.Execute = proto.Execute || dummy;
	proto.MouseInput = function(time, x, y)
	{
		this.XKeyframes.insert(time, x);
		this.YKeyframes.insert(time, y);
	};
	console.log("Fixing Action ", proto);
};

actionIface.Creation = function(handle)
{
	handle.State.Targets = handle.State.Targets || [];
	handle.Targets       = [];
	for(var i = 0; i < handle.State.Targets.length; i++)
	{
		var t = handle.State.Targets[i];
		handle.Targets[i] = t;
		handle.Targets[i].Handle = Script.API.NetState.Script.GetHandleByID(t.ID);
		handle.Targets[i].State  = handle.Targets[i].Handle.State;
		handle.Targets[i].OriginalState = Merge(handle.Targets[i].State);
	}
	var time = Script.API.NetState.Clock();
	handle.XKeyframes = new KeyFrameMap();
	handle.YKeyframes = new KeyFrameMap();
	handle.XKeyframes.insert(time, handle.State.StartX);
	handle.YKeyframes.insert(time, handle.State.StartY);
	handle.StartX = handle.State.StartX;
	handle.StartY = handle.State.StartY;
	handle.CenterX = handle.State.CenterX;
	handle.CenterY = handle.State.CenterY;

	handle.Init();
	if(handle.Type === "ClickOnce")
	{
		for(var i = 0; i < handle.Targets.length; i++)
			handle.Execute(handle.Targets[i]);
		Script.API.NetState.Script.Remove(handle, NO_BROADCAST);
	}
};

actionIface.GameTick = function(handle, time)
{
	var x = Math.round(handle.XKeyframes.get(time));
	var y = Math.round(handle.YKeyframes.get(time));
	for(var i = 0; i < handle.Targets.length; i++)
	{
		handle.Update(handle.Targets[i], x, y);
		if(handle.FinishTime && time > handle.FinishTime)
		{
			handle.Finished = true;
			handle.Finish(handle.Targets[i], x, y);
			Script.API.NetState.Script.Remove(handle, NO_BROADCAST);
		}
		handle.Targets[i].Handle.UpdateHTML();
	}

	if(handle.XKeyframes.Frames.length > 64)
	{
		handle.XKeyframes.Frames = handle.XKeyframes.Frames.slice(48);
		handle.YKeyframes.Frames = handle.YKeyframes.Frames.slice(48);
	}
};

actionIface.Deletion = function(handle)
{
	if(!handle.Finished)
	{
		for(var i = 0; i < handle.Targets.length; i++)
			handle.Undo(handle.Targets[i]);
	}
};
