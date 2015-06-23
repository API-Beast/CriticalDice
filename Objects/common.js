"use strict";

// ------------
// Type: Common
// ------------
var Common = {};
ObjHandle.RegisterObjectType("Common", Common);

Common.Initialize = function()
{
	this.State.X   = this.State.X || 0;
	this.State.Y   = this.State.Y || 0;
	this.State.Z   = this.State.Z || 0;

	this.State.Rotation = this.State.Rotation || 0;
	this.State.ScaleX   = this.State.ScaleX   || 1;
	this.State.ScaleY   = this.State.ScaleY   || 1;
}

Common.UpdateHTML = function(div)
{
	this.Div.style.position = "absolute";
	this.Div.style.left = this.State.X+"px";
	this.Div.style.top  = this.State.Y+"px";
	this.Div.style.zIndex = this.State.Z;

	var transform = "";
	transform += "scaleX("+this.State.ScaleX+") ";
	transform += "scaleY("+this.State.ScaleY+") ";
	transform += "rotate("+this.State.Rotation+"deg) ";
	this.Div.style.transform = transform;

	if(this.State.Width  !== undefined) this.Div.style.width  = this.State.Width +"px";
	if(this.State.Height !== undefined) this.Div.style.height = this.State.Height+"px";
}

// ------------------
// Action: Common.Move
// ------------------
Common.Move =
{
	Label: "Move",
	Type : "MultiDrag",
	Icon : "fa-arrows",
	Shortcut: 71 // "g"	
};

Common.Move.Update = function(target, x, y, ui, netstate)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;
	target.State.X = target.OriginalState.X + deltaX;
	target.State.Y = target.OriginalState.Y + deltaY;

	if(Math.abs(deltaX) > 150 || Math.abs(deltaY) > 150)
	{
		this.DropOnTop  = true;
		target.State.Hovering = true;
		target.State.Z = ui.CalcTopZIndexFor(target.Handle)+1;
	}
};

Common.Move.Finish = function(target, x, y, ui, netstate)
{
	this.Update(target, x, y, ui, netstate);
	if(this.DropOnTop)
	{
		target.State.Z = ui.CalcTopZIndexFor(target.Handle)+1;
		target.State.Hovering = false;
	}
};

// ---------------------
// Action: Common.Rotate
// ---------------------
Common.Rotate =
{
	Label: "Rotate",
	Type : "MultiDrag",
	Icon : "fa-rotate-right",
	Shortcut: 82, // "r"
};

Common.Rotate.Update = function(target, x, y, ui, netstate)
{
	var angle    = Angle(this.CenterX, this.CenterY, x, y);
	var distance = Distance(this.CenterX, this.CenterY, x, y);

	if(!this.StartAngle && distance > 7.5)
		this.StartAngle = angle;

	if(this.StartAngle)
	{
		var deltaAngle = angle - this.StartAngle;
		target.State.Rotation = target.OriginalState.Rotation + deltaAngle;

		// Angle2 returns radians, Angle degrees.
		// This is because CSS uses degrees, but Math.sin/Math.cos uses radians.
		var targetAngle    = Angle2  (0, 0, target.OffsetX, target.OffsetY);
		var targetDistance = Distance(0, 0, target.OffsetX, target.OffsetY);
		target.State.X = target.OriginalState.X + Math.cos(targetAngle + deltaAngle) * targetDistance;
		target.State.Y = target.OriginalState.Y + Math.sin(targetAngle + deltaAngle) * targetDistance;
	}
};

// --------------------
// Action: Common.Scale
// --------------------
Common.Scale =
{
	Label: "Scale",
	Type : "MultiDrag",
	Icon : "fa-expand",
	Shortcut: 83, // "s"
};

Common.Scale.Init = function(x, y, ui, netstate)
{
	this.StartDistance = Distance(this.CenterX, this.CenterY, x, y);
};

Common.Scale.Update = function(target, x, y, ui, netstate) 
{
	var distanceFactor = Distance(this.CenterX, this.CenterY, x, y) / this.StartDistance;

	target.State.ScaleX = target.Original.ScaleX * distanceFactor;
	target.State.ScaleY = target.Original.ScaleY * distanceFactor;

	target.State.X = this.CenterX + target.OffsetX * distanceFactor;
	target.State.Y = this.CenterY + target.OffsetY * distanceFactor;
};

// ------------------
// Action: Common.Resize
// ------------------
Common.Resize =
{
	Label: "Resize",
	Type : "MultiDrag",
	Icon : "fa-compress"
};

Common.Resize.Update = function(target, x, y, ui, netstate)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;

	target.State.Width  = target.OriginalState.Width  + deltaX;
	target.State.Height = target.OriginalState.Height + deltaY;
};

// ---------------------
// Action: Common.Remove
// ---------------------
Common.Remove =
{
	Label: "Remove",
	Type: "ClickOnce",
	Icon: "fa-remove",
	Shortcut: 46, // Delete-Key
};

Common.Remove.Execute = function(target, x, y, ui, netstate)
{
	netstate.Objects.Remove(target.State, NO_BROADCAST);
}
