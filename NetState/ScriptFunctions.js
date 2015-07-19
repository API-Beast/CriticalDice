"use strict";

Script.API.GetGlobal = function(name)
{
  return Script.API.NetState.State.Global[name];
}

Script.API.SetGlobal = function(name, value)
{
  Script.API.NetState.State.Global[name] = value;
}

Script.API.GetRNG = function()
{
  return new DetRNG(Script.API.GetGlobal("RNGSeed"));
}

Script.API.UpdateSeed = function(rng)
{
  Script.API.SetGlobal("RNGSeed", rng.getSeed());
}
