"use strict";

var Player = function(conn)
{
  this.Nick       = "Unknown";
  this.Ping       = undefined;
  this.Pings      = [];

  this.SentReliableID   = 0;
  this.SentUnreliableID = 0;

  this.ProcessedReliableID   = -1;
  this.ProcessedUnreliableID = -1;

  this.PackageLog    = Object.create(null);
  this.PackageBuffer = Object.create(null);

  this.Introduced  = false;
  this.ClockSynced = false;
  this.StateSynced = false;

  this.LastSendActivity = window.performance.now();
  this.LastReceivedActivity = window.performance.now();

  if(conn)
  {
    this.Connection = conn;
    this.ID         = conn.peer;
    if(conn.metadata.Introduction)
      this.Impersonate(conn.metadata.Introduction);
  }
}

Player.prototype.GetIntroduction = function()
{
  return [this.Nick];
}

Player.prototype.Impersonate = function(introduction)
{
  this.Nick = introduction[0];
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
