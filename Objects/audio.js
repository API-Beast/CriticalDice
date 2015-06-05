"use strict";

ObjHandle.Types["Player"] = 
{
	Mode: "Window",
	ClickAction: "Move",
	MenuActions: ["Move", "Delete"],
	Initialize: function(handle)
	{
		handle.Data.Source = handle.Data.Source || null;
	},
	OnUpdate: function(handle)
	{
	},
	InitHTML: function(handle, div)
	{
		handle.Player = document.createElement("audio");
		handle.Player.controls  = true;
		handle.Player.innerHTML = "ERROR: Audio is not supported by your Browser.";
		div.appendChild(handle.Player);
	},
	UpdateHTML: function(handle, div)
	{
		if(handle.Player.src !== handle.Data.Source)
			handle.Player.src = handle.Data.Source;
	}
};