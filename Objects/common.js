"use strict";

ObjHandle.Actions["Move"] = 
{
	Label: "Move",
	Type: "Grab",
	Icon: "fa-move",
	Shortcut: 71, // "g"-Key
	Enable: function(data)
	{
		data.X = data.X || 0;
		data.Y = data.Y || 0;
	},
	OnStartGrab: function(action, x, y, env)
	{
		action.StartX = x;
		action.StartY = y;
		action.DropOnTop = false;
	},
	OnGrabbing: function(action, x, y, env)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100)
		{
			action.DropOnTop       = true;
			action.Result.Hovering = true;
		}
	},
	OnStopGrab: function(action, x, y, env)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(action.DropOnTop)
		{
			action.Result.Z = env.getStackHeightAt(x, y, action.Handle)+1;
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
	OnStartGrab: function(action, x, y, env)
	{
		var distance = Distance(action.CenterX, action.CenterY, x, y);
		var angle    = Angle(action.CenterX, action.CenterY, x, y);
		if(distance > 7.5)
			action.StartAngle = angle;
	},
	OnGrabbing: function(action, x, y, env)
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
	OnStartGrab: function(action, x, y, env)
	{
		action.StartDistance = Distance(action.CenterX, action.CenterY, x, y);
	},
	OnGrabbing: function(action, x, y, env)
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
	OnExecute: function(action, x, y, env)
	{
		env.RemoveObject(action.Target);
	}
}


ObjHandle.Actions["Copy"] =
{
	Label: "Copy",
	Type: "Single",
	Icon: "fa-copy",
	Shortcut: [17, 67], // Ctrl-C
	Hidden: true,
	OnExecute: function(action, x, y, env)
	{
		var copy = Merge(action.Target);
		delete copy.ID;
		SetStored("clipboard", copy);
	}
}


ObjHandle.Actions["Cut"] =
{
	Label: "Cut",
	Type: "Single",
	Icon: "fa-cut",
	Shortcut: [17, 88], // Ctrl-X
	Hidden: true,
	OnExecute: function(action, x, y, env)
	{
		var copy = Merge(action.Target);
		delete copy.ID;
		SetStored("clipboard", copy);
		env.RemoveObject(action.Target);
	}
}
