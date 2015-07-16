"use strict";

var      UNORDERED = 0; // Never discard, never postpone, never resend.
var     UNRELIABLE = 1; // Discard older packages, don't resend.
var       RELIABLE = 2; // Postpone package until all older packages are received.
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
  this.ReceivedResponse = false;
}

Package.prototype.pack = function()
{
  return [this.ID, this.Flags, this.Domain, this.Type, this.Args];
}
