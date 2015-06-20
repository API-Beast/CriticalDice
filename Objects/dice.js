"use strict";

ObjHandle.Types["Dice"] = 
{
	Mode: "Simple",
	ClickAction: "Throw",
	MenuActions: ["Move", "Rotate", "Delete"],
	Initialize: function(handle)
	{
		handle.Data.CurrentFace = handle.Data.CurrentFace || 0;
		/*Face     = Library/d6facered.png
		Faces    = Library/d6faces.png
		FaceValues = [1, 2, 3, 4, 5, 6]
		FaceSize = [64, 64]
		NumFaces = 6*/
	},
	OnUpdate: function(handle)
	{
	},
	InitHTML: function(handle, div)
	{
		div.classList.add("die");
		handle.Result = document.createElement("span");
		handle.Result.classList.add("result");
		div.appendChild(handle.Result);
	},
	UpdateHTML: function(handle, div)
	{
		if(handle.Data.Tilted)
		{
			div.style.backgroundImage = "url("+handle.Data.Face+")";
			div.style.backgroundPosition = -(handle.Data.Tilted*handle.Data.FaceSize[0])+"px 0px";

			if(handle.Data.Tilted === 1)
				handle.Result.style.transform = "translateY(4px) translateX(3px) scale(0.8)";
			else
				handle.Result.style.transform = "translateY(-4px) translateX(-3px) scale(0.8)";

			div.classList.add("tilted");
		}
		else
		{
			div.style.backgroundImage = "url("+handle.Data.Face+")";
			handle.Result.style.transform = "";
			div.style.backgroundPosition = "";

			div.classList.remove("tilted");
		}
			
		handle.Result.style.backgroundImage = "url("+handle.Data.Faces+")";
		div.style.width  = handle.Data.FaceSize[0]+"px";
		div.style.height = handle.Data.FaceSize[1]+"px";
		handle.Result.style.backgroundPosition = (-handle.Data.FaceSize[0]*handle.Data.CurrentFace)+"px 0px";
	}
};

ObjHandle.Actions["Throw"] = 
{
	Label: "Roll",
	Type: "Grab",
	Icon: "fa-random",
	Shortcut: 71, // "g"-Key
	Enable: function(data)
	{
	},
	OnStartGrab: function(action, x, y, ui, netstate)
	{
		action.StartX = x;
		action.StartY = y;
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.Original.X + deltaX;
		action.Result.Y = action.Original.Y + deltaY;
	},
	OnStopGrab: function(action, x, y, ui, netstate)
	{
		var rng = new DetRNG(Math.floor(Math.random()*10000));
		action.Result.CurrentFace = rng.randInt(0, action.Original.NumFaces-1);
		action.Result.Rotation = rng.randInt(-40, +40);

		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.Original.X + deltaX;
		action.Result.Y = action.Original.Y + deltaY;

		var dist  = Distance(0, 0, deltaX, deltaY);
		var angle = Angle2(0, 0, deltaX, deltaY); 

		dist = (dist + 400) / 3;

		var targetX = action.Result.X + (Math.cos(angle) * dist);
		var targetY = action.Result.Y + (Math.sin(angle) * dist);

		var transition = {Type: "RollDice", Seed: Math.floor(Math.random()*10000), Bumps: 3 + dist/400, Duration: 400 + dist/2, Target: {X: targetX, Y: targetY, CurrentFace: rng.randInt(0, action.Original.NumFaces-1)}};
		netstate.Transitions.Create(action.Obj, transition);

		PlaySound("Library/diceThrow1.ogg");
	}
};

ObjHandle.Transitions["RollDice"] =
{
	OnStart: function(ts, netstate)
	{
		ts.EndTime = ts.StartTime + ts.Duration;
		var rng = new DetRNG(ts.Seed);
		var tilt = rng.randInt(1, 2);
		var lastFrame = { X: ts.Original.X, Y: ts.Original.Y, Face: ts.Original.CurrentFace, Tilted: tilt, Rotation: ts.Original.Rotation, EndTime: ts.StartTime};
		var bounce = rng.randSign() * Math.PI/10;
		var frames = [];
		for(var i = 0; i < ts.Bumps; i++)
		{
			var factor = i/(ts.Bumps+1);
			var frame = {};
			frame.StartTime = lastFrame.EndTime;
			frame.EndTime   = ts.StartTime + ts.Duration * factor;

			var startX = lastFrame.X;
			var startY = lastFrame.Y;
			var endX   = ts.Original.X*(1-factor) + ts.Target.X*factor;
			var endY   = ts.Original.Y*(1-factor) + ts.Target.Y*factor;
			var dist   = Distance(startX, startY, endX, endY);
			var angle  = Angle2(startX, startY, endX, endY);
			angle += bounce;
			bounce += rng.randFloat(-Math.PI/20, Math.PI/20);
			dist *= (1.2 + factor/2.0);

			frame.X = startX + dist * Math.cos(angle);
			frame.Y = startY + dist * Math.sin(angle);
			frame.Rotation = rng.randInt(-40, +40);

			do frame.Tilted = rng.randInt(1, 2);
			while(frame.Tilted === lastFrame.Tilted);

			do frame.Face = rng.randInt(0, ts.Obj.NumFaces-1);
			while(lastFrame.Face === frame.Face);

			frames.push(frame);
			lastFrame = frame;
		};
		// Last frame, final coordinates.
		ts.Target.StartTime = lastFrame.EndTime;
		ts.Target.EndTime   = ts.EndTime;
		ts.Target.Face      = ts.Target.CurrentFace;
		ts.Target.Rotation  = rng.randInt(-40, +40);
		frames.push(ts.Target);

		ts.LastFrame = {};
		ts.LastFrame.X = ts.Original.X;
		ts.LastFrame.Y = ts.Original.Y;

		ts.Frames = frames;
		ts.Obj.Tilted = tilt;
	},
	OnGameTick: function(ts, time, netstate)
	{
		var curFrame = ts.Frames[0];

		ts.Obj.X = linear2(ts.LastFrame.X, curFrame.X, time, curFrame.StartTime, curFrame.EndTime);
		ts.Obj.Y = linear2(ts.LastFrame.Y, curFrame.Y, time, curFrame.StartTime, curFrame.EndTime);

		if(time > curFrame.EndTime)
		{
			ts.Frames.shift();
			ts.LastFrame = curFrame;
			ts.Obj.CurrentFace = curFrame.Face;
			ts.Obj.Rotation = curFrame.Rotation;
			ts.Obj.Tilted   = curFrame.Tilted;
		}
		if(time > ts.EndTime)
			return 1;
	},
	OnEnd: function(ts, netstate)
	{
		ts.Obj.Tilted = 0;
		ts.Obj.X = ts.Target.X;
		ts.Obj.Y = ts.Target.Y;
		ts.Obj.Rotation = ts.Target.Rotation;
		ts.Obj.CurrentFace = ts.Target.CurrentFace;
	}
}