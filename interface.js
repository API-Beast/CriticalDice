"use strict";

var Interface = function(netstate)
{
	this.Table         = null;
	this.NetState      = netstate;
	this.CurrentAction = null;
	this.Selection     = null;
	this.InterfaceID   = "dummy";	
	this.Handles       = Object.create(null);
	this.ActionBar     = null;
}

Interface.prototype.Init = function(table)
{
	this.Table = table;
	this.NetState.OnObjectChange  .push(this.OnObjectChange  .bind(this));
	this.NetState.OnObjectCreation.push(this.OnObjectCreation.bind(this));
	this.NetState.OnObjectRemoval .push(this.OnObjectRemoval .bind(this));
	this.NetState.OnStateReset    .push(this.OnStateReset    .bind(this));

  this.Table.addEventListener('mousemove', this.OnMove.bind(this));
  this.Table.addEventListener('mouseup',   this.OnRelease.bind(this));

  // What the actual fucking fuck HTML5?! You have to change className for Grab & Drop to work
  // ...and no, it doesn't work with classList.
  // Also don't forget eating out a virgin at full moon and sacrifcing it afterwards to the dark IE gods.
	this.Table.addEventListener('dragenter', function(e){ this.className = "drag"; e.preventDefault(); });
  this.Table.addEventListener('dragend',   function(e){ this.className = "";     e.preventDefault(); });
  this.Table.addEventListener('dragover',  function(e){ e.preventDefault(); });
  this.Table.addEventListener('drop',      this.OnDropFile.bind(this));

  this.ActionBar = document.createElement("div");
  this.ActionBar.className = "actionbar right";
};

Interface.prototype.ExecuteAction = function(object, action, mouseX, mouseY)
{
	var act = {};
	act.Handle  = object;
	act.Target  = object.Data;
	act.OriginalState = Merge(object.Data);
	act.Result  = {};
	act.Type    = action;
	console.log("Start action ", action.Label);

	var rect = object.Div.getBoundingClientRect();
	act.CenterX = (rect.left + rect.right)/2;
	act.CenterY = (rect.top  + rect.bottom)/2;

	this.CurrentAction = act;

	if(action.Type === "Single")
	{
		this.ActionCallBack("OnExecute", this.CurrentAction, mouseX, mouseY, this);
		this.CurrentAction = null;
	}
	else
		this.ActionCallBack("OnStartGrab", this.CurrentAction, mouseX, mouseY, this);
};

Interface.prototype.UpdateActionBar = function()
{
	RemoveDiv(this.ActionBar);
	this.ActionBar.innerHTML = "";

	if(this.Selection)
	{
		this.Selection.Div.appendChild(this.ActionBar);

		var menu = this.Selection.Type.MenuActions;
		for(var i = 0; i < menu.length; i++)
		{
			var act = ObjHandle.Actions[menu[i]];
			var span = document.createElement('span');
			span.className = "item fa "+act.Icon;
			this.ActionBar.appendChild(span);

			var mdown = function(act, obj, e)
			{
				if(e.button !== 0) return false;

				e.stopPropagation();
				e.preventDefault();
				this.ExecuteAction(obj, act, e.pageX, e.pageY);
			};

			span.addEventListener("mousedown", mdown.bind(this, act, this.Selection));
		};
		
	}
}

Interface.prototype.OnDropFile = function(e)
{
	e.preventDefault();
	this.Table.className = "";
	
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
			this.NetState.CreateObject(token, undefined, this.InterfaceID);
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
				this.NetState.CreateObject(token, undefined, this.InterfaceID);

				var image = new Image();
				reader.onload = function()
				{
					image.onload = function()
					{
						self.NetState.UpdateObjectState(token, {Width: image.width, Height: image.height}, self.InterfaceID);
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
							self.NetState.UpdateObjectState(token, {Texture: response.data.link}, self.InterfaceID);
						}
						else
							self.NetState.RemoveObject(token, self.InterfaceID);
					}
				};
				xhttp.send(fd);
			}
		};
	}
};

Interface.prototype.OnObjectChange = function(id)
{
	this.Handles[id].updateHTML();
}

Interface.prototype.OnObjectCreation = function(id, data)
{
	var obj = new ObjHandle(data);
	this.Table.appendChild(obj.Div);
	obj.Div.addEventListener('mousedown', this.OnClick.bind(this, obj));
	obj.Div.addEventListener('dblclick',  this.OnDoubleClick.bind(this, obj));
	this.Handles[id] = obj;
}

Interface.prototype.OnObjectRemoval = function(id)
{
	var div = this.Handles[id].Div;
	div.parentNode.removeChild(div);
	delete this.Handles[id];
}

Interface.prototype.OnStateReset = function(state)
{
	this.Handles = Object.create(null);

  var last;
  while(last = this.Table.lastChild)
  	this.Table.removeChild(last);

	for(var id in state)
	{
		if(!Object.hasOwnProperty.call(state, id)) continue;
		var obj = state[id];
		this.OnObjectCreation(id, obj);
	}
}

Interface.prototype.OnClick = function(obj, e)
{
	if(e.button !== 0) return false;
	if(this.CurrentAction) return false;

	e.stopImmediatePropagation();
	e.preventDefault();

	this.ExecuteAction(obj, ObjHandle.Actions[obj.Type.ClickAction], e.pageX, e.pageY);

	this.Selection = obj;
	this.UpdateActionBar();
};

Interface.prototype.OnDoubleClick = function(obj, e)
{
	e.stopImmediatePropagation();
};

Interface.prototype.OnMove = function(e)
{
	if(this.CurrentAction === null) return false;

	this.ActionCallBack("OnGrabbing", this.CurrentAction, e.pageX, e.pageY, this);
};

Interface.prototype.OnRelease = function(e)
{
	if(this.CurrentAction === null) return false;

	e.preventDefault();
	this.ActionCallBack("OnStopGrab", this.CurrentAction, e.pageX, e.pageY, this);
	this.CurrentAction = null;
};

Interface.prototype.ActionCallBack = function(fname, act)
{
	var fn = act.Type[fname];
	var args = Array.prototype.slice.call(arguments, 1);
	var prevResult = act.Result;
	act.Result = {};
	// Note, fname is ignored, act is not.

	if(fn)
	{
		fn.apply(this, args);
		if(!IsEmptyObject(act.Result))
		{
			var delta = Merge(prevResult, act.Result);
			this.NetState.UpdateObjectState(act.Target, delta, this.InterfaceID);
		}
	}
}

Interface.prototype.RemoveObject = function(obj)
{
	this.NetState.RemoveObject(obj, this.InterfaceID);
};

Interface.prototype.getStackHeightAt = function(x, y, target)
{
	/*
	// Scan through the cards below this one, set Z so this one is above the others.
  this.Selection.Card.Div.style.pointerEvents = 'none';

  var topLeft = GetDocumentOffset(this.Selection.Card.Div);
  // Check the 4 corners
  var positions = [topLeft];
  positions.push([topLeft[0]+width, topLeft[1]]);
  positions.push([topLeft[0],       topLeft[1]+height]);
  positions.push([topLeft[0]+width, topLeft[1]+height]);

  for(var i = 0; i < positions.length; i++)
  {
    // pointer-events is none, else we would get the card itself.
    var cardBelow = document.elementFromPoint(positions[i][0], positions[i][1]);
    // We need to go through the parent elements so we know wheter this "thing" belongs to a card.
    while(cardBelow instanceof Element)
    {
      if(cardBelow.Card) break;
      cardBelow = cardBelow.parentNode;
    }

    if(cardBelow)
    if(cardBelow.Card)
      z = Math.max(z, cardBelow.Card.Z+1);
  };

  this.Selection.Card.Div.style.pointerEvents = '';
  this.Selection.Card.Z = z;
  */
}