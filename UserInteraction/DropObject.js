"use strict";

Interface.prototype.DropObject = function(action, target, x, y)
{
  if(action !== this.LastAction)
  if(action !== this.CurrentAction)
    return undefined;

  target.HTMLDiv.style.pointerEvents = "none";

  // We need evnt to be mutable, that isn't a given with CustomEvent.
  // No idea if CustomEvent is synchronous or not either...
  var evnt = { result: undefined, object: target, action: action.Type, pageX: x, pageY: y};
  var eventTarget = document.elementFromPoint(x, y);
  while(eventTarget && evnt.result === undefined)
  {
    if(eventTarget.OnObjectDrop)
      eventTarget.OnObjectDrop(evnt);
    eventTarget = eventTarget.parentNode;
  }

  target.HTMLDiv.style.pointerEvents = '';
  return evnt.result;
}
