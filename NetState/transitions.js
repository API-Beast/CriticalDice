"use strict";

/*
class NetState.Transitions
{
  object Create(blueprint, id, origin);
  void Update(object, delta, origin);
  void Remove(object, origin);

  any CallFunction(object, functionName, ...);

  signal OnCreation;
  signal OnUpdate;
  signal OnRemoval;
}
*/

NetState.Transitions = function(netstate)
{
	this.Net = netstate;
	this.Net.State.Transitions = {};

	// Events
	this.OnCreation = [];
	this.OnUpdate   = [];
	this.OnRemoval  = [];
};

NetState.Transitions.prototype.Create = function(obj, ts, id, flags)
{
  if(!id)
  	id = Math.floor(Math.random()*32000000);
  while(this.Net.State.Transitions[id])
  	id = Math.floor(Math.random()*32000000);

  this.Net.State.Transitions[id] = ts;
  ts.ID            = id;
  ts.Target        = obj;
  ts.StartTime     = this.Net.Clock();
  ts.OriginalState = Merge(obj);

  CallAll(this.OnCreation, id, ts, flags);

  this.CallFunction(ts, "Start");

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Transitions", "Create", obj.ID, ts]);

  return ts;
}

NetState.Transitions.prototype.Update = function(ts, delta, flags)
{
  // With just one parameter this is basically a deep clone
  var oldState = Merge(ts);
	ApplyTemplate(ts, delta);

  CallAll(this.OnUpdate, ts.ID, oldState, ts, delta, flags);

  this.CallFunction(ts, "Update", delta);

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Transitions", "Update", ts.ID, delta]);
}

NetState.Transitions.prototype.Remove = function(ts, flags)
{
  delete this.Net.State.Transitions[ts.ID];

  CallAll(this.OnRemoval, ts.ID, flags);

  this.CallFunction(ts, "Removed");

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Transitions", "Remove", ts.ID]);
};

NetState.Transitions.prototype.CallFunction = function(ts, fname)
{
  var prototype = DereferenceDotSyntax(ObjHandle.Types, ts.Type);
  var fn = prototype[fname];

  var args = Array.prototype.slice.call(arguments, 2);
  args.push(this.Net);

  if(fn)
    return fn.apply(ts, args);
};

NetState.Transitions.prototype.GameTick = function(time, ui)
{
  for(var id in this.Net.State.Transitions)
  {
    if(!Object.prototype.hasOwnProperty.call(this.Net.State.Transitions, id))
      continue;

    var ts = this.Net.State.Transitions[id];
    if(this.CallFunction(ts, "GameTick", time))
    {
      this.CallFunction(ts, "Finish");
      this.Remove(ts, NO_BROADCAST);
    }
    ui.OnObjectChange(ts.Target.ID);
  };
}

NetState.Transitions.prototype.HandlePackage = function(type, pack)
{
  if(type === "Create")
  {
    var target = this.Net.State.Objects[pack[0]];
    var ts = pack[1];
    this.Create(target, ts, ts.ID, NO_BROADCAST);
    return;
  }

  if(type === "Update")
  {
  	var ts   = this.Net.State.Transitions[pack[0]];
    var delta = pack[1];
    if(ts)
    	this.Update(ts, delta, NO_BROADCAST);
    else
    	console.log("Trying to update non-existant object.", pack[0]);
    return;
	}

  if(type === "Remove")
  {
    var ts = this.Net.State.Transitions[pack[0]];
    if(ts)
    	this.Remove(ts, NO_BROADCAST);
    else
    	console.log("Trying to remove non-existant object.", pack[0]);
    return;
  }
};