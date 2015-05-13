"use strict";

var NetState = function(name)
{
  this.Network = new Peer({key: '53po7kdyuv1gu8fr'});

  this.Network.on("open", this.OnNetworkEtablished.bind(this));
	this.Network.on("connection", this.OnPeerConnected.bind(this));
	this.Peers = Object.create(null);

  this.Metadata = {Nick: name};

	this.State = {};
	this.State.Objects = {};

	this.ClockStartTime = performance.now();
	this.NetworkInputSmoothingDelay = 150;

  this.OnEtablishedSession = [];
  this.OnStatusText     = [];
  this.OnObjectChange   = [];
  this.OnObjectCreation = [];
  this.OnObjectRemoval  = [];
  this.OnStateReset     = [];
  this.OnReceiveChat    = [];
}

NetState.prototype.Clock = function()
{
	return Math.floor(performance.now() - this.ClockStartTime); 
}

NetState.prototype.Join = function(id)
{
  var conn = this.Network.connect(id, {metadata: this.Metadata});
  this.Peers[id] = conn;
  conn.on('data', this.OnDataReceived.bind(this, conn));
  conn.on('close', this.OnPeerDisconnected.bind(this, conn));
  conn.on('open', function(){ conn.send(["join-session"]); });
  CallAll(this.OnStatusText, tr("Joined <b>{0}</b>'s Session.", [conn.metadata.Nick]));
}

NetState.prototype.Leave = function()
{
  for(var id in this.Peers)
  {
    this.Peers[id].send(["leave-session"]);
    //this.Peers[id].close();
  }
};

NetState.prototype.OnNetworkEtablished = function(id)
{
  CallAll(this.OnEtablishedSession, id);
};

NetState.prototype.OnPeerConnected = function(conn)
{
  this.Peers[conn.peer] = conn;
  conn.on('data', this.OnDataReceived.bind(this, conn));
}

NetState.prototype.OnPeerDisconnected = function(conn)
{
  CallAll(this.OnStatusText, tr("<b>{0}</b> was disconnected.", [conn.metadata.Nick]));
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
    {
      if(id != conn.peer)
        this.Peers[id].send(["joined-session", conn.peer]);
    }
    conn.send(["set-state", this.State]);
    CallAll(this.OnStatusText, tr("<b>{0}</b> joined the session.", [conn.metadata.Nick]));
    return;
  }

  if(type === "joined-session")
  {
    var id = pack[1];
    var conn = this.Network.connect(id, {metadata: this.Metadata});
    this.Peers[id] = conn;
    conn.on('data', this.OnDataReceived.bind(this, conn));
    CallAll(this.OnStatusText, tr("<b>{0}</b> joined the session.", [conn.metadata.Nick]));
    return;
  }

  if(type === "leave-session")
  {
    conn.close();
    CallAll(this.OnStatusText, tr("<b>{0}</b> left the session.", [conn.metadata.Nick]));
    delete this.Peers[conn.peer];
  }

  if(type === "change-nick")
  {
    var oldName = conn.metadata.Nick;
    var newName = pack[1];
    if(oldName !== newName)
      CallAll(this.OnStatusText, tr("<b>{0}</b> changed their Nick to <b>{1}</b>.", [oldName, newName]));
    conn.metadata.Nick = newName;
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
  {
    this.Broadcast(["create-object", id, obj]);
  }

  return obj;
}

NetState.prototype.ChangeNick = function(newName)
{
  if(this.Metadata.Nick !== newName)
  {
    this.Metadata.Nick = newName;
    this.Broadcast(["change-nick", newName]);
    CallAll(this.OnStatusText, tr("You changed your Nick to <b>{0}</b>.", [newName]));
  }
}

NetState.prototype.RemoveObject = function(obj, origin)
{
  delete this.State.Objects[obj.ID];

  if(origin != "network")
    this.Broadcast(["remove-object", obj.ID]);

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