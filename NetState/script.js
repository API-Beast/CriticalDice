"use strict";

var Script = {};

Script.API        = {};
Script.Root       = {};
Script.Prototypes = {};
Script.Interfaces = {};

Script.Register = function(name, ptr)
{
	Script.Root[name] = ptr;
};

NetState.Script = function(netstate)
{
	this.Net = netstate;
  this.Handles = Object.create(null);
	Script.API.NetState = netstate;

	// Events
	this.OnCreation = [];
	this.OnUpdate   = [];
	this.OnRemoval  = [];
};

NetState.Script.prototype.Create = function(iface, state, id, bFlags)
{
	if(id === undefined)
		do id = Math.floor(Math.random()*32000000);
		while(this.Handles[id] !== undefined);

	var proto  = this.GetPrototype(state.Type);
  var handle = Object.create(proto);
  var originalState = Merge(state);

	originalState.ID = id;
  state.ID         = id;
	handle.ID        = id;

  if(handle.Volatile)
  {
    ApplyTemplate(handle, state);
    handle.State = state; // For compatiblity reasons
  }
  else
  {
    handle.State = state;

    if(!this.Net.State[iface])
      this.Net.State[iface] = {};
    this.Net.State[iface][id] = state;
  }
  this.Handles[id] = handle;
  Script.Interfaces[iface].Creation(handle);

  if(handle.Interface !== iface)
  {
    console.error(state, "is a", handle.Interface, "not a", iface);
    iface = handle.Interface;
  }

	// Callbacks
  CallAll(this.OnCreation, iface, handle);

  if(bFlags !== undefined)
		this.Net.Broadcast("Create", [iface, originalState, id], "Script", bFlags);

  return handle;
}

NetState.Script.prototype.Update = function(handle, delta, bFlags)
{
	if(typeof(handle) !== "object")	handle = this.Handles[handle];

  // With just one parameter Merge is basically a deep clone
	var state = handle.State;
  var oldState = Merge(state);
	ApplyTemplate(state, delta);

	Script.Interfaces[handle.Interface].UpdateState(handle);

	// Callbacks
  CallAll(this.OnUpdate, handle.Interface, handle, oldState, delta);

	if(bFlags !== undefined)
		this.Net.Broadcast("Update", [handle.ID, delta], "Script", bFlags);
}

NetState.Script.prototype.Input = function(handle, time, input, bFlags)
{
	if(typeof(handle) !== "object")	handle = this.Handles[handle];
	if(!handle) return;

	Script.Interfaces[handle.Interface].Input(handle, time, input);

	if(bFlags !== undefined)
		this.Net.Broadcast("Input", [handle.ID, time, input], "Script", bFlags);
}

NetState.Script.prototype.Remove = function(handle, bFlags)
{
	if(typeof(handle) !== "object")	handle = this.Handles[handle];

  if(!handle.Volatile)
    delete this.Net.State[handle.Interface][handle.State.ID];

  delete this.Handles[handle.State.ID];
	Script.Interfaces[handle.Interface].Deletion(handle);

	// Callbacks
  CallAll(this.OnRemoval, handle.Interface, handle);

  if(bFlags !== undefined)
		this.Net.Broadcast("Remove", [handle.ID], "Script", bFlags);
};

NetState.Script.prototype.StateReset = function(state)
{
	this.Handles = Object.create(null);

	for(var iface in state)
	if(state.hasOwnProperty(iface))
	for(var id in state[iface])
	if(state[iface].hasOwnProperty(id))
	{
		var handle = state[iface][id];
		this.Create(iface, handle, id);
	}
}

NetState.Script.prototype.GetHandleByID = function(id)
{
	return this.Handles[id];
}

NetState.Script.prototype.GameTick = function(time)
{
	for(var id in this.Handles)
	{
		var handle = this.Handles[id];
		Script.Interfaces[handle.Interface].GameTick(handle, time);
	}
}

NetState.Script.prototype.GetPrototype = function(type)
{
	var proto = Script.Prototypes[type];
	if(proto) // Is already buffered.
		return proto;
	else // Lolnope.
	{
		var root = DereferenceDotSyntax(Script.Root, type);
		proto = Merge(root);

		if(root.Inheritance)
		for(var i = 0; i < root.Inheritance.length; i++)
		{
			var parent = root.Inheritance[i];
			var inheritance = this.GetPrototype(parent);
			ClaimInheritance(proto, inheritance);
		}

		Script.Interfaces[proto.Interface].FixPrototype(proto);
		Script.Prototypes[type] = proto;
		return proto;
	}
};

NetState.Script.prototype.HandlePackage = function(pack)
{
	this[pack.Type].apply(this, pack.Args);
};
