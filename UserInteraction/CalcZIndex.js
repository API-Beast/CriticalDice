"use strict";

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

  for(var y = rect.top; y < rect.bottom; y += 4)
  for(var x = rect.left; x < rect.right; x += 4)
  {
    var ele = document.elementFromPoint(x, y);
    // We need to go through the parent elements so we know wheter this "thing" belongs to a card.
    while(ele instanceof Element)
    {
      if(ele.GameHandle) break;
			if(ele === this.Table) break;
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
