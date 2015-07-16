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

function Angle2(x, y, x2, y2)
{
  return Math.atan2(y2 - y, x2 - x);
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

function GetSessionStorage(key)
{
  var val = sessionStorage.getItem(key);
  if(!val)
    return undefined;
  return JSON.parse(val);
}

function SetSessionStorage(key, value)
{
  if(value === undefined)
    sessionStorage.removeItem(key);
  else
    sessionStorage.setItem(key, JSON.stringify(value));
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
  this.seed = new Uint32Array([high, low]);
}

DetRNG.prototype.rand32Bit = function()
{
  this.seed[0] = (this.seed[0] >>> 16) + (this.seed[0] << 16);
  this.seed[0] += this.seed[1];
  this.seed[1] += this.seed[0];
  return this.seed[0];
};

DetRNG.prototype.rand = function()
{
  return this.rand32Bit() / 4294967295.0;
};

DetRNG.prototype.randInt = function(min, max)
{
  return ~~(min + this.rand() * ((max+1) - min));
};

DetRNG.prototype.randFloat = function(min, max)
{
  return (min + this.rand() * ((max) - min));
};

DetRNG.prototype.randSign = function()
{
  if(this.rand() >= 0.5)
    return 1;
  return -1;
};

function linear(start, end, factor)
{
  return start + (end - start) * factor;
};

function linear2(start, end, curT, startT, endT, fun)
{
  if(fun)
    return linear(start, end, fun((curT-startT)/(endT-startT)))
  return linear(start, end, (curT-startT)/(endT-startT));
};

function PlaySound(src)
{
  var audio = new Audio(src);
  audio.play();
}

// Resolve the string "A.B.C" to the value of obj.A.B.C
function DereferenceDotSyntax(obj, str, create)
{
  var keys = str.split('.');
  for(var x = 0; x < keys.length; x++)
  {
    var result = obj[keys[x]];
    if(result === undefined)
        return undefined;

    obj = result;
  }
  return obj;
}

// Resolve the string "A.B.C" to the value of obj.A.B.C
function DotSyntaxSetValue(obj, str, value)
{
  var keys = str.split('.');
  for(var x = 0; x < keys.length-1; x++)
  {
    var result = obj[keys[x]];
    if(result === undefined)
        result = obj[keys[x]] = {};
    obj = result;
  }
  obj[keys[keys.length-1]] = value;
}

var ClaimInheritance = function(first, inherited)
{
  for(var key in inherited)
  {
    if(first[key])
    {
      if(inherited[key] === first[key]) // The same, do nothing.
      {
        continue;
      }
      else if(typeof(first[key]) === "function") // A function, extend.
      {
        var combined = function (fn, fn2)
        {
          return function()
            {
              fn2.apply(this, arguments);
              return fn.apply(this, arguments);
            };
        }

        first[key] = combined(first[key], inherited[key]);
      }
      // Any other type: first[key] overwrites inherited[key]
      else
        continue;
    }
    else
      first[key] = inherited[key];
  }
};

function Extend(fnName, extension)
{
  var fn = DereferenceDotSyntax(window, fnName);

  var combined = function (fn1, fn2)
  {
    return function()
      {
        fn2.apply(this, arguments);
        return fn1.apply(this, arguments);
      };
  };

  var newFunc = combined(extension, fn);
  Object.setPrototypeOf(newFunc, fn);
  if(fn.prototype) newFunc.prototype = fn.prototype;

  DotSyntaxSetValue(window, fnName, newFunc);
}

function GetRect(x1, y1, x2, y2)
{
  return { left: Math.min(x1, x2), right: Math.max(x1, x2), top: Math.min(y1, y2), bottom: Math.max(y1, y2), width: Math.abs(x1 - x2), height: Math.abs(y1 - y2)};
}

function IntersectRect(r1, r2)
{
  var result = {left: null, right: null, top: null, bottom: null, width: null, height: null, area: null};
  result.left   = Math.max(r1.left,   r2.left);
  result.right  = Math.min(r1.right,  r2.right);
  result.top    = Math.max(r1.top,    r2.top);
  result.bottom = Math.min(r1.bottom, r2.bottom);
  result.width  = Math.max(result.right - result.left,   0);
  result.height = Math.max(result.bottom- result.top, 0);
  return result;
}

function InterpretColor(input)
{
  if(typeof(input) === "string")
  {
    var m = input.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if(m)
      return [m[1],m[2],m[3]];
  }
  return input;
}

function ColorIsDark(clr)
{
  clr = InterpretColor(clr);
	var brightness = (0.2126*clr[0] + 0.7152*clr[1] + 0.0722*clr[2]);
	return brightness < 140;
}
