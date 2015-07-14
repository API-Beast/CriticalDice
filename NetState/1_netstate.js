"use strict";

/* This networking model isn't completly perfect.
   There is just one reliable stream, and pings are send over that one too.
   So Ping can delay other, maybe more important packages.
*/

var NetState = function(name, id)
{
  if(id)
    this.Network = new Peer(id, {key: '53po7kdyuv1gu8fr'});
  else
    this.Network = new Peer({key: '53po7kdyuv1gu8fr'});

  this.Network.on("open", this.OnNetworkEtablished.bind(this));
	this.Network.on("connection", this.OnPeerConnected.bind(this));

  this.OnEtablishedSession = [];
  this.OnStatusText = [];
  this.OnStateReset = [];

  this.State = {};
  this.Script = new NetState.Script(this);

  this.ClockStart = window.performance.now();

  this.MyPlayer = new Player();
  this.Players  = Object.create(null);
}

NetState.prototype.OnNetworkEtablished = function()
{
  CallAll(this.OnEtablishedSession);
}

NetState.prototype.Clock = function()
{
  return window.performance.now() - this.ClockStart;
};

NetState.prototype.GameTick = function()
{
  var time = window.performance.now();

  for(var pid in this.Players)
  if(this.Players.hasOwnProperty(pid))
  {
    var player = this.Players[pid];

    // Resend Reliable packages we haven't received a ack or response for yet.
    for(var id in player.PackageLog)
    if(player.PackageLog.hasOwnProperty(id))
    {
      var p = player.PackageLog[id];
      if((time - p.LastResendTime) > 100 * ((p.ResendTries * p.ResendTries)||1))
      {
        player.Connection.send(p.pack());
        p.LastResendTime = time;
        p.ResendTries++;
      }
    }

    // TODO: Ping sometimes
    // Oops, I deleted this accidentally.
    // Must have pressed Ctrl-Z once too often and didn't notice.
  }

  var clock = this.Clock();
  var deltaTime = clock - this.LastTick;
  this.Script.GameTick(clock);
  this.LastTick = clock;
}

NetState.prototype.Broadcast = function(type, args, domain, flags)
{
  for(var pid in this.Players)
  if(this.Players.hasOwnProperty(pid))
  {
    var player = this.Players[pid];

    var f = flags;
    // Until the state is synced all Broadcasts are reliable.
    // This is so they can be applied after the state was finally received.
    if(!player.Introduced || !player.ClockSynced || !player.StateSynced)
      f = (flags & (~UNORDERED)) | RELIABLE;

    if(f & RELIABLE)
      this.SendReliable(player, type, args, domain, f);
    else if(f & UNORDERED)
      this.SendUnordered(player, type, args, domain, f);
    else
      this.Send(player, type, args, domain, f);
  }
}

NetState.prototype.OnPeerConnected = function(conn)
{
  var player = new Player(conn);
  this.Players[conn.peer] = player;
  this.SendReliable(player, "Introduction", [this.MyPlayer.GetIntroduction()]);
  this.SendReliable(player, "WaitForClockSync"); // This buffers later packages until the clock is synced.
  this.SendReliable(player, "SyncState",    [this.State]);
}

NetState.prototype.Send = function(player, type, args, domain, flags)
{
  var p = new Package();
  p.ID       = player.SentUnreliableID++;
  p.Flags    = UNRELIABLE | flags;
  p.Domain   = domain || "";
  p.Type     = type;
  p.Args     = args || [];
  p.SendTime = window.performance.now();

  player.Connection.send(p.pack());

  if(p.Flags & AWAIT_RESPONSE)
    player.PackageLog[p.ID] = p;
}

NetState.prototype.SendUnordered = function(player, type, args, domain, flags)
{
  var p = new Package();
  p.Flags    = UNORDERED | flags;
  p.Domain   = domain || "";
  p.Type     = type;
  p.Args     = args || [];
  p.SendTime = window.performance.now();

  player.Connection.send(p.pack());

  if(p.Flags & AWAIT_RESPONSE)
    player.PackageLog[p.ID] = p;
}

NetState.prototype.SendReliable = function(player, type, args, domain, flags)
{
  var p = new Package();
  p.ID       = player.SentReliableID++;
  p.Flags    = RELIABLE | flags;
  p.Domain   = domain || "";
  p.Type     = type;
  p.Args     = args || [];
  p.SendTime = window.performance.now();

  player.Connection.send(p.pack());

  player.PackageLog[p.ID] = p;
}

NetState.prototype.Receive = function(player, packet)
{
  var p = new Package(packet);

  if(p.Flags & UNRELIABLE)
  {
    if(p.ID < player.ProcessedUnreliableID)
      return 0; // Unreliable packages that are received out of order are discarded.
    else
    {
      player.ProcessedUnreliableID = p.ID;
      HandlePackage(player, p);
    }
  }
  else if(p.Flags & RELIABLE)
  {
    this.SendUnordered(player, "Ack", [p.ID]);
    // Reliable packages are buffered until they can be processed.
    if(p > player.ProcessedReliableID)
    {
      player.PackageBuffer[p.ID] = p;
      this.ProcessPackageLog(player);
    }
  }
  else
    HandlePackage(player, p);
}

NetState.prototype.ProcessPackageLog = function(player)
{
  if(this.WaitingForClockSync) return 0;

  var p = null;
  while(p = player.PackageBuffer[player.ProcessedReliableID+1])
  {
    player.ProcessedReliableID++;
    HandlePackage(player, p);
    delete player.PackageBuffer[player.ProcessedReliableID];
  }
}

NetState.prototype.HandlePackage = function(player, p)
{
  if(p.Handled === true) return;

  var result = null;
  if(p.Domain === "")
    result = NetState.Package[p.Type].apply(this, [player].concat(p.Args));
  else
    result = this[p.Domain].HandlePackage(p);

  p.Handled = true;

  if(p.Flags & AWAIT_RESPONSE)
    this.SendReliable(player, "Response", [p.ID, result]);
}

NetState.prototype.SetState = function(state)
{
  this.State = state;
  this.Script.StateReset(state);

  CallAll(this.OnStateReset, this.State);
}

NetState.prototype.Join = function(host)
{

}

NetState.prototype.Host = function()
{

}
