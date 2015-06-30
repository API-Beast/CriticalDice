"use strict";

Extend("Interface", function()
{
	this.ActionBar = null;
});

Extend("Interface.prototype.Init", function()
{
  this.ActionBar = document.createElement("div");
  this.ActionBar.className = "actionbar";
  this.SelectionDiv.appendChild(this.ActionBar);
});

Extend("Interface.prototype.UpdateSelection", function()
{
	if(this.SelectionRect)
	{
	  if(this.SelectionRect.top < 26)
	    this.ActionBar.className = "actionbar bottom";
	  else
	    this.ActionBar.className = "actionbar top";
	}
});

Extend("Interface.prototype.UpdatePossibleActions", function ()
{
  this.ActionBar.innerHTML = "";
	this.FillMenu(this.ActionBar, this.PossibleActions);
});

Interface.prototype.FillMenu = function(div, menu)
{
	for(var i = 0; i < menu.length; i++)
	{
		var act = menu[i];
		var prototype = this.NetState.Script.GetPrototype(act);
		if(!prototype) continue;

		var span = document.createElement('span');
		span.className = "item fa "+prototype.Icon;
		div.appendChild(span);

		var mdown = function(act, e)
		{
			if(e.button !== 0) return false;

			e.stopPropagation();
			e.preventDefault();
			this.ExecuteAction(act, e.pageX, e.pageY);
		};

		span.addEventListener("mousedown", mdown.bind(this, act));
	};
}
