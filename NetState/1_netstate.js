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
  this.Network.on("error",
  function(err)
  {
    console.warn(err);
    if(!this.Initialized && !this.Failure)
    {
      CallAll(this.OnInitFailure);
      this.Failure = true;
    }
  }.bind(this));

  this.OnEtablishedSession = [];
  this.OnInitFailure = [];
  this.OnStateReset = [];
  this.OnGlobalStateChange = [];

  this.Initialized = false;
  this.Failure = false;

  this.State = {};
  this.State.Global = {};

  var rng = new DetRNG(Math.random()*99999);
  this.State.Global.RNGSeed = rng.seed;

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
  this.VerboseLogging = false; // Set this to true if you want to see what packages we receive, we send and what we do with them.
}

NetState.prototype.OnNetworkEtablished = function()
{
  CallAll(this.OnEtablishedSession, this.Network.id);
}

NetState.prototype.Clock = function()
{
  return Math.floor(window.performance.now() - this.ClockStart);
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
      if(p.ReceivedAck === false)
      if((time - p.LastResendTime) > 500)
      {
        player.Send(p.pack());
        p.LastResendTime = time;
        p.ResendTries++;
        this.LogNetwork("RESE", ">X", player, p);
      }
    }

    if((time - player.LastSendActivity) > 2000) // 2 seconds
    {
      if(player.LastPing)
      if(player.LastPing.ReceivedResponse === false)
      {
        if((time - player.LastPing.SendTime) > 15000) // 15 seconds
        {
          Status("leave", "{0} disconnected. (Ping timeout.)", player.Nick);
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
      f = flags | RELIABLE;

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

  if(flags & RELIABLE)
    p.ID = player.SentReliableID++
  else if(flags & UNORDERED)
    p.ID = -1;
  else
    p.ID = player.SentUnreliableID++;

  p.Type     = type;
  p.Flags    = flags;
  p.Domain   = domain || "";
  p.Args     = args || [];
  p.SendTime = window.performance.now();
  p.LastResendTime = p.SendTime;

  player.Send(p.pack());

  this.LogNetwork("SEND", ">>", player, p);

  if(p.Flags & AWAIT_RESPONSE || flags & RELIABLE)
    player.PackageLog[p.ID] = p;

  return p;
}

NetState.prototype.SendUnordered  = function(player, type, args, domain, flags){ return this.Send(player, type, args, domain, flags |  UNORDERED); }
NetState.prototype.SendReliable   = function(player, type, args, domain, flags){ return this.Send(player, type, args, domain, flags |   RELIABLE); }

NetState.prototype.Receive = function(player, packet)
{
  var p = new Package(packet);
  this.LogNetwork("RECV", "<<", player, p);

  if(p.Flags & RELIABLE)
  {
    this.SendUnordered(player, "Ack", [p.ID]);
    if(p.ID >= player.ProcessedReliableID)
    {
      if(player.PackageBuffer[p.ID] === undefined)
        player.PackageBuffer[p.ID] = p;
      this.ProcessPackageLog(player);
    }
  }
  else if(p.Flags & UNORDERED)
    this.HandlePackage(player, p);
  else
  {
    if(p.ID <= player.ProcessedUnreliableID)
      return 0; // Unreliable packages that are received out of order are discarded.
    else
    {
      player.ProcessedUnreliableID = p.ID;
      this.HandlePackage(player, p);
    }
  }
}

NetState.prototype.ProcessPackageLog = function(player)
{
  //if(this.WaitingForClockSync) return 0;
  // ^ We can't do that as we won't receive the ping responses that way.

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
  if(p.Handled === true) return;
  this.LogNetwork("PROC", "<>", player, p);

  var result = undefined;
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

NetState.prototype.ChangeNick = function(newNick)
{
  if(this.MyPlayer.Nick !== newNick)
  {
    this.MyPlayer.Nick = newNick;
    Status("system", "You changed your Nick to <b>{0}</b>.", newNick);
    this.Broadcast("ChangeNick", [this.MyPlayer.GetIntroduction()], "", RELIABLE);
  }
}

NetState.prototype.SetGlobal = function(key, value)
{
  this.State.Global[key] = value;
  this.Broadcast("UpdateGlobalState", [this.State.Global], "", RELIABLE);
  CallAll(this.OnGlobalStateChange);
}

NetState.prototype.Chat = function(text, type, value)
{
  if(type === "undefined") type = "chatmsg";
  ChatMessage(this.MyPlayer.Nick, this.MyPlayer.Color, text, type, value);
  this.Broadcast("ChatMsg", [text, type, value], "", RELIABLE);
}

NetState.prototype.LogNetwork = function(command, direction, player, p)
{
  if(this.VerboseLogging)
    console.log(command, player.ID.substr(0, 4), direction, p.Type, p.ID, p.Args, p.getFlagString());
}
