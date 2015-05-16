"use strict";

ObjHandle.Types["Document"] = 
{
	Type: "Simple",
	ClickAction: "Move",
	DoubleAction: "EditRichText",
	MenuActions: ["Rotate"],
	Initialize: function(handle)
	{
		handle.Data.Content = [{ insert: "Write your content here..." }];
		handle.EditMode     = false;
		handle.HTMLContent  = "Write your content here...";
		handle.Editor       = undefined;
		handle.EditorDiv    = undefined;
	},
	Redraw: function(handle, div)
	{
		if(handle.EditMode === false)
			div.innerHTML = handle.HTMLContent;
		else
			div.appendChild();
	}
};

ObjHandle.Actions["EditRichText"] =
{
	Type:       "Focus",
	Locking:    false,
	OnFocus:     function(action)
	{
		action.Handle.EditMode = true;
		action.Handle.EditorDiv = document.createElement('div');	
		action.Handle.Editor    = new Quill(action.Handle.EditorDiv);
	},
	OnLoseFocus: function(action)
	{
		action.Handle.Editor   = undefined;
		action.Handle.EditMode = false;
	}
}