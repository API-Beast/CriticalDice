"use strict";

Extend("Interface.prototype.OnGlobalChange",
function()
{
  var back;
  if(back = this.NetState.State.Global.Background)
    this.Table.style.background = back;
  else
    this.Table.style.background = "";
}
);
