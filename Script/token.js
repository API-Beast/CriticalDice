"use strict";

// ----------
// Type: Token
// ----------
var Token =
{
	Actions: ["Common.Move", "Common.Rotate", "Common.Scale", "Common.Remove"],
	Inheritance: ["Common"],
	Interface:   "Object"
};
Script.Register("Token", Token);

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

Token.InitHTML = function()
{
	var div = this.HTMLDiv;
	this.Img = document.createElement("img");
	div.appendChild(this.Img);
	div.classList.add('token');
	this.UpdateState();
};

Token.UpdateState = function()
{
	var div = this.HTMLDiv;
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
}

Token.UpdateHTML = function()
{

};
