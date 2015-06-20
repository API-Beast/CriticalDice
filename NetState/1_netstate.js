"use strict";

// ------
// Header
// ------

// Origin flags.
var SOURCE_INTERFACE = 0;
var SOURCE_NETWORK   = 1; // If the origin is the network, it won't be broadcast

/*
class NetState
{
  void Join(peerID);               // Join target peer. Their current state will overwrite yours.
                                   // Also you will connect to any other peer that is connected to this one.

  void Leave();                    // Disconnect from all peers in the current session.
  void ChangeNick(newNick);        // Inform all other peers that your nick has changed.
  void SetState(newState, origin); // Set state. This will be broadcast to all other peers unless origin is SOURCE_NETWORK.
  void Broadcast(packet);          // Send the packet to all other peers you are connected to.
  void StatusText(str, ...);       // Display a status text, this has internal purposes and won't be broadcast.

  State = {};

  signal OnEtablishedSession(peerID); // This signal is send when the network is initialized and ready to be used.
  
                                      // peerID is the ID that was assigned to this computer.
  signal OnStatusText(htmlText);      // Is send whenever a status message should be displayed to the user.
  signal OnStateReset(newState);      // Is send whenever the state is overwritten.
                                      // (E.g. all objects were removed and new objects were added to replace them.)

  class Objects
  {
    // All these will be broadcast to all other peers unless origin is SOURCE_NETWORK.
    object Create(blueprint, id, origin); // Register a new game object.
    void Update(object, delta, origin);   // Apply the delta to the object.
    void Remove(object, origin);          // Remove the object from the State again
  };
  class Transitions
  {
    // Same as Objects.
  };

}*/

// --------------
// Implementation
// --------------

var NetState = function(name)
{
  this.Network = new Peer({key: '53po7kdyuv1gu8fr'});

  this.Network.on("open", this.OnNetworkEtablished.bind(this));
	this.Network.on("connection", this.OnPeerConnected.bind(this));
	this.Peers = Object.create(null);

  this.Metadata = {Nick: name};

  this.OnEtablishedSession = [];
  this.OnStatusText = [];
  this.OnStateReset = [];

  this.State = {};
  this.Objects     = new NetState.Objects(this);
  this.Transitions = new NetState.Transitions(this);

  this.ClockStart = window.performance.now();
}

NetState.prototype.Join = function(id)
{
  var conn = this.Network.connect(id, {metadata: this.Metadata});
  this.Peers[id] = conn;
  conn.on('data',  this.OnDataReceived.bind(this, conn));
  conn.on('close', this.OnPeerDisconnected.bind(this, conn));
  conn.on('open',  function(){ conn.send(["JoinSession"]); });

  this.StatusText("Joined <b>{0}</b>'s Session.", conn.metadata.Nick);
}

NetState.prototype.Leave = function()
{
  for(var id in this.Peers)
    this.Peers[id].send(["LeaveSession"]);
};

NetState.prototype.ChangeNick = function(newName)
{
  if(this.Metadata.Nick !== newName)
  {
    this.Metadata.Nick = newName;
    this.Broadcast(["ChangeNick", newName]);
    this.StatusText("You changed your Nick to <b>{0}</b>.", newName);
  }
}

NetState.prototype.SetState = function(newState, flags)
{
  this.State = newState;

  if(!(flags & SOURCE_NETWORK))
    this.Broadcast(["SetState", newState]);

  CallAll(this.OnStateReset, this.State);
};

NetState.prototype.Broadcast = function(data)
{
	for(var peer in this.Peers)
		this.Peers[peer].send(data);
}

NetState.prototype.StatusText = function(str)
{
  CallAll(this.OnStatusText, tr(str, Array.prototype.slice.call(arguments, 1)));
};

NetState.prototype.GameTick = function(ui)
{
  var time = this.Clock();
  var deltaTime = time - this.LastTick;

  this.Objects.GameTick(time, ui);
  this.Transitions.GameTick(time, ui);

  this.LastTick = time;
};

NetState.prototype.Clock = function()
{
  return window.performance.now() - this.ClockStart;
};

// ---------
// Callbacks
// ---------

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
  this.StatusText("<b>{0}</b> was disconnected.", conn.metadata.Nick);
}

NetState.prototype.OnDataReceived = function(conn, pack)
{
  console.log(pack);
  
  var type = pack[0];
  if(type === "Objects")     this.Objects    .HandlePackage(pack[1], pack.slice(2));
  if(type === "Transitions") this.Transitions.HandlePackage(pack[1], pack.slice(2));

  if(type === "JoinSession")
  {
    for(var id in this.Peers)
    if(id != conn.peer)
      this.Peers[id].send(["JoinedSession", conn.peer]);

    conn.send(["SetState", this.State]);
    this.StatusText("<b>{0}</b> joined the session.", conn.metadata.Nick);
    return;
  }

  if(type === "JoinedSession")
  {
    var id = pack[1];
    var conn = this.Network.connect(id, {metadata: this.Metadata});
    this.Peers[id] = conn;
    conn.on('data', this.OnDataReceived.bind(this, conn));
    this.StatusText("<b>{0}</b> joined the session.", conn.metadata.Nick);
    return;
  }

  if(type === "LeaveSession")
  {
    conn.close();
    this.StatusText("<b>{0}</b> left the session.", conn.metadata.Nick);
    delete this.Peers[conn.peer];
  }

  if(type === "ChangeNick")
  {
    var oldName = conn.metadata.Nick;
    var newName = pack[1];
    if(oldName !== newName)
      this.StatusText("<b>{0}</b> changed their Nick to <b>{1}</b>.", oldName, newName);
    conn.metadata.Nick = newName;
  }

  if(type === "SetState")
  {
    this.SetState(pack[1], SOURCE_NETWORK);
    return;
  }
}