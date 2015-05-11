"use strict";

var NetState = function(id)
{
  if(id)
    this.Network = new Peer(id, {key: '53po7kdyuv1gu8fr'});
  else 
    this.Network = new Peer({key: '53po7kdyuv1gu8fr'});

	this.Network.on("connection", this.OnPeerConnected.bind(this));
	this.Peers = Object.create(null);

	this.State = {};
	this.State.Objects = {};

	this.ClockStartTime = performance.now();
	this.NetworkInputSmoothingDelay = 150;

  this.OnObjectChange   = [];
  this.OnObjectCreation = [];
  this.OnObjectRemoval  = [];
  this.OnStateReset     = [];
}

NetState.prototype.Clock = function()
{
	return Math.floor(performance.now() - this.ClockStartTime); 
}

NetState.prototype.Join = function(id)
{
  var conn = this.Network.connect(id);
  this.Peers[id] = conn;
  conn.on('data', this.OnDataReceived.bind(this, conn));
  conn.on('open', function(){ conn.send(["join-session"]); });
}

NetState.prototype.OnPeerConnected = function(conn)
{
  this.Peers[conn.peer] = conn;
  conn.on('data', this.OnDataReceived.bind(this, conn));
}

NetState.prototype.RequestState = function()
{
  //this.Peers[Object.keys(this.Peers)[0]].send(["state-request"]);
}

NetState.prototype.OnDataReceived = function(conn, pack)
{
  console.log("Input:", conn.peer, pack);
  var type = pack[0];
  if(type === "chat")
  {
    console.log(pack[1]);
    return;
  }

  if(type === "join-session")
  {
    for(var id in this.Peers)
      this.Peers[id].send(["joined-session", conn.peer]);
    conn.send(["set-state", this.State]);
    return;
  }

  if(type === "joined-session")
  {
    var id = pack[1];
    var conn = this.Network.connect(id);
    this.Peers[id] = conn;
    conn.on('data', this.OnDataReceived.bind(this, conn));
    return;
  }

  if(type === "state-request")
  {
    conn.send(["set-state", this.State]);
    return;
  }

  if(type === "set-state")
  {
  	this.SetState(pack[1], "network");
  	return;
  }

  if(type === "create-object")
  {
    var id  = pack[1]; 
    var obj = pack[2];
    this.CreateObject(obj, id, "network");
    return;
  }

  if(type === "remove-object")
  {
    var obj = this.State.Objects[pack[1]];
    if(obj) this.RemoveObject(obj, "network");
    else console.log("Trying to remove non-existant object.", pack[1]);
  }

  if(type === "update-object")
  {
    var time  = pack[1]; 
  	var obj   = this.State.Objects[pack[2]];
    var delta = pack[3];
    if(obj) this.UpdateObjectState(obj, delta, "network");
    else console.log("Trying to update non-existant object.", pack[2]);
    return;
	}
}

NetState.prototype.Broadcast = function(data)
{
	for(var peer in this.Peers)
		this.Peers[peer].send(data);
  console.log("Broadcast:", data);
}

NetState.prototype.CreateObject = function(obj, id, origin)
{
  if(!id) id = Math.floor(Math.random()*32000000);
  this.State.Objects[id]    = obj;
  this.State.Objects[id].ID = id;

  CallAll(this.OnObjectCreation, id, obj);

  if(origin != "network")
    this.Broadcast(["create-object", id, obj]);

  return obj;
}

NetState.prototype.RemoveObject = function(obj, origin)
{
  delete this.State.Objects[obj.ID];

  if(origin != "network")
    this.Broadcast(["remove-object", id]);

  CallAll(this.OnObjectRemoval, obj.ID);
};

NetState.prototype.UpdateObjectState = function(obj, delta, origin)
{
  // With just one parameter this is basically a deep clone
  var oldState = Merge(obj);

	ApplyTemplate(obj, delta); 


	if(origin != "network")
    this.Broadcast(["update-object", this.Clock(), obj.ID, delta]);
  
  CallAll(this.OnObjectChange, obj.ID, oldState, obj, delta);
}

NetState.prototype.SetState = function(newState, origin)
{
  this.State = newState;

  if(origin != "network")
    this.Broadcast(["update-object", newState]);

  CallAll(this.OnStateReset, this.State.Objects);
};