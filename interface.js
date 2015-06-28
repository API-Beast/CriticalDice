"use strict";

// ------
// Header
// ------

/*
class Interface
{
	// TODO
}
*/

// --------------
// Implementation
// --------------

var Interface = function(netstate)
{
	this.Table         = null;
	this.SVGLayer      = null;
	this.NetState      = netstate;
	this.CurrentAction = null;
	this.Selection     = [];
	this.PossibleActions = [];
	this.PrepareAction = null;
	this.PreparationX  = 0;
	this.PreparationY  = 0;
	this.ActionBar     = null;
	this.SelectionDiv  = null;
	this.MouseX        = 0;
	this.MouseY        = 0;
	this.MouseDelay    = 32;
	Script.API.Interface = this;
}

Interface.prototype.Init = function(table, svgLayer)
{
	this.Table = table;
	this.NetState.Script.OnUpdate  .push(this.OnObjectChange  .bind(this));
	this.NetState.Script.OnCreation.push(this.OnObjectCreation.bind(this));
	this.NetState.Script.OnRemoval .push(this.OnObjectRemoval .bind(this));

	this.NetState.OnStateReset.push(this.OnStateReset.bind(this));

	this.MouseMove = this.OnMove.bind(this);
  this.Table.addEventListener('mousemove', this.MouseMove,    true);
  this.Table.addEventListener('mouseup',   this.OnRelease.bind(this), true);
	this.Table.addEventListener('mousedown', this.OnTableClick.bind(this), false);

  // What the actual fucking fuck HTML5?! You have to change className for Grab & Drop to work
  // ...and no, it doesn't work with classList.
  // Also don't forget eating out a virgin at full moon and sacrifcing it afterwards to the dark IE gods.
	this.Table.addEventListener('dragenter', function(e){ this.className = "drag"; e.preventDefault(); });
  this.Table.addEventListener('dragend',   function(e){ this.className = "";     e.preventDefault(); });
  this.Table.addEventListener('dragover',  function(e){ e.preventDefault(); });
  this.Table.addEventListener('drop',      this.OnDrop.bind(this));
  window.addEventListener('keydown',   this.OnKeyPress.bind(this));

  window.requestAnimationFrame(this.GameLoop.bind(this));

  this.ActionBar = document.createElement("div");
  this.ActionBar.className = "actionbar";

	this.SelectionDiv = document.createElement("div");
	this.SelectionDiv.className = "selection";
	this.Table.appendChild(this.SelectionDiv);
	this.SelectionDiv.appendChild(this.ActionBar);

  this.SVGLayer = svgLayer;
};

Interface.prototype.OnKeyPress = function(e)
{
	if(e.repeat) return;

	// ---------
	// TODO: Fix
	// ---------
	// Copy
	if(e.which === 67 && e.ctrlKey)
	{
		if(this.Selection)
			SetStored("clipboard", this.Selection.State);
	}
	// Cut
	if(e.which === 88 && e.ctrlKey)
	{
		if(this.Selection)
		{
			SetStored("clipboard", this.Selection.State);
			this.NetState.RemoveObject(this.Selection.State);
		}
	}
	// Paste
	if(e.which === 86 && e.ctrlKey)
	{
		var copy = GetStored("clipboard");
		delete copy.ID;
		if(copy)
		{
			copy.X = this.MouseX;
			copy.Y = this.MouseY;
			this.NetState.Script.Create(copy);
			var handle = this.Handles[copy.ID];
		}
	}
};

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

	this.SelectionDiv.style.left   = selectionRect.left;
	this.SelectionDiv.style.width  = selectionRect.right - selectionRect.left;
	this.SelectionDiv.style.top    = selectionRect.top;
	this.SelectionDiv.style.height = selectionRect.bottom - selectionRect.top;
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

Interface.prototype.UpdatePossibleActions = function()
{
	if(this.Selection.length === 0)
	{
		this.PossibleActions = [];
		return;
	}

	this.PossibleActions = this.Selection[0].Actions;
	for(var i = 1; i < this.Selection.length; i++)
	{
		var handle = this.Selection[i];
		var actions = this.PossibleActions;
		this.PossibleActions = [];
		for(var i = 0; i < actions.length; i++)
		if(handle.Actions.indexOf(actions[i]) !== -1)
			this.PossibleActions.push(actions[i]);
	}
	this.ActionBar.innerHTML = "";
	this.FillMenu(this.ActionBar, this.PossibleActions);
	return;
}

Interface.prototype.FillMenu = function(div, menu)
{
	for(var i = 0; i < menu.length; i++)
	{
		var act = menu[i];
		var prototype = this.NetState.Script.GetPrototype(act);
		if(!prototype) continue;

		var span = document.createElement('span');
		span.className = "item fa "+prototype.Icon;
		div.appendChild(span);

		var mdown = function(act, e)
		{
			if(e.button !== 0) return false;

			e.stopPropagation();
			e.preventDefault();
			this.ExecuteAction(act, e.pageX, e.pageY);
		};

		span.addEventListener("mousedown", mdown.bind(this, act));
	};
}

Interface.prototype.OnDrop = function(e)
{
	e.preventDefault();
	this.Table.className = "";

	// Prefab-Drop
	// Internal, we won't get this from outside.
	var prefab = e.dataTransfer.getData("text/prs.prefab+json");
	if(prefab)
	{
		prefab = JSON.parse(prefab);
		prefab.X = e.pageX;
		prefab.Y = e.pageY;
		this.NetState.Script.Create("Object", prefab);
		return;
	}

	// URL-Drop
	// "URL"-Datatype is the first valid URL in a "text/uri-list" according to MDN
	var url = e.dataTransfer.getData("URL");
	if(url)
	{
		// Only create token if the URL is for a image.
		// Scrap that... Everyone but Imgur denies our Cross-URL XHTTP-requests.
		// Just check if the URL "looks" like a image.
		if(url.match(/.(\.png|\.jpg|\.jpeg|\.gif|\.apng)/))
		{
			var token = {Type: "Token", X: e.pageX, Y: e.pageY, Texture: url};
			this.NetState.Script.Create("Object", token);
		}
		else if(url.match(/.(\.mp3|\.ogg)/))
		{
			var player = {Type: "Player", X: e.pageX, Y: e.pageY, Source: url};
			this.NetState.Script.Create("Object", player);
		}
	}
	else // Firefox sends Images also as Files, o_O, so we have to do a either or
	{
		// File upload
		var files = e.dataTransfer.files;
		for (var i = 0; i < files.length; i++)
		{
			var file = files[i];
			if(file.type.match(/image.*/))
			{
				var self  = this;

				var reader = new FileReader();
				var token = {Type: "Token", X: e.pageX+(i*40), Y: e.pageY};
				this.NetState.Script.Create("Object", token);

				var image = new Image();
				reader.onload = function()
				{
					image.onload = function()
					{
						self.NetState.Script.Update(token, {Width: image.width, Height: image.height}, self.InterfaceID);
					};
					image.src = reader.result;
					self.Handles[token.ID].PlaceholderSrc = reader.result;
				};
				reader.readAsDataURL(file);


				var xhttp = new XMLHttpRequest();
				var fd    = new FormData();
				fd.append('image', file);
				xhttp.open('POST', 'https://api.imgur.com/3/image');
				xhttp.setRequestHeader('Authorization', 'Client-ID c7a1ef740b6ffdd');
				xhttp.onreadystatechange = function()
				{
					if(this.readyState === 4)
					{
						if(this.status === 200)
						{
							var response = JSON.parse(this.responseText);
							self.NetState.Script.Update(token, {Texture: response.data.link}, self.InterfaceID);
						}
						else
							self.NetState.Script.Remove(token, self.InterfaceID);
					}
				};
				xhttp.send(fd);
			}
		};
	}
};

Interface.prototype.OnObjectChange = function(iface, handle, oldState, delta)
{
	if(iface !== "Object") return;

	handle.UpdateState(delta);
	handle.UpdateHTML(handle.HTMLDiv);
}

Interface.prototype.OnObjectCreation = function(iface, handle)
{
	if(iface !== "Object") return;

	this.Table.appendChild(handle.HTMLDiv);
	handle.HTMLDiv.addEventListener('mousedown', this.OnClick.bind(this, handle));
	handle.HTMLDiv.addEventListener('dblclick',  this.OnDoubleClick.bind(this, handle));
}

Interface.prototype.OnObjectRemoval = function(iface, handle)
{
	if(iface !== "Object") return;

	var div = handle.HTMLDiv;
	div.parentNode.removeChild(div);
}

Interface.prototype.OnStateReset = function(state)
{
	/* TODO */
}

Interface.prototype.OnClick = function(obj, e)
{
	if(e.button !== 0) return false;
	if(this.CurrentAction) return false;

	e.stopImmediatePropagation();
	e.preventDefault();

	if(e.shiftKey || e.ctrlKey)
	{
		if(this.Selection.indexOf(obj) === -1)
			this.AddToSelection(obj);
		else
			this.RemoveFromSelection(obj);
	}
	else
	{
		if(this.Selection.indexOf(obj) === -1)
		{
			this.ClearSelection();
			this.AddToSelection(obj);
		}

		if(this.PossibleActions.length)
		{
			this.PrepareAction = this.PossibleActions[0];
			this.PreparationX = e.pageX;
			this.PreparationY = e.pageY;
		}
	}

	this.UpdateSelection();
};

Interface.prototype.OnTableClick = function(e)
{
	if(e.button !== 0) return false;
	if(this.CurrentAction) return false;

	this.ClearSelection();
	this.UpdateSelection();
}

Interface.prototype.OnDoubleClick = function(obj, e)
{
	e.stopImmediatePropagation();
};

Interface.prototype.OnMove = function(e)
{
	this.MouseX = e.pageX;
	this.MouseY = e.pageY;

	if(this.PrepareAction)
	{
		if(Distance(this.PreparationX, this.PreparationY, this.MouseX, this.MouseY) > 5)
		{
			this.ExecuteAction(this.PrepareAction, this.PreparationX, this.PreparationY);
			this.PrepareAction = null;
		}
	}

	if(this.CurrentAction)
	{
		this.CurrentAction.MouseInput(this.NetState.Clock() + this.MouseDelay, this.MouseX, this.MouseY);

		// WORKAROUND
		// Problem is that Chrome and Firefox will both pump the queue full with MouseMove events
		// and these events stop the site from redrawing. Causing the animations to be very clunky.
		// So we limit the mouse move events to one per redraw by stopping to listen.
		this.Table.removeEventListener('mousemove', this.MouseMove, true);
	}
};

Interface.prototype.GameLoop = function()
{
	window.requestAnimationFrame(this.GameLoop.bind(this));
	this.NetState.GameTick(this);

	// WORKAROUND ^ See above.
	this.Table.removeEventListener('mousemove', this.MouseMove, true);
	this.Table.addEventListener('mousemove',    this.MouseMove, true);
};

Interface.prototype.OnRelease = function(e)
{
	this.PrepareAction = null;
	if(this.CurrentAction === null) return false;

	e.preventDefault();

	this.CurrentAction.MouseInput(this.NetState.Clock() + this.MouseDelay, e.pageX, e.pageY);
	this.CurrentAction.FinishTime = this.NetState.Clock() + this.MouseDelay;
	this.CurrentAction = null;
};

Interface.prototype.CalcTopZIndexFor = function(target)
{
	// Ignore this object when scanning the stack height.
	var div = target.HTMLDiv;
	var prevPointerEvents = div.style.pointerEvents;
  div.style.pointerEvents = 'none';

  var rect = div.getBoundingClientRect();

  var width   = rect.right - rect.left;
  var height  = rect.bottom - rect.top;

  var z = 0;

  for(var y = rect.top; y < rect.bottom; y += 20)
  for(var x = rect.left; x < rect.right;  x += 20)
  {
    var ele = document.elementFromPoint(x, y);
    // We need to go through the parent elements so we know wheter this "thing" belongs to a card.
    while(ele instanceof Element)
    {
      if(ele.GameHandle) break;
      ele = ele.parentNode;
    }

    if(ele)
    if(ele.GameHandle)
  	if(z < ele.GameHandle.State.Z)
  	{
  		// Ignore too small elements, they should stay on top.
	    if((ele.getBoundingClientRect().width < rect.width/2))
	    	continue;
	    z = ele.GameHandle.State.Z;
  	}
  };

  if(!prevPointerEvents)
  	div.style.pointerEvents = '';
  else
  	div.style.pointerEvents = prevPointerEvents;

  return z;
}

Interface.prototype.AddSVG = function(element)
{
	this.SVGLayer.appendChild(element);
}

Interface.prototype.RemoveSVG = function(element)
{
	this.SVGLayer.removeChild(element);
}
