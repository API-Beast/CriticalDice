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

  this.RectSelect.X = e.pageX + this.Table.scrollLeft;
	this.RectSelect.Y = e.pageY + this.Table.scrollTop;
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
  var rect = GetRect(this.RectSelect.X, this.RectSelect.Y, e.pageX + this.Table.scrollLeft, e.pageY + this.Table.scrollTop);

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
  var mX = this.MouseX + this.Table.scrollLeft;
  var mY = this.MouseY + this.Table.scrollTop;
	if(this.RectSelect.X !== null)
	{
		var left   = Math.min(this.RectSelect.X, mX);
		var right  = Math.max(this.RectSelect.X, mX);
		var top    = Math.min(this.RectSelect.Y, mY);
		var bottom = Math.max(this.RectSelect.Y, mY);

		this.RectSelect.Div.style.left    = Math.floor(left);
		this.RectSelect.Div.style.width   = Math.floor(right - left);
		this.RectSelect.Div.style.top     = Math.floor(top);
		this.RectSelect.Div.style.height  = Math.floor(bottom - top);
		this.RectSelect.Div.style.display = "block";
	}
	else
		this.RectSelect.Div.style.display = "none";
}
