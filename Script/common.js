"use strict";

// ------------
// Mode: Common
// ------------
var Common =
{
	Interface: "Object",
	Actions: ["Common.Move", "Common.Rotate", "Common.Scale", "Common.Remove"]
};
Script.Register("Common", Common);

Common.Initialize = function()
{
	this.State.X   = this.State.X || 0;
	this.State.Y   = this.State.Y || 0;
	this.State.Z   = this.State.Z || 0;
	this.State.Hovering = false;

	this.State.Rotation = this.State.Rotation || 0;
	this.State.ScaleX   = this.State.ScaleX   || 1;
	this.State.ScaleY   = this.State.ScaleY   || 1;
}

Common.UpdateHTML = function()
{
	var div = this.HTMLDiv;

	var transform = "";
	transform += "translate(-50%, -50%) ";
	transform += "translate3d("+Math.floor(this.State.X)+"px, "+Math.floor(this.State.Y)+"px, "+this.State.Z+"px) ";
	transform += "scaleX("+this.State.ScaleX+") ";
	transform += "scaleY("+this.State.ScaleY+") ";
	transform += "rotate("+this.State.Rotation+"deg) ";
	div.style.transform = transform;

	if(this.State.Hovering)
		div.style.zIndex = 200;
	else
		div.style.zIndex = '';

	if(this.State.Width  !== undefined) div.style.width  = this.State.Width +"px";
	if(this.State.Height !== undefined) div.style.height = this.State.Height+"px";
}

// ------------------
// Action: Common.Move
// ------------------
Common.Move =
{
	Label: "Move",
	Mode : "MultiDrag",
	Icon : "fa-arrows",
	Shortcut: 77, // "m"
	Interface: "Action"
};

Common.Move.Update = function(target, x, y)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;
	target.State.X = target.OriginalState.X + deltaX;
	target.State.Y = target.OriginalState.Y + deltaY;
	if(target.State.X === NaN)
	{
		console.error(target.State.X, NaN, this, arguments);
		target.State.X = 0;
		target.State.Y = 0;
	}

	if(Math.abs(deltaX) > 150 || Math.abs(deltaY) > 150)
	{
		this.Drop = true;
		target.State.Hovering = true;
	}
};

Common.Move.Finish = function(target, x, y)
{
	this.Update(target, x, y);
	if(this.Drop)
	{
		target.State.Hovering = false;
		// Handle Drag & Drop into stuff like the archive.
		// NOTE: This is asynchronous and will only work if this is the current action.
		// Slight ugliness, yes.
		if(Script.API.Interface.DropObject(this, target.Handle, x, y) === "MOVE")
			Script.API.NetState.Script.Remove(target.Handle, RELIABLE); // Thus we need to broadcast the result.
	}
};

// ---------------------
// Action: Common.Rotate
// ---------------------
Common.Rotate =
{
	Label: "Rotate",
	Mode : "MultiDrag",
	Icon : "fa-rotate-right",
	Shortcut: 82, // "r"
	Interface: "Action"
};

Common.Rotate.Update = function(target, x, y)
{
	var angle    =    Angle(this.CenterX, this.CenterY, x, y);
	var distance = Distance(this.CenterX, this.CenterY, x, y);

	if(!this.StartAngle && distance > 7.5)
		this.StartAngle = angle;

	if(this.StartAngle)
	{
		var deltaAngle = Round(angle - this.StartAngle, 5);
		target.State.Rotation = target.OriginalState.Rotation + deltaAngle;

		// Angle2 returns radians, Angle degrees.
		// This is because CSS uses degrees, but Math.sin/Math.cos uses radians.
		var targetAngle    = Angle2  (0, 0, target.OffsetX, target.OffsetY);
		var targetDistance = Distance(0, 0, target.OffsetX, target.OffsetY);
		var deltaAngleRad  = deltaAngle / 180 * Math.PI;
		target.State.X = Math.floor(this.CenterX + Math.cos(targetAngle + deltaAngleRad) * targetDistance);
		target.State.Y = Math.floor(this.CenterY + Math.sin(targetAngle + deltaAngleRad) * targetDistance);
	}
};

// --------------------
// Action: Common.Scale
// --------------------
Common.Scale =
{
	Label: "Scale",
	Mode : "MultiDrag",
	Icon : "fa-expand",
	Shortcut: 83, // "s"
	Interface: "Action"
};

Common.Scale.Init = function(x, y)
{
	this.StartDistance = Distance(this.CenterX, this.CenterY, this.StartX, this.StartY);
};

Common.Scale.Update = function(target, x, y)
{
	var distanceFactor = Distance(this.CenterX, this.CenterY, x, y) / this.StartDistance;
	distanceFactor = Round(distanceFactor, 0.25);

	target.State.ScaleX = target.OriginalState.ScaleX * distanceFactor;
	target.State.ScaleY = target.OriginalState.ScaleY * distanceFactor;

	target.State.X = Math.floor(this.CenterX + target.OffsetX * distanceFactor);
	target.State.Y = Math.floor(this.CenterY + target.OffsetY * distanceFactor);
};

// ------------------
// Action: Common.Resize
// ------------------
Common.Resize =
{
	Label: "Resize",
	Mode : "MultiDrag",
	Icon : "fa-compress",
	Interface: "Action"
};

Common.Resize.Update = function(target, x, y)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;

	// We center, make sure the Width/Height is dividable by 2 so that no object gets rendered on a half pixel
	target.State.Width  = Round(target.OriginalState.Width  + deltaX, 2);
	target.State.Height = Round(target.OriginalState.Height + deltaY, 2);

	target.State.X      = target.OriginalState.X + Math.floor((deltaX+1) / 2);
	target.State.Y      = target.OriginalState.Y + Math.floor((deltaY+1) / 2);
};

// ---------------------
// Action: Common.Remove
// ---------------------
Common.Remove =
{
	Label: "Remove",
	Mode: "ClickOnce",
	Icon: "fa-remove",
	Shortcut: 46, // Delete-Key
	Interface: "Action"
};

Common.Remove.Execute = function(target)
{
	Script.API.NetState.Script.Remove(target.Handle);
}
