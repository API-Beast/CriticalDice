"use strict";

NetState.Objects = function(netstate)
{
	this.Net = netstate;
	this.Net.State.Objects = {};

	// Events
	this.OnCreation = [];
	this.OnUpdate   = [];
	this.OnRemoval  = [];
};

NetState.Objects.prototype.Create = function(obj, id, flags)
{
  if(!id)
  	id = Math.floor(Math.random()*32000000);
  while(this.Net.State.Objects[id])
  	id = Math.floor(Math.random()*32000000);

  this.Net.State.Objects[id]    = obj;
  obj.ID = id;
  // So that we notice when something accidentally tries to write this.
  //Object.defineProperty(obj, "ID", {value: id, writable: false, enumerable: true, configurable: true});

  CallAll(this.OnCreation, id, obj, flags);

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Objects", "Create", obj]);

  return obj;
}

NetState.Objects.prototype.Update = function(obj, delta, flags)
{
  // With just one parameter this is basically a deep clone
  var oldState = Merge(obj);
	ApplyTemplate(obj, delta);

  CallAll(this.OnUpdate, obj.ID, oldState, obj, delta, flags);

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Objects", "Update", obj.ID, delta]);
}

NetState.Objects.prototype.Remove = function(obj, flags)
{
  delete this.Net.State.Objects[obj.ID];

  CallAll(this.OnRemoval, obj.ID, flags);

  if(!(flags & NO_BROADCAST))
  	this.Net.Broadcast(["Objects", "Remove", obj.ID]);
};

NetState.Objects.prototype.GameTick = function(time, ui)
{
}

NetState.Objects.prototype.HandlePackage = function(type, pack)
{
  if(type === "Create")
  {
    var obj = pack[0];
    this.Create(obj, obj.ID, NO_BROADCAST);
    return;
  }

  if(type === "Update")
  {
  	var obj   = this.Net.State.Objects[pack[0]];
    var delta = pack[1];
    if(obj)
    	this.Update(obj, delta, NO_BROADCAST);
    else
    	console.log("Trying to update non-existant object.", pack[0]);
    return;
	}

  if(type === "Remove")
  {
    var obj = this.Net.State.Objects[pack[0]];
    if(obj)
    	this.Remove(obj, NO_BROADCAST);
    else
    	console.log("Trying to remove non-existant object.", pack[0]);
    return;
  }
};