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

NetState.Script.prototype.Create = function(iface, state, id, flags)
{
	if(id === undefined)
		do id = Math.floor(Math.random()*32000000);
		while(this.Handles[id] !== undefined);

  state.ID = id;

	var proto  = this.GetPrototype(state.Type);
  var handle = Object.create(proto);
  var originalState = Merge(state);

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
  CallAll(this.OnCreation, iface, handle, flags);
  if(!(flags & NO_BROADCAST)) this.Net.Broadcast(["Script", "Create", iface, originalState]);

  return handle;
}

NetState.Script.prototype.Update = function(handle, delta, flags)
{
  // With just one parameter Merge is basically a deep clone
	var state = handle.State;
  var oldState = Merge(state);
	ApplyTemplate(state, delta);

	Script.Interfaces[handle.Interface].UpdateState(handle);

	// Callbacks
  CallAll(this.OnUpdate, handle.Interface, handle, oldState, delta, flags);
  if(!(flags & NO_BROADCAST))	this.Net.Broadcast(["Script", "Update", state.ID, delta]);
}

NetState.Script.prototype.Remove = function(handle, flags)
{
  if(!handle.Volatile)
    delete this.Net.State[handle.Interface][handle.State.ID];

  delete this.Handles[handle.State.ID];
	Script.Interfaces[handle.Interface].Deletion(handle);

	// Callbacks
  CallAll(this.OnRemoval, handle.Interface, handle, flags);
  if(!(flags & NO_BROADCAST)) this.Net.Broadcast(["Script", "Remove", handle.ID]);
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
		this.Create(iface, handle, id, NO_BROADCAST);
	}
}

NetState.Script.prototype.GetHandleByID = function(id)
{
	return this.Handles[id];
}

NetState.Script.prototype.GameTick = function(time, ui)
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

NetState.Script.prototype.HandlePackage = function(type, pack)
{
  if(type === "Create")
  {
    var iface = pack[0];
    var state = pack[1];
    this.Create(iface, state, state.ID, NO_BROADCAST);
    return;
  }

  if(type === "Update")
  {
    var handle   = this.Handles[pack[0]];
    var delta = pack[1];
    if(handle)
    	this.Update(handle, delta, NO_BROADCAST);
    else
    	console.log("Trying to update non-existant object.", pack[0]);
    return;
	}

  if(type === "Remove")
  {
    var handle = this.Handles[pack[0]];
    if(handle)
    	this.Remove(handle, NO_BROADCAST);
    else
    	console.log("Trying to remove non-existant object.", pack[0]);
    return;
  }
};
