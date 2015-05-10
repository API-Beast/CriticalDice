"use strict";

ObjHandle.Types["Token"] = 
{
	Type: "Simple",
	ClickAction: "Move",
	MenuActions: ["Rotate", "Scale"],
	Initialize: function(handle)
	{
		handle.Data.Texture = handle.Data.Texture || null;
		if(!handle.Data.Texture)
		{
			handle.Data.Width   = handle.Data.Width  || 64;
			handle.Data.Height  = handle.Data.Height || 64;
		}
	},
	OnUpdate: function(handle)
	{
		if(!handle.Data.Texture)
		{
			handle.Data.Width   = handle.Data.Width  || 64;
			handle.Data.Height  = handle.Data.Height || 64;
		}
		else
		{
			delete handle.Data.Width;
			delete handle.Data.Height;
		}
	},
	InitHTML: function(handle, div)
	{
		handle.Img = document.createElement("img");
		div.appendChild(handle.Img);
		div.classList.add('token');
	},
	UpdateHTML: function(handle, div)
	{
		if(handle.Data.Texture)
		{
			div.classList.remove('placeholder');
			handle.Img.src = handle.Data.Texture;
		}
		else
		{
			if(handle.PlaceholderSrc)
				handle.Img.src = handle.PlaceholderSrc;
			div.classList.add('placeholder');
		}
	}
};