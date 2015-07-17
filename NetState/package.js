"use strict";

var     UNRELIABLE = 0; // Discard older packages, don't resend.
var       RELIABLE = 1; // Postpone package until all older packages are received.
var      UNORDERED = 2; // Never discard, never postpone, never resend.
var AWAIT_RESPONSE = 4; // Keep the package in the log until we have received a respone.

var Package = function(obj)
{
  if(obj)
  {
    this.ID       = obj[0];
    this.Flags    = obj[1];
    this.Domain   = obj[2];
    this.Type     = obj[3];
    this.Args     = obj[4];
  }
  else
  {
    this.ID       = -1;
    this.Flags    = UNORDERED;
    this.Domain   = "";
    this.Type     = "Null";
    this.Args     = [];
  }
  //
  this.SendTime       = null;
  this.LastResendTime = null;
  this.ResendTries    = 0;
  this.Handled        = false;
  this.ReceivedAck      = false;
  this.ReceivedResponse = false;
}

Package.prototype.pack = function()
{
  return [this.ID, this.Flags, this.Domain, this.Type, this.Args];
}

Package.prototype.getFlagString = function()
{
  var result = [];
  if(this.Flags === UNRELIABLE)     result.push("UNRELIABLE");
  if(this.Flags &   UNORDERED)      result.push("UNORDERED");
  if(this.Flags &   RELIABLE)       result.push("RELIABLE");
  if(this.Flags &   AWAIT_RESPONSE) result.push("AWAIT_RESPONSE");

  return result.join("|");
}
