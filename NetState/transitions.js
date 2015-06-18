"use strict";

NetState.Transitions = function(netstate)
{
	this.Net   = netstate;
	this.State = netstate.State;
	this.State.Transitions = {};

	// Events
	this.OnCreation = [];
	this.OnUpdate   = [];
	this.OnRemoval  = [];
};

NetState.Transitions.prototype.Create = function(target, obj, id, flags)
{
  if(!id)
  	id = Math.floor(Math.random()*32000000);
  while(this.State.Transitions[id])
  	id = Math.floor(Math.random()*32000000);

  this.State.Transitions[id]    = obj;
  this.State.Transitions[id].ID = id;
  this.State.Transitions[id].Target = target;

  CallAll(this.OnCreation, id, obj, flags);

  if(!(flags & SOURCE_NETWORK))
  	this.Net.Broadcast(["Transitions", "Create", obj]);

  return obj;
}

NetState.Transitions.prototype.Update = function(obj, delta, flags)
{
  // With just one parameter this is basically a deep clone
  var oldState = Merge(obj);
	ApplyTemplate(obj, delta);

  CallAll(this.OnUpdate, obj.ID, oldState, obj, delta, flags);

  if(!(flags & SOURCE_NETWORK))
  	this.Net.Broadcast(["Transitions", "Update", obj.ID, delta]);
}

NetState.Transitions.prototype.Remove = function(obj, flags)
{
  delete this.State.Transitions[obj.ID];

  CallAll(this.OnRemoval, obj.ID, flags);

  if(!(flags & SOURCE_NETWORK))
  	this.Net.Broadcast(["Transitions", "Remove", obj.ID]);
};

NetState.Transitions.prototype.HandlePackage = function(type, pack)
{
  if(type === "Create")
  {
    var obj = pack[0];
    this.Create(obj, obj.ID, SOURCE_NETWORK);
    return;
  }

  if(type === "Update")
  {
    var time  = pack[0]; 
  	var obj   = this.State.Transitions[pack[1]];
    var delta = pack[2];
    if(obj)
    	this.Update(obj, delta, SOURCE_NETWORK);
    else
    	console.log("Trying to update non-existant object.", pack[1]);
    return;
	}

  if(type === "Remove")
  {
    var obj = this.State.Transitions[pack[0]];
    if(obj)
    	this.Remove(obj, SOURCE_NETWORK);
    else
    	console.log("Trying to remove non-existant object.", pack[0]);
    return;
  }
};