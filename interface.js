"use strict";

var Interface = function(netstate)
{
	this.Table         = null;
	this.NetState      = netstate;
	this.MouseX        = 0;
	this.MouseY        = 0;
	this.MouseDelay    = 32;

	Script.API.Interface = this;
}

Interface.prototype.Init = function(table)
{
	this.Table = table;
	this.NetState.Script.OnUpdate  .push(this.OnObjectChange  .bind(this));
	this.NetState.Script.OnCreation.push(this.OnObjectCreation.bind(this));
	this.NetState.Script.OnRemoval .push(this.OnObjectRemoval .bind(this));

	this.MouseMove = this.OnMove.bind(this);
  window.addEventListener('mousemove', this.MouseMove,    true);
  window.addEventListener('mouseup',   this.OnRelease.bind(this), true);

	this.Table.addEventListener('mousedown',   this.OnTableClick.bind(this), false);
	this.Table.addEventListener('contextmenu', this.OnContextMenu.bind(this), false);

  // What the actual fucking fuck HTML5?! You have to change className for Grab & Drop to work
  // ...and no, it doesn't work with classList.
  // Also don't forget eating out a virgin at full moon and sacrifcing it afterwards to the dark IE gods.
	this.Table.addEventListener('dragenter', function(e){ this.className = "drag"; e.preventDefault(); });
  this.Table.addEventListener('dragend',   function(e){ this.className = "";     e.preventDefault(); });
  this.Table.addEventListener('dragover',  function(e){ e.preventDefault(); });
  this.Table.addEventListener('drop',      this.OnDrop.bind(this));
  window.addEventListener('keydown',   this.OnKeyPress.bind(this));

  window.requestAnimationFrame(this.GameLoop.bind(this));
};

Interface.prototype.OnKeyPress = function(e){};
Interface.prototype.OnClick = function(obj, e){};
Interface.prototype.OnDrop = function(e){};
Interface.prototype.OnTableClick = function(e){};
Interface.prototype.OnRelease = function(e){};
Interface.prototype.OnContextMenu = function(e){};
Interface.prototype.OnMove = function(e)
{
	this.MouseX = e.pageX;
	this.MouseY = e.pageY;

	// WORKAROUND
	// Problem is that Chrome and Firefox will both pump the queue full with MouseMove events
	// and these events stop the site from redrawing. Causing the animations to be very clunky.
	// So we limit the mouse move events to one per redraw by stopping to listen.
	window.removeEventListener('mousemove', this.MouseMove, true);
};

Interface.prototype.GameLoop = function()
{
	window.requestAnimationFrame(this.GameLoop.bind(this));
	this.NetState.GameTick(this);

	// WORKAROUND ^ See above.
	window.removeEventListener('mousemove', this.MouseMove, true);
	window.addEventListener('mousemove',    this.MouseMove, true);
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
}

Interface.prototype.OnObjectRemoval = function(iface, handle)
{
	if(iface !== "Object") return;

	var div = handle.HTMLDiv;
	div.parentNode.removeChild(div);
}
