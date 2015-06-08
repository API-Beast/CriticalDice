"use strict";

ObjHandle.Types["Dice"] = 
{
	Mode: "Simple",
	ClickAction: "Move",
	MenuActions: ["RollDice", "Rotate", "Delete"],
	Initialize: function(handle)
	{
		handle.Data.Faces = handle.Data.Faces || [1, 2, 3, 4, 5, 6];
	},
	OnUpdate: function(handle)
	{
	},
	InitHTML: function(handle, div)
	{
		div.classList.add("die");
		handle.Result = document.createElement("span");
		div.appendChild(handle.Result);
	},
	UpdateHTML: function(handle, div)
	{
		handle.Result.innerHTML = handle.Data.Faces[handle.Data.Face];
	}
};

ObjHandle.Actions["RollDice"] = 
{
	Label: "Roll",
	Type: "Grab",
	Icon: "fa-random",
	Shortcut: 71, // "g"-Key
	Enable: function(data)
	{
		data.Face = data.Face || 0;
	},
	OnStartGrab: function(action, x, y, ui, netstate)
	{
		action.Arrow = document.createElementNS("http://www.w3.org/2000/svg", "path");
		action.Arrow.setAttribute("class", "arrow");
		action.ArrowOutline = document.createElementNS("http://www.w3.org/2000/svg", "path");
		action.ArrowOutline.setAttribute("class", "outline");

		ui.AddSVG(action.ArrowOutline);
		ui.AddSVG(action.Arrow);
	},
	OnGrabbing: function(action, x, y, ui, netstate)
	{
		var length = Distance(action.CenterX, action.CenterY, x, y);
		var mX, mY;
		mX = (action.CenterX+x)/2;
		mY = (action.CenterY+y)/2 - length/5;
		var dX, dY;
		dX = (x - action.CenterX) / length;
		dY = (y - action.CenterY) / length;
		var sX, sY;
		sX = action.CenterX + dX * 12;
		sY = action.CenterY + dY * 12;
		var sX2, sY2;
		sX2 = action.CenterX + dX * 10;
		sY2 = action.CenterY + dY * 10;
		action.Arrow.setAttribute("d", subs("M {0} {1} S {2} {3} {4} {5}", [sX, sY, mX, mY, x, y]));
		action.ArrowOutline.setAttribute("d", subs("M {0} {1} S {2} {3} {4} {5}", [sX2, sY2, mX, mY, x, y]));
	},
	OnStopGrab: function(action, x, y, ui, netstate)
	{
		ui.RemoveSVG(action.ArrowOutline);
		ui.RemoveSVG(action.Arrow);
	}
};
