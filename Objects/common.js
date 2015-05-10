"use strict";


/****************
 * Action: Move *
 ****************/
ObjHandle.Actions["Move"] = 
{
	Type: "Drag",
	Enable: function(data)
	{
		data.X = data.X || 0;
		data.Y = data.Y || 0;
	},
	OnStartDrag: function(action, x, y, env)
	{
		action.StartX = x;
		action.StartY = y;
		action.DropOnTop = false;
	},
	OnDragging: function(action, x, y, env)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100)
		{
			action.DropOnTop      = true;
			action.Result.Hovering = true;
		}
	},
	OnStopDrag: function(action, x, y, env)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.OriginalState.X + deltaX;
		action.Result.Y = action.OriginalState.Y + deltaY;

		if(action.DropOnTop)
		{
			// action.Result.Z = env.getStackHeightAt(x, y, action.Target);
			action.Result.Hovering = false;
		}
	}
};


/******************
 * Action: Rotate *
 ******************/
ObjHandle.Actions["Rotate"] = 
{
	Type: "Drag",
	Enable: function(data)
	{
		data.Rotation = data.Rotation || 0;
	},
	OnStartDrag: function(action, x, y, env)
	{
		action.StartX = x;
		action.StartY = y;
	},
	OnDragging: function(action, x, y, env)
	{
		var angle    = Angle(action.StartX, action.StartY, x, y);
		var distance = Distance(action.StartX, action.StartY, x, y);
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
	OnStopDrag: function() {}
};