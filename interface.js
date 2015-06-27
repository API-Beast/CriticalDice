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
	this.Selection     = null;
	this.ActionBar     = null;
	this.MouseX        = 0;
	this.MouseY        = 0;
	Script.API.Interface = this;
}

Interface.prototype.Init = function(table, svgLayer)
{
	this.Table = table;
	this.NetState.Script.OnUpdate  .push(this.OnObjectChange  .bind(this));
	this.NetState.Script.OnCreation.push(this.OnObjectCreation.bind(this));
	this.NetState.Script.OnRemoval .push(this.OnObjectRemoval .bind(this));

	this.NetState.OnStateReset.push(this.OnStateReset.bind(this));

  this.Table.addEventListener('mousemove', this.OnMove.bind(this));
  this.Table.addEventListener('mouseup',   this.OnRelease.bind(this));

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
  this.ActionBar.className = "actionbar right";

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
			this.SetCenterPos(handle, this.MouseX, this.MouseY);
		}
	}
};

Interface.prototype.ExecuteAction = function(handle, action, mouseX, mouseY)
{
	var rect = handle.HTMLDiv.getBoundingClientRect();
	var blueprint = {
		Type:    action,
		StartX:  mouseX,
		StartY:  mouseY,
		CenterX: (rect.left + rect.right )/2,
		CenterY: (rect.top  + rect.bottom)/2
	};
	blueprint.Targets = [];
	blueprint.Targets.push({ID: handle.State.ID, OffsetX: 0, OffsetY: 0});
	this.CurrentAction = this.NetState.Script.Create("Action", blueprint);
};

Interface.prototype.UpdateActionBar = function()
{
	RemoveDiv(this.ActionBar);
	this.ActionBar.innerHTML = "";

	if(this.Selection)
	{
		var mode = this.Selection.Mode;
		if(mode === "Window") return;

		this.Selection.HTMLDiv.appendChild(this.ActionBar);

		var menu = this.Selection.MenuActions;
		this.FillMenu(this.ActionBar, this.Selection, menu);
	}
}

Interface.prototype.FillMenu = function(div, obj, menu)
{
	for(var i = 0; i < menu.length; i++)
	{
		var act = menu[i];
		var prototype = this.NetState.Script.GetPrototype(act);
		if(!prototype) continue;

		var span = document.createElement('span');
		span.className = "item fa "+prototype.Icon;
		div.appendChild(span);

		var mdown = function(act, obj, e)
		{
			if(e.button !== 0) return false;

			e.stopPropagation();
			e.preventDefault();
			this.ExecuteAction(obj, act, e.pageX, e.pageY);
		};

		span.addEventListener("mousedown", mdown.bind(this, act, obj));
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

	this.ExecuteAction(obj, obj.ClickAction, e.pageX, e.pageY);

	this.Selection = obj;
	this.UpdateActionBar();
};

Interface.prototype.OnDoubleClick = function(obj, e)
{
	e.stopImmediatePropagation();
};

Interface.prototype.OnMove = function(e)
{
	this.MouseX = e.pageX;
	this.MouseY = e.pageY;

	if(this.CurrentAction === null) return false;

	this.CurrentAction.MouseInput(this.NetState.Clock()+100, this.MouseX, this.MouseY);
};

Interface.prototype.GameLoop = function()
{
	window.requestAnimationFrame(this.GameLoop.bind(this));
	this.NetState.GameTick(this);
};

Interface.prototype.OnRelease = function(e)
{
	if(this.CurrentAction === null) return false;

	e.preventDefault();

	this.CurrentAction.MouseInput(this.NetState.Clock()+100, e.pageX, e.pageY);
	this.CurrentAction.FinishTime = this.NetState.Clock()+100;
	this.CurrentAction = null;
};

Interface.prototype.SetCenterPos = function(handle, x, y)
{
	var rect    = handle.Div.getBoundingClientRect();
	var centerX = (rect.left + rect.right)/2;
	var centerY = (rect.top  + rect.bottom)/2;
	var dataX   = handle.State.X;
	var dataY   = handle.State.Y;
	var delta   = {X: x + (dataX - centerX), Y: y + (dataY - centerY)};
	this.NetState.Script.Update(handle.State, delta);
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
