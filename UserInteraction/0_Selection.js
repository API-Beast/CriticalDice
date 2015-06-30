"use strict";

Extend("Interface", function()
{
  this.Selection       = [];
  this.SelectionRect   = null;
  this.PossibleActions = [];
  this.SelectionDiv    = null;
});

Extend("Interface.prototype.Init", function()
{
  this.SelectionDiv = document.createElement("div");
	this.SelectionDiv.className = "selection";
	this.Table.appendChild(this.SelectionDiv);
});

Extend("Interface.prototype.OnClick", function(handle, e)
{
  if(this.CurrentAction) return false;

  e.stopImmediatePropagation();
  e.preventDefault();

  if(e.shiftKey || e.ctrlKey)
  {
    if(this.Selection.indexOf(handle) === -1)
      this.AddToSelection(handle);
    else
      this.RemoveFromSelection(handle);
  }
  else
  {
    if(this.Selection.indexOf(handle) === -1)
    {
      this.ClearSelection();
      this.AddToSelection(handle);
    }
  }

  this.UpdateSelection();
});

Extend("Interface.prototype.OnObjectRemoval", function(iface, handle)
{
  if(iface !== "Object") return;

  this.RemoveFromSelection(handle);
	this.UpdateSelection();
});

Extend("Interface.prototype.OnTableClick", function(e)
{
  if(e.button !== 0) return false;
	if(this.CurrentAction) return false;

	this.ClearSelection();
	this.UpdateSelection();
});

Interface.prototype.UpdateSelection = function()
{
	if(this.Selection.length === 0)
	{
		this.SelectionDiv.classList.add("empty");
		return;
	}
	this.SelectionDiv.classList.remove("empty");

	if(this.Selection.length === 1)
		this.SelectionDiv.classList.add("single");
	else
		this.SelectionDiv.classList.remove("single");

	var selectionRect = undefined;
	for (var i = 0; i < this.Selection.length; i++)
	{
		var handle = this.Selection[i];
		var rect   = handle.HTMLDiv.getBoundingClientRect();

		if(!selectionRect)
			selectionRect = { left: rect.left, right: rect.right, top: rect.top, bottom: rect.bottom };
		else
		{
			selectionRect.left   = Math.min(rect.left,   selectionRect.left);
			selectionRect.right  = Math.max(rect.right,  selectionRect.right);
			selectionRect.top    = Math.min(rect.top,    selectionRect.top);
			selectionRect.bottom = Math.max(rect.bottom, selectionRect.bottom);
		}
	}
  this.SelectionRect = selectionRect;

	this.SelectionDiv.style.left   = Math.floor(selectionRect.left);
	this.SelectionDiv.style.width  = Math.floor(selectionRect.right - selectionRect.left);
	this.SelectionDiv.style.top    = Math.floor(selectionRect.top);
	this.SelectionDiv.style.height = Math.floor(selectionRect.bottom - selectionRect.top);
}

Interface.prototype.ClearSelection = function()
{
	for(var i = 0; i < this.Selection.length; i++)
		this.Selection[i].HTMLDiv.classList.remove("selected");

	this.Selection = [];
	this.UpdatePossibleActions();
}

Interface.prototype.AddToSelection = function(handle)
{
	this.Selection.push(handle);
	handle.HTMLDiv.classList.add("selected");
	this.UpdatePossibleActions();
}

Interface.prototype.RemoveFromSelection = function(handle)
{
	var i = this.Selection.indexOf(handle);
	if(i!==-1)
	{
		this.Selection.splice(i, 1);
		handle.HTMLDiv.classList.remove("selected");
		this.UpdatePossibleActions();
	}
};