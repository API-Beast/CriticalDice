"use strict";

NetState.Package = {};

NetState.Package.Ack = function(player, id)
{
  var p = player.PackageLog[id];
  if(p)
  {
    player.UpdatePing(window.performance.now() - p.SendTime);
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
  Status(">> {0} joined your Session.", player.GetHTMLTag());

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
    this.ConnectTo(peers[i]);

  player.Impersonate(intro);
  Status(">> You joined {0}'s Session.", player.GetHTMLTag());
}

NetState.Package.SetState = function(player, state)
{
  this.SetState(state);
}

NetState.Package.Goodbye = function(player)
{
  player.Connection.close();
  Status("{0} left the session.", player.GetHTMLTag());
  delete this.Players[player.ID];
}

NetState.Package.ChangeNick = function(player, intro)
{
  if(!player.Is(intro))
  {
    var oldNick = player.GetHTMLTag();
    player.Impersonate(intro);
    Status("{0} changed their Nick to {1}.", oldNick, player.GetHTMLTag());
  }
}
