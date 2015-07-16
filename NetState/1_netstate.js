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
  this.Network.on("error", function(err){ console.error(err); });

  this.OnEtablishedSession = [];
  this.OnStateReset = [];

  this.State = {};
  this.Script = new NetState.Script(this);

  this.ClockStart = window.performance.now();

  this.MyPlayer = new Player();
  this.MyPlayer.Nick  = name;

  var clr = [[151,39,137], [55,95,26], [167,28,14], [37,38,54], [61,79,179], [129,46,75], [117,71,16], [52,86,134], [65,36,88],
                            [72,31,16], [26,82,92], [73,67,15], [132,31,29], [31,69,36], [121,36,98], [74,28,57], [108,57,133], [162,31,68],
                            [112,67,107], [31,46,84], [63,73,142], [157,32,97], [83,21,33], [153,58,20], [118,59,38], [104,66,166], [134,54,60],
                            [169,32,40], [75,78,110], [129,53,22]].randomElement();
  this.MyPlayer.Color = subs("rgb({0},{1},{2})", clr);

  this.Players  = Object.create(null);
}

NetState.prototype.OnNetworkEtablished = function()
{
  CallAll(this.OnEtablishedSession, this.Network.id);
}

NetState.prototype.Clock = function()
{
  return window.performance.now() - this.ClockStart;
};

NetState.prototype.GameTick = function()
{
  var time = window.performance.now();

  for(var pid in this.Players)
  {
    var player = this.Players[pid];

    // Resend Reliable packages we haven't received a ack or response for yet.
    for(var id in player.PackageLog)
    {
      var p = player.PackageLog[id];
      if((time - p.LastResendTime) > 100 * ((p.ResendTries * p.ResendTries)||1))
      {
        player.Send(p.pack());
        p.LastResendTime = time;
        p.ResendTries++;
      }
    }

    if((time - player.LastSendActivity) > 2000) // 2 seconds
    {
      if(player.LastPing)
      if(player.LastPing.ReceivedResponse === false)
      {
        if((time - player.LastPing.SendTime) > 15000) // 15 seconds
        {
          Status("<< {0} disconnected due to a ping timeout.", player.GetHTMLTag());
          delete this.Players[pid];
        }
        continue;
      }

      player.LastPing = this.SendReliable(player, "Ping", [], "", AWAIT_RESPONSE);
    }
  }

  var clock = this.Clock();
  var deltaTime = clock - this.LastTick;
  this.Script.GameTick(clock);
  this.LastTick = clock;
}

NetState.prototype.Broadcast = function(type, args, domain, flags)
{
  for(var pid in this.Players)
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

NetState.prototype.ConnectTo = function(id)
{
  return new Promise(function(resolve, reject)
  {
    var conn = this.Network.connect(id, {metadata:{Introduction:this.MyPlayer.GetIntroduction()}});
    conn.on('open', function()
    {
      var player = this.OnPeerConnected(conn);
      resolve(player);
    }.bind(this));
    conn.on('error', function(err)
    {
      reject(Error(err));
    }.bind(this));
  }.bind(this));
}

NetState.prototype.OnPeerConnected = function(conn)
{
  var player = new Player(conn);
  this.Players[conn.peer] = player;
  conn.on('data', this.Receive.bind(this, player));
  return player;
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

  player.Send(p.pack());

  if(p.Flags & AWAIT_RESPONSE)
    player.PackageLog[p.ID] = p;
  return p;
}

NetState.prototype.SendUnordered = function(player, type, args, domain, flags)
{
  var p = new Package();
  p.Flags    = UNORDERED | flags;
  p.Domain   = domain || "";
  p.Type     = type;
  p.Args     = args || [];
  p.SendTime = window.performance.now();

  player.Send(p.pack());

  //console.log("Sending ", player.ID, player.Nick, " -> (unordered) ", p.ID, p.Type, p.Args);

  if(p.Flags & AWAIT_RESPONSE)
    player.PackageLog[p.ID] = p;
  return p;
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

  player.Send(p.pack());

  //console.log("Sending ", player.ID, player.Nick, " -> ", p.ID, p.Type, p.Args);

  player.PackageLog[p.ID] = p;
  return p;
}

NetState.prototype.Receive = function(player, packet)
{
  var p = new Package(packet);
  //console.log("Receiving ", player.ID, player.Nick, " -> ", p.ID, p.Type, p.Args);

  if(p.Flags & UNRELIABLE)
  {
    if(p.ID < player.ProcessedUnreliableID)
      return 0; // Unreliable packages that are received out of order are discarded.
    else
    {
      player.ProcessedUnreliableID = p.ID;
      this.HandlePackage(player, p);
    }
  }
  else if(p.Flags & RELIABLE)
  {
    this.SendUnordered(player, "Ack", [p.ID]);
    player.PackageBuffer[p.ID] = p;
    this.ProcessPackageLog(player);
  }
  else
    this.HandlePackage(player, p);
}

NetState.prototype.ProcessPackageLog = function(player)
{
  //if(this.WaitingForClockSync) return 0;

  var p = null;
  while(p = player.PackageBuffer[player.ProcessedReliableID])
  {
    this.HandlePackage(player, p);
    delete player.PackageBuffer[player.ProcessedReliableID];
    player.ProcessedReliableID++;
  }
}

NetState.prototype.HandlePackage = function(player, p)
{
  //if(p.Handled === true) return;

  //console.log("Processing ", player.ID, player.Nick, " -> ", p.ID, p.Type, p.Args);

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
  this.ConnectTo(host).then(function(player)
  {
    this.SendReliable(player, "Join", [this.MyPlayer.GetIntroduction()], "", AWAIT_RESPONSE);
  }.bind(this));
}

NetState.prototype.Host = function()
{

}

NetState.prototype.Leave = function()
{
  this.Broadcast("Goodbye", [], "", UNORDERED);
}
