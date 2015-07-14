"use strict";

NetState.Package = {};

NetState.Package.Ack = function(player, id)
{
  var p = player.PackageLog[id];
  player.UpdatePing(window.performance.now() - p.SendTime);
  if(!(p.Flags & AWAIT_RESPONSE))
    delete player.PackageLog[id];
}

NetState.Package.Response = function(player, id, result)
{
  var p = player.PackageLog[id];
  NetState.Package[p.Type].Response.apply(this, [player, result]);
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
    this.ClockStart += delta;
    this.WaitingForClockSync = false;
    player.ClockSynced = true;

    this.ProcessPackageLog();
  }
}

NetState.Package.Goodbye = function(player)
{
  player.Connection.close();
  this.StatusText("<b>{0}</b> left the session.", player.Nick);
  delete this.Players[player.ID];
}

NetState.Package.ChangeNick = function(player, newName)
{
  if(player.Nick !== newName)
  {
    this.StatusText("<b>{0}</b> changed their Nick to <b>{1}</b>.", player.Nick, newName);
    player.Nick = newName;
  }
}

NetState.Package.Introduction = function(player, intro)
{
  player.Impersonate(intro);
}
