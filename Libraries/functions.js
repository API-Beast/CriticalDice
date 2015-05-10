"use strict";

Array.prototype.shuffle = function()
{
  var currentIndex = this.length;
  var temporaryValue, randomIndex;
  var copy = this.slice(0);

  while(currentIndex)
  {
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // Swap a random element with the current index.
    temporaryValue     = copy[currentIndex];
    copy[currentIndex] = copy[randomIndex];
    copy[randomIndex]  = temporaryValue;
  }
  return copy;
}

String.prototype.beforeLastIndex = function (delimiter) {
    return this.split(delimiter).slice(0,-1).join(delimiter) || this + ""
}

function subs(str, obj)
{
  return str.replace(/\{([^\}]+)\}/g, function(match, key)
  {
    return obj[key] || '';
  });
}

// Deep
// Return Copy
function Merge()/*[...]*/
{
	var result = Object.create(null);
	for(var i = 0; i < arguments.length; i++)
  for(var p in arguments[i])
  {
  	if(typeof result[p] === "object")
  	{
  		if(Array.isArray(result[p]) && Array.isArray(arguments[i][p]))
  			result[p] = result[p].concat(arguments[i][p]);
  		else
  			result[p] = Merge(result[p], arguments[i][p]);
  	}
  	else
  		result[p] = arguments[i][p];
  }

  return result;
}

// Shallow
// Apply in Place (for stuff like ApplyTemplate(this, temp);)
function ApplyTemplate(to, template)
{
	if(template)
	for(var key in template)
	if(Object.prototype.hasOwnProperty.call(template, key))
	{
		to[key] = template[key];
	}
	return to;
}

function Distance(x, y, x2, y2)
{
  var a = x - x2;
  var b = y - y2;
  return Math.sqrt(a*a + b*b);
}

function Angle(x, y, x2, y2)
{
  return Math.atan2(y2 - y, x2 - x) * 180 / Math.PI;
}

function SetCSSAnimation(div, animation, time, direction)
{
	var propertyName = "";
	if(div.style["WebkitAnimationName"] !== undefined) propertyName = "WebkitAnimation";
	if(div.style["animationName"]       !== undefined) propertyName = "animation";
	if(!propertyName) return; // CSS-Animations aren't supported.

	if(!direction) direction = "normal";

	div.style[propertyName+"Name"]      = animation;
	div.style[propertyName+"Duration"]  = time;
	div.style[propertyName+"Direction"] = direction;
	div.style[propertyName+"PlayState"] = "initial";
	var animationEnd = function(){ this.style[propertyName+"Name"] = '';};
	div.addEventListener('webkitAnimationEnd', animationEnd, false);
	div.addEventListener('animationend', animationEnd, false);
}

function CallAll(arr)
{
  for(var i = 0; i < arr.length; i++)
    arr[i].apply(null, Array.prototype.slice.call(arguments, 1));
}

function GetDocumentOffset(obj)
{
  var left = 0;
  var top  = 0;
  while(obj)
  {
  	left += obj.offsetLeft;
  	top  += obj.offsetTop;
  	obj   = obj.offsetParent;
  } 
  return [left, top];
}

function LoadTextFiles(relPath, src, callback)
{
	var numFiles = src.length;
	for(var i = 0; i < src.length; i++)
	{
		var _file = src[i];
		var finished = function()
		{
			numFiles--;
			callback(this.responseText, numFiles, _file); 
		}

		var request = new XMLHttpRequest();
		request.addEventListener("load", finished, false);
		request.open("GET", relPath+_file);
		request.send();
	};

}

function IsEmptyObject(obj)
{
  for(var prop in obj)
    if(Object.prototype.hasOwnProperty.call(obj, prop))
      return false;
  return true;
}