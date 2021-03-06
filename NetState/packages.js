"use strict";

NetState.Package = {};

NetState.Package.Ack = function(player, id)
{
  var p = player.PackageLog[id];
  if(p)
  {
    player.UpdatePing(window.performance.now() - p.SendTime);
    p.ReceivedAck = true;
    if(!(p.Flags & AWAIT_RESPONSE))
      delete player.PackageLog[id];
  }
}

NetState.Package.Response = function(player, id, result)
{
  var p = player.PackageLog[id];
  p.ReceivedResponse = true;
  NetState.Package[p.Type].Response.apply(this, [player].concat(result));
  delete player.PackageLog[id];
}

NetState.Package.WaitForClockSync = function(player)
{
  this.WaitingForClockSync = true;

  for(var i = 0; i < 4; i++)
    this.SendReliable(player, "Ping", [], "", AWAIT_RESPONSE);
}

NetState.Package.Ping = function()
{
  return this.Clock();
}

NetState.Package.Ping.Response = function(player, theirClock)
{
  if(this.WaitingForClockSync && player.Pings.length > 3)
  {
    var connTime = theirClock + player.Ping/2;
    var thisTime = this.Clock();
    var delta = (connTime - thisTime);
    this.ClockStart -= delta;
    this.WaitingForClockSync = false;
    player.ClockSynced = true;

    console.log("Synced Clock, it is now:", this.Clock());

    this.ProcessPackageLog(player);
  }
}

NetState.Package.Join = function(player, intro)
{
  player.Impersonate(intro);
  Status("join", "<b>{0}</b> joined your Session.", player.Nick);

  this.SendReliable(player, "WaitForClockSync"); // This buffers later packages until the clock is synced.
  this.SendReliable(player, "SetState",    [this.State]);

  var playerList = [];
  for(var key in this.Players)
    playerList.push(key);

  return [playerList, this.MyPlayer.GetIntroduction()];
}

NetState.Package.Join.Response = function(player, peers, intro)
{
  for(var i = 0; i < peers.length; i++)
  if(peers[i] !== this.Network.id)
    this.ConnectTo(peers[i]);

  player.Impersonate(intro);
  Status("join", "You joined <b>{0}</b>'s Session.", player.Nick);
}

NetState.Package.SetState = function(player, state)
{
  this.SetState(state);
  CallAll(this.OnGlobalStateChange);
}

NetState.Package.SetState.Response = function(player)
{
  player.StateSynced = true;
}

NetState.Package.Goodbye = function(player)
{
  player.Connection.close();
  Status("leave", "<b>{0}</b> left the session.", player.Nick);
  delete this.Players[player.ID];
}

NetState.Package.ChangeNick = function(player, intro)
{
  if(!player.Is(intro))
  {
    var oldNick = player.Nick;
    player.Impersonate(intro);
    Status("system", "<b>{0}</b> changed their Nick to <b>{1}</b>.", oldNick, player.Nick);
  }
}

NetState.Package.ChatMsg = function(player, text, type, value)
{
  if(type === null || type === undefined)
    type = "chatmsg";
  ChatMessage(player.Nick, player.Color, text, type, value);
}

NetState.Package.UpdateGlobalState = function(player, newGlobalState)
{
  this.State.Global = newGlobalState;
  CallAll(this.OnGlobalStateChange);
}
