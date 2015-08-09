"use strict";

// Interfaces are a extension of the Script Object module,
// which handle how certain script objects are interacted with,
// what functions are called and with which arguments.

// This Interface is for "Objects"
// Objects have a HTML-Element and can directly be interacted with.
// These are usually the source for the creation of Script objects with other interfaces.

var objIface = {};
Script.Interfaces["Object"] = objIface;

objIface.FixPrototype = function(proto)
{
	var dummy = function() {};
	proto.Initialize   = proto.Initialize   || dummy;
	proto.InitHTML     = proto.InitHTML     || dummy;
	proto.UpdateHTML   = proto.UpdateHTML   || dummy;
	proto.UpdateState  = proto.UpdateState  || dummy;
	proto.Deinitialize = proto.Deinitialize || dummy;
	proto.Focus        = proto.Focus        || dummy;
	proto.Blur         = proto.Blur         || dummy;

	if(proto.Volatile === undefined)
		proto.Volatile = false;
};

objIface.Creation = function(handle)
{
	handle.HTMLDiv = document.createElement("div");
	handle.HTMLDiv.classList.add("obj");
	handle.HTMLDiv.tabIndex = "-1";
	handle.HTMLDiv.GameHandle = handle;

	handle.Initialize();
	handle.InitHTML  ();
	handle.UpdateHTML();
};

objIface.UpdateState = function(handle, delta)
{
	handle.UpdateState(delta);
	handle.UpdateHTML();
};

objIface.GameTick = function(handle, time)
{
};

objIface.Deletion = function(handle)
{
	handle.Deinitialize();
};
