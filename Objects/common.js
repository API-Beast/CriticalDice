"use strict";

ObjHandle.Actions["Move"] = 
{
	Label: "Move",
	Type: "Grab",
	Icon: "fa-arrows",
	Shortcut: 71, // "g"-Key
	Enable: function(data)
	{
		data.X = data.X || 0;
		data.Y = data.Y || 0;
		data.Z = data.Z || 0;
	},
	OnStartGrab: function(action, x, y, ui, netstate)
	{
		action.StartX = x;
		action.StartY = y;
		action.DropOnTop = false;
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100)
		{
			action.DropOnTop       = true;
			action.Result.Hovering = true;
			action.Result.Z        = 1000;
		}
	},
	OnStopGrab: function(action, x, y, ui, netstate)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(action.DropOnTop)
		{
			action.Result.Z = ui.CalcTopZIndexFor(action.Handle)+1;
			action.Result.Hovering = false;
		}
	}
};


ObjHandle.Actions["Rotate"] = 
{
	Label: "Rotate",
	Type: "Grab",
	Icon: "fa-rotate-right",
	Shortcut: 82, // "r"-Key
	Enable: function(data)
	{
		data.Rotation = data.Rotation || 0;
	},
	OnStartGrab: function(action, x, y, ui, netstate)
	{
		var distance = Distance(action.CenterX, action.CenterY, x, y);
		var angle    = Angle(action.CenterX, action.CenterY, x, y);
		if(distance > 7.5)
			action.StartAngle = angle;
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var angle    = Angle(action.CenterX, action.CenterY, x, y);
		var distance = Distance(action.CenterX, action.CenterY, x, y);
		if(!action.StartAngle)
		{
			if(distance > 7.5)
				action.StartAngle = angle;
		}
		else
		{
			var deltaAngle = angle - action.StartAngle;
			action.Result.Rotation = action.OriginalState.Rotation + deltaAngle;
		}
	},
	OnStopGrab: function() {}
};


ObjHandle.Actions["Scale"] =
{
	Label: "Scale",
	Type: "Grab",
	Icon: "fa-expand",
	Shortcut: 83, // "s"-Key
	Enable: function(data)
	{
		data.X      = data.X || 0;
		data.Y      = data.Y || 0;
		data.ScaleX = data.ScaleX || 1;
		data.ScaleY = data.ScaleY || 1;
	},
	OnStartGrab: function(action, x, y, ui, netstate)
	{
		action.StartDistance = Distance(action.CenterX, action.CenterY, x, y);
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var distanceFactor = Distance(action.CenterX, action.CenterY, x, y) / action.StartDistance;
		if(distanceFactor < 0.5)
			distanceFactor = 0.5;
		else if(distanceFactor > 2.0)
			distanceFactor = 2.0;
		else
			distanceFactor = Round(distanceFactor, 0.25);

		action.Result.ScaleX = action.OriginalState.ScaleX * distanceFactor;
		action.Result.ScaleY = action.OriginalState.ScaleY * distanceFactor;
	},
	OnStopGrab: function() {}
}


ObjHandle.Actions["Delete"] =
{
	Label: "Remove",
	Type: "Single",
	Icon: "fa-remove",
	Shortcut: 46, // Delete-Key
	OnExecute: function(action, x, y, ui, netstate)
	{
		netstate.RemoveObject(action.Target);
	}
}