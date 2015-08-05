"use strict";

Extend("Interface", function()
{
	this.Hotkeys = {};
});

Extend("Interface.prototype.OnKeyPress", function(e)
{
  if(e.repeat) return;

  if(this.Hotkeys[e.which])
	{
		if(this.Selection.length)
			this.ExecuteAction(this.Hotkeys[e.which], this.MouseX, this.MouseY);
	}
});

Extend("Interface.prototype.SelectionChanged", function ()
{
  this.Hotkeys = {};
  for(var i = 0; i < this.PossibleActions.length; i++)
  {
    var proto = this.NetState.Script.GetPrototype(this.PossibleActions[i]);
    var key = proto.Shortcut;
    if(key)
      this.Hotkeys[key] = this.PossibleActions[i];
  }
});
