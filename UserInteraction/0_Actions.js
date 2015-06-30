"use strict";

Extend("Interface", function()
{
  this.CurrentAction = null;
	this.PrepareAction = null;
	this.PreparationX  = 0;
	this.PreparationY  = 0;
  this.PossibleActions = [];
});

Extend("Interface.prototype.OnMove", function ()
{
  if(this.PrepareAction)
  {
    if(Distance(this.PreparationX, this.PreparationY, this.MouseX, this.MouseY) > 5)
    {
      this.ExecuteAction(this.PrepareAction, this.PreparationX, this.PreparationY);
      this.PrepareAction = null;
    }
  }

  if(this.CurrentAction)
    this.CurrentAction.MouseInput(this.NetState.Clock() + this.MouseDelay, this.MouseX, this.MouseY);
});

Extend("Interface.prototype.OnRelease", function(e)
{
  this.PrepareAction = null;
  if(this.CurrentAction === null) return false;

  e.preventDefault();
  e.stopPropagation();

  this.CurrentAction.MouseInput(this.NetState.Clock() + this.MouseDelay, e.pageX, e.pageY);
  this.CurrentAction.FinishTime = this.NetState.Clock() + this.MouseDelay;
  this.CurrentAction = null;
  this.PreventContext = true;
});

Extend("Interface.prototype.OnContextMenu", function(e)
{
  if(this.PreventContext)
	{
		e.preventDefault();
		this.PreventContext = false;
	}
});

Extend("Interface.prototype.OnClick", function(handle, e)
{
  if(!e.shiftKey && !e.ctrlKey)
  if(this.PossibleActions.length > e.button)
  {
    this.PrepareAction = this.PossibleActions[e.button];
    this.PreparationX = e.pageX;
    this.PreparationY = e.pageY;
  }
});

Interface.prototype.UpdatePossibleActions = function()
{
	if(this.Selection.length === 0)
	{
		this.PossibleActions = [];
		return;
	}

	this.PossibleActions = this.Selection[0].Actions;
	for(var j = 1; j < this.Selection.length; j++)
	{
		var handle = this.Selection[j];
		var actions = handle.Actions;
		this.PossibleActions = [];
		for(var i = 0; i < actions.length; i++)
		if(handle.Actions.indexOf(actions[i]) !== -1)
			this.PossibleActions.push(actions[i]);
	}
}

Interface.prototype.ExecuteAction = function(action, mouseX, mouseY)
{
	var blueprint =
	{
		Type:    action,
		StartX:  mouseX,
		StartY:  mouseY
	};
	blueprint.Targets = [];

	var selectionRect = undefined;
	for (var i = 0; i < this.Selection.length; i++)
	{
		var handle = this.Selection[i];
		var rect   = handle.HTMLDiv.getBoundingClientRect();
		blueprint.Targets.push({ID: handle.State.ID, CenterX: (rect.left + rect.right)/2, CenterY: (rect.top  + rect.bottom)/2});

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
	blueprint.CenterX = (selectionRect.left + selectionRect.right)/2;
	blueprint.CenterY = (selectionRect.top  + selectionRect.bottom)/2;

	this.CurrentAction = this.NetState.Script.Create("Action", blueprint);
};
