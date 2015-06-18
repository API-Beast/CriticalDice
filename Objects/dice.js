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
		div.style.backgroundImage = "url("+handle.Data.Face+")";
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

		action.Arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
		action.Arrow.setAttribute("class", "arrow");
		action.ArrowOutline = document.createElementNS("http://www.w3.org/2000/svg", "path");
		action.ArrowOutline.setAttribute("class", "outline");

		ui.AddSVG(action.ArrowOutline);
		ui.AddSVG(action.Arrow);
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.Original.X + deltaX;
		action.Result.Y = action.Original.Y + deltaY;

		if(Math.abs(deltaX) > 100 || Math.abs(deltaY) > 100)
		{
			var length = Distance(action.CenterX, action.CenterY, x, y);
			var dX, dY;
			dX = (x - action.CenterX) / length;
			dY = (y - action.CenterY) / length;
			var tX, tY;
			tX = x + dX*length;
			tY = y + dY*length;
			var mX, mY;
			mX = (action.CenterX+x)/2;
			mY = (action.CenterY+y)/2 - length/5;
			var sX, sY;
			sX = action.CenterX + dX * 12;
			sY = action.CenterY + dY * 12;
			var sX2, sY2;
			sX2 = action.CenterX + dX * 10;
			sY2 = action.CenterY + dY * 10;
			action.Arrow.setAttribute("d", subs("M {0} {1} S {2} {3} {4} {5}", [sX, sY, mX, mY, tX, tY]));
			action.ArrowOutline.setAttribute("d", subs("M {0} {1} S {2} {3} {4} {5}", [sX2, sY2, mX, mY, tX, tY]));
		}
		else
		{
			action.Arrow.setAttribute("d", "");
			action.ArrowOutline.setAttribute("d", "");
		}
	},
	OnStopGrab: function(action, x, y, ui, netstate)
	{
		var rng = new DetRNG(Math.floor(Math.random()*10000));
		action.Result.CurrentFace = rng.randInt(0, action.Original.NumFaces-1);
		action.Result.DiceRotation = rng.randInt(-60, 60);

		var deltaX = x - action.StartX;
		var deltaY = y - action.StartY;
		action.Result.X = action.Original.X + deltaX;
		action.Result.Y = action.Original.Y + deltaY;

		var targetX = action.Original.X + deltaX*2;
		var targetY = action.Original.Y + deltaY*2;

		var transition = {Type: "RollDice", Duration: 800+Math.abs(deltaX)+Math.abs(deltaY), Target: {X: targetX, Y: targetY}};
		netstate.Transitions.Create(action.Obj, transition);

		ui.RemoveSVG(action.ArrowOutline);
		ui.RemoveSVG(action.Arrow);
	}
};

ObjHandle.Transitions["RollDice"] =
{
	OnStart: function(ts, ui, netstate)
	{
		ts.EndTime = ts.StarTime + ts.Duration;
	},
	OnUpdate: function(ts, time, ui, netstate)
	{
		ts.Obj.X = linear2(ts.Original.X, ts.Target.X, time, ts.StartTime, ts.EndTime);
		ts.Obj.Y = linear2(ts.Original.Y, ts.Target.Y, time, ts.StartTime, ts.EndTime);
	},
	OnEnd: function(ts, ui, netstate)
	{
		ts.Obj.X = ts.Target.X;
		ts.Obj.Y = ts.Target.Y;
		ts.Obj.CurrentFace = ts.Target.CurrentFace;
	}
}