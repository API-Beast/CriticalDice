"use strict";

// ----------
// Type: Sheet
// ----------
var Sheet =
{
	Actions: ["Common.Move", "Common.Rotate", "Common.Resize", "Common.Remove"],
	Inheritance: ["Common"],
	Interface:   "Object"
};
Script.Register("Sheet", Sheet);

Sheet.Initialize = function()
{
	this.State.Width   = this.State.Width  || 350;
	this.State.Height  = this.State.Height || 350;
};

Sheet.InitHTML = function()
{
	var div = this.HTMLDiv;
  div.classList.add('sheet');

	this.TextField = document.createElement("div");
  this.TextField.addEventListener("mousedown", function(e){ e.stopPropagation(); }, false);
	this.TextField.contentEditable = "true";
	this.TextField.classList.add("text-field");
	div.appendChild(this.TextField);

  /*this.Quill = new Quill(this.TextField);
  this.Quill.on('text-change', this.OnTextChange.bind(this));*/

	this.Resizer = document.createElement("span");
	this.Resizer.classList.add("resizer");
	this.Resizer.addEventListener("mousedown", this.ResizerMouseDown.bind(this));
	div.appendChild(this.Resizer);

  this.UpdateState();
};

Sheet.ResizerMouseDown = function(e)
{
	if(e.button !== 0) return false;

	e.stopPropagation();
	e.preventDefault();

	Script.API.Interface.ExecuteAction("Common.Resize", e.pageX, e.pageY);
}

Sheet.OnTextChange = function(delta)
{
  this.State.Content = this.Quill.getHTML();
}

Sheet.UpdateState = function()
{
  this.TextField.innerHTML = this.State.Content;
};

Sheet.UpdateHTML = function()
{

};
