"use strict";

/*
	class KeyFrameMap
	{
		void insert(time, data);
		void get(time); // Get the interpolated data at "time".

		array getValuesFor(time); // Get the frames that would be used to interpolate at "time"
		                          // as well the interpolation factor that would be used.
		                          // returns [firstFrameData, secondFrameData, interpolationFactor];

		array Frames = [];
		any DefaultValue = null; // This value is returned if there is no Keyframe at given "time".
	}
*/

// --------------
// Implementation
// --------------

var KeyFrameMap = function()
{
	this.Frames = [];
	this.DefaultValue = null;
};

KeyFrameMap.prototype.insert = function(time, data)
{
	var loc  = undefined;
	for(var i = 0; i < this.Frames.length; i++)
	{
		if(this.Frames[i][0] > time)
		{
			loc  = i;
			break;
		}
	};
	if(loc === undefined)
		this.Frames.push([time, data]);
	else
		this.Frames.splice(loc, 0, [time, data]);
}

KeyFrameMap.prototype.getValuesFor = function(time)
{
	var prev = null;
	var cur  = null;
	var first = this.Frames[0];
	var last  = this.Frames[this.Frames.length - 1];
	for(var i = 0; i < this.Frames.length; i++)
	{
		if(this.Frames[i][0] > time)
		{
			prev = this.Frames[i-1];
			cur  = this.Frames[i  ];
			break;
		}
	};

	if(this.Frames.length === 0)
		return [this.DefaultValue, this.DefaultValue, 1.0];
	else if(this.Frames.length === 1)
		return [this.Frames[0][1], this.Frames[0][1], 1.0]
	else if(!prev && !cur)
		return [last[1], last[1], 1.0];
	if(!prev && cur)
		return [cur[1], cur[1], 1.0];

	var factor = (time-prev[0])/(cur[0]-prev[0]);
	return [prev[1], cur[1], factor];
}

KeyFrameMap.prototype.get = function(time)
{
	var res = this.getValuesFor(time);
	return linear(res[0], res[1], res[2]);
};
