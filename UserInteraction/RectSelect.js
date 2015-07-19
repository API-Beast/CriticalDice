"use strict";

Extend("Interface", function()
{
  this.RectSelect     = {};
  this.RectSelect.X   = null;
	this.RectSelect.Y   = null;
	this.RectSelect.Div = null;
});

Extend("Interface.prototype.Init", function()
{
  this.RectSelect.Div = document.createElement("div");
	this.RectSelect.Div.className = "rectangle-selection"
	this.RectSelect.Div.style.display = "none";
	this.Table.appendChild(this.RectSelect.Div);
});

Extend("Interface.prototype.OnTableClick", function(e)
{
  if(e.button !== 0)     return;
  if(this.CurrentAction) return;

  this.RectSelect.X = e.pageX;
	this.RectSelect.Y = e.pageY;
});

Extend("Interface.prototype.OnMove", function(e)
{
  if(this.RectSelect.X !== null)
    this.UpdateRectSelect();
});

Extend("Interface.prototype.OnRelease", function(e)
{
  if(this.RectSelect.X === null) return;

  this.ClearSelection();
  var rect = GetRect(this.RectSelect.X, this.RectSelect.Y, e.pageX, e.pageY);

  for(var id in this.ElementDivs)
  {
    var ele = this.ElementDivs[id];
    if(!ele.GameHandle) continue;

    var eleRect = ele.getBoundingClientRect();
    // Don't select objects that aren't at least halfway in the selection rect.
    var intersection = IntersectRect(eleRect, rect);
    if((eleRect.width * eleRect.height)*0.5 > (intersection.width*intersection.height))
      continue;
    // Great, select!
    else
      this.AddToSelection(ele.GameHandle);
  }

  this.RectSelect.X = null;
  this.UpdateSelection();
  this.UpdateRectSelect();
});

Interface.prototype.UpdateRectSelect = function()
{
	if(this.RectSelect.X !== null)
	{
		var left   = Math.min(this.RectSelect.X, this.MouseX);
		var right  = Math.max(this.RectSelect.X, this.MouseX);
		var top    = Math.min(this.RectSelect.Y, this.MouseY);
		var bottom = Math.max(this.RectSelect.Y, this.MouseY);

		this.RectSelect.Div.style.left    = Math.floor(left);
		this.RectSelect.Div.style.width   = Math.floor(right - left);
		this.RectSelect.Div.style.top     = Math.floor(top);
		this.RectSelect.Div.style.height  = Math.floor(bottom - top);
		this.RectSelect.Div.style.display = "block";
	}
	else
		this.RectSelect.Div.style.display = "none";
}
