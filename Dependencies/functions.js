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

Array.prototype.randomElement = function()
{
  return this[Math.floor(Math.random() * this.length)];
};

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

function RandomName()
{
  var a = ["Apple", "Blazing", "Orange", "Red", "White", "Blue", "Fierce", "Bright", "Dark", "Green", "Amazing", "Tiny", "Huge", "Silver", "Bronze", "Iron", "Doom", "Cute"];
  var b = ["Turtle", "Goblin", "Shark", "Elemental", "Spy", "Pirate", "Orb", "Golem", "Pillager", "Orphan", "Hammer", "Killer", "Minotaur", "Kobold", "Dwarf", "Giant", "Lizard", "Dragon", "Rabbit"];
  return a.randomElement() + " " + b.randomElement();
}

function GetStored(key)
{
  var val = localStorage.getItem(key);
  if(!val)
    return undefined;
  return JSON.parse(val);
}

function SetStored(key, value)
{
  if(value === undefined)
    localStorage.removeItem(key);
  else
    localStorage.setItem(key, JSON.stringify(value));
}

function Round(a, precision)
{
  var half = precision/2;
  return a+half - (a+half) % precision;
}

function RemoveDiv(div)
{
  if(div.parentNode)
    div.parentNode.removeChild(div);
}

function HashInt(val)
{
  var a = new Uint32Array(1);
  a[0] = val;
  a[0] = (a[0]+0x7ed55d16) + (a[0]<<12);
  a[0] = (a[0]^0xc761c23c) ^ (a[0]>>>19);
  a[0] = (a[0]+0x165667b1) + (a[0]<<5);
  a[0] = (a[0]+0xd3a2646c) ^ (a[0]<<9);
  a[0] = (a[0]+0xfd7046c5) + (a[0]<<3);
  a[0] = (a[0]^0xb55a4f09) ^ (a[0]>>>16);
  return Number(a[0]);
}

function DetRNG(seed)
{
  var h = HashInt(seed);
  var low  = h ^ 0x520AF59;
  var high = h ^ 0x49616E42;
  return {
    seed: new Uint32Array([high, low]),
    rand32Bit: function()
    {
      seed[0] = (seed[0] >>> 16) + (seed[0] << 16);
      seed[0] += seed[1];
      seed[1] += seed[0];
      return seed[0];
    },
    rand: function()
    {
      return this.rand32Bit() / 4294967295.0;
    },
    randInt: function(min, max)
    {
      return ~~(min + this.rand() * ((max+1) - min));
    },
    rand
  }
}