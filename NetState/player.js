"use strict";

var Player = function(conn)
{
  this.Nick       = "Unknown";
  this.Color      = "rgb(0, 0, 0)";
  this.Ping       = undefined;
  this.Pings      = [];

  this.SentReliableID   = 0;
  this.SentUnreliableID = 0;

  this.ProcessedReliableID   = 0;
  this.ProcessedUnreliableID = 0;

  this.PackageLog    = Object.create(null);
  this.PackageBuffer = Object.create(null);

  this.Introduced  = false;
  this.ClockSynced = false;
  this.StateSynced = false;

  this.LastSendActivity = window.performance.now();
  this.LastReceivedActivity = window.performance.now();

  this.LastPing = null;

  if(conn)
  {
    this.Connection = conn;
    this.ID         = conn.peer;
    if(conn.metadata.Introduction)
      this.Impersonate(conn.metadata.Introduction);
  }
}

Player.prototype.GetHTMLTag = function()
{
  if(ColorIsDark(this.Color))
    return subs("<span class='player-name dark' style='color:{Color}'>{Nick}</span>", this);
  else
    return subs("<span class='player-name' style='color:{Color}'>{Nick}</span>", this);
}

Player.prototype.GetIntroduction = function()
{
  return [this.Nick, this.Color];
}

Player.prototype.Is = function(intro)
{
  return this.Nick === intro[0] && this.Color === intro[1];
}

Player.prototype.Impersonate = function(introduction)
{
  this.Nick  = introduction[0];
  this.Color = introduction[1];
  this.Introduced = true;
}

Player.prototype.UpdatePing = function(newPing)
{
  this.Pings.push(newPing);
  if(this.Pings.length > 10)
    this.Pings.shift();

  var pings = this.Pings.slice();
  // Sigh, javascript, you can't even sort numbers without help.
  pings = pings.sort(function(a,b){return a-b;});
  // We use the mean to eliminate extreme outliers.
  this.Ping = pings[Math.floor(pings.length/2)];

  this.LastReceivedActivity = window.performance.now();
}

Player.prototype.Send = function(p)
{
  this.Connection.send(p);
  this.LastSendActivity = window.performance.now();
}
