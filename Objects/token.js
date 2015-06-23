"use strict";

// ----------
// Type: Token
// ----------
var Token =
{
	ClickAction: "Common.Move",
	MenuActions: ["Common.Move", "Common.Rotate", "Common.Remove"],
	Inheritance: ["Common"]
};
ObjHandle.RegisterObjectType("Token", Token);

Token.Initialize = function()
{
	this.State.Texture = this.State.Texture || null;
	if(!this.State.Texture)
	{
		this.State.Width   = this.State.Width  || 64;
		this.State.Height  = this.State.Height || 64;
	}
};

Token.UpdateState = function()
{
	if(!this.State.Texture)
	{
		this.State.Width   = this.State.Width  || 64;
		this.State.Height  = this.State.Height || 64;
	}
	else
	{
		delete this.State.Width;
		delete this.State.Height;
	}
};

Token.InitHTML = function(div)
{
	this.Img = document.createElement("img");
	div.appendChild(this.Img);
	div.classList.add('token');
};

Token.UpdateHTML = function(div)
{
	if(this.State.Texture)
	{
		div.classList.remove('placeholder');
		this.Img.src = this.State.Texture;
	}
	else
	{
		if(this.PlaceholderSrc)
			this.Img.src = this.PlaceholderSrc;
		div.classList.add('placeholder');
	}
};