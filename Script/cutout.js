"use strict";

// ----------
// Type: Cutout
// ----------
var Cutout =
{
	Actions: ["Common.Move", "Common.Rotate", "Common.Resize", "Common.Remove"],
	Inheritance: ["Common"],
	Interface:   "Object",
	Properties: [["Name", "Name", "Unnamed"], ["Text"], ["TextAlign", "H. Text-Align", "left"], ["VertAlign", "V. Text-Align", "top"], ["FontSize", "Font-Size"], ["FontColor", "Font-Color", "", "color"], ["BorderRadius", "Border-Radius"], ["Texture", "Picture-URL"], ["TexSize", "Picture-Size"], ["TexAlign", "Picture-Alignment"], ["Height"], ["Width"], ["BGColor", "BG-Color", "", "color"], ["BGTexture", "BG-Texture"]]
};
Script.Register("Cutout", Cutout);

Cutout.Initialize = function()
{
	this.State.Texture      = this.State.Texture || null;
  this.State.TexSize      = this.State.TexSize || "auto";
  this.State.TexAlign     = this.State.TexAlign || "center center";
  this.State.Width        = this.State.Width  || 150;
  this.State.Height       = this.State.Height || 150;
  this.State.BorderRadius = this.State.BorderRadius || "20px";
  this.State.BGColor      = this.State.BGColor || "#FFFFFF";
  this.State.Text         = this.State.Text || "";
  this.State.FontSize     = this.State.FontSize  || "150%";
  this.State.FontColor    = this.State.FontColor || "#000000";
  this.State.VertAlign    = this.State.VertAlign || "center";
  this.State.TextAlign    = this.State.TextAlign || "center";
};

Cutout.InitHTML = function()
{
	var div = this.HTMLDiv;
  div.classList.add('cutout');

	var self = this;
	div.addEventListener('keydown', function(e)
	{
		if(e.keyCode === 13)
		{
			self.Text.focus();
			PlaceCaretAtEnd(self.Text);
			e.stopPropagation();
			e.preventDefault();
		}
	});

  this.Container = document.createElement("div");

  this.Text = document.createElement('span');
  this.Text.classList.add('text');
  this.Text.contentEditable = true;

  var noPropagate = function(e)
  {
    e.stopPropagation();
  }

  this.Text.addEventListener('mousedown', noPropagate);
  this.Text.addEventListener('keydown',   noPropagate);
  this.Text.addEventListener('input',     this.OnTextEdit.bind(this));

  this.Container.appendChild(this.Text);
  div.appendChild(this.Container);

	this.UpdateState();
};

Cutout.OnTextEdit = function(event)
{
  var value = event.target.innerHTML;
  Script.API.NetState.Script.Update(this, {Text: value}, RELIABLE);
}

Cutout.Blur = function()
{
	this.HTMLDiv.blur();
	this.Text.blur();
}

Cutout.UpdateHTML = function()
{
	var div = this.Container;

  if(this.State.Width)  div.style.width  = this.State.Width +"px";
  else                  div.style.width  = '';

  if(this.State.Height) div.style.height = this.State.Height+"px";
  else                  div.style.height  = '';

  var bg = [];
  if(this.State.Texture)        bg.push("url("+this.State.Texture+") "+this.State.TexAlign+" / "+this.State.TexSize+" no-repeat");
	if(this.PlaceholderSrc){      bg.push("url("+this.PlaceholderSrc+") "+this.State.TexAlign+" / "+this.State.TexSize+" no-repeat");}
  if(this.State.BGTexture) bg.push("url("+this.State.BGTexture+")");

  if(this.State.BGColor)
  {
    bg.push("linear-gradient(rgba(255,255,255,0.25), transparent)");
    bg.push(this.State.BGColor);
  }

  div.style.borderRadius = this.State.BorderRadius;
  div.style.background   = bg.join(', ');

  var flexAlign = {"center": "center", "top": "flex-start", "bottom": "flex-end"};
  div.style.justifyContent = flexAlign[this.State.VertAlign];

  this.Text.innerHTML = this.State.Text || "";

  this.Text.style.fontSize  = this.State.FontSize;
  this.Text.style.color     = this.State.FontColor;
  this.Text.style.textAlign = this.State.TextAlign;
};
