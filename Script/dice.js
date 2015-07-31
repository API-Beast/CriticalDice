"use strict";

// ----------
// Type: Dice
// ----------
var Dice =
{
	Actions:     ["Dice.Throw", "Common.Move", "Common.Rotate", "Common.Remove"],
	Inheritance: ["Common"],
	Interface:   "Object"
};
Script.Register("Dice", Dice);


Dice.Initialize = function()
{
	var rng = new DetRNG(this.State.ID);
	this.State.CurrentFace = this.State.CurrentFace || rng.randInt(1, this.State.NumFaces-1);
}

Dice.InitHTML = function()
{
	var div = this.HTMLDiv;
	div.classList.add("die");

	this.Sprite = document.createElement("span");
	this.Sprite.classList.add("sprite");
	div.appendChild(this.Sprite);

	this.Result = document.createElement("span");
	this.Result.classList.add("sprite");
	div.appendChild(this.Result);

	this.Overlay = document.createElement("span");
	this.Overlay.classList.add("sprite");
	div.appendChild(this.Overlay);
}

Dice.UpdateHTML = function()
{
	var div = this.HTMLDiv;
	if(this.State.Tilted)
	{
		this.Sprite.style.backgroundImage = "url("+this.State.Face+")";
		this.Sprite.style.backgroundPosition = -(this.State.Tilted*this.State.FaceSize[0])+"px 0px";

		div.classList.add("tilted");
	}
	else
	{
		this.Sprite.style.backgroundImage = "url("+this.State.Face+")";
		this.Sprite.style.backgroundPosition = "";

		div.classList.remove("tilted");
	}

	div.style.width  = this.State.FaceSize[0]+"px";
	div.style.height = this.State.FaceSize[1]+"px";

	this.Result.style.backgroundImage = "url("+this.State.Faces+")";
	this.Result.style.backgroundPosition = (-(this.State.FaceSize[0]*this.State.Tilted||0))+"px "+(-this.State.FaceSize[0]*this.State.CurrentFace)+"px";

	this.Overlay.style.backgroundImage    = "url("+this.State.Overlay+")";
	this.Overlay.style.backgroundPosition = this.Sprite.style.backgroundPosition;
}

Dice.GetValue = function()
{
	return this.State.FaceValues[this.State.CurrentFace];
}

Dice.GetValueDecoration = function()
{
	if(this.State.CurrentFace === (this.State.NumFaces-1)) return "plus";
	if(this.State.CurrentFace === 0) return "minus";
	return undefined;
}


// ------------------
// Action: Dice.Throw
// ------------------
Dice.Throw =
{
	Label: "Roll",
	Type : "MultiDrag",
	Icon : "fa-bolt",
	Interface: "Action"
};


Dice.Throw.Update = function(target, x, y, time)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;
	target.State.X = target.OriginalState.X + deltaX;
	target.State.Y = target.OriginalState.Y + deltaY;
};

Dice.Throw.Finish = function(target, x, y, time)
{
	var deltaX = x - this.StartX;
	var deltaY = y - this.StartY;
	target.State.X = target.OriginalState.X + deltaX;
	target.State.Y = target.OriginalState.Y + deltaY;

	var refX = this.XKeyframes.get(time-60);
	var refY = this.YKeyframes.get(time-60);
	var dist  = Distance(refX, refY, x, y);
	var angle = Angle2(refX, refY, x-target.OffsetX, y-target.OffsetY) + target.Index * Math.PI/64;

	// Don't throw too far or too short.
	if(dist < 10) angle = Math.random()*Math.PI;
	dist = ((dist * 2) + 200) / 2;

	var goalX = Math.abs(target.State.X + (Math.cos(angle) * dist));
	var goalY = Math.abs(target.State.Y + (Math.sin(angle) * dist));

	var transition = {Type: "Dice.Roll", Target: target.State.ID, Bumps: 4 + dist/400, Duration: 400 + dist/2, Goal: {X: goalX, Y: goalY}};
	Script.API.NetState.Script.Create("Transition", transition);
};

// ---------------------
// Transition: Dice.Roll
// ---------------------
// Moves the dice from it current position to the target position, rolling a random number in the process.
// {
//   Type:     "Dice.Roll",
//   Seed:     int,             // The Seed to use for the Random Numbers used by this Transition.
//   Bumps:    int,             // How often the Dice will jump, 4 are recommended for short rolls, slightly more for long rolls.
//   Duration: int,             // How many milliseconds until the transition is finished.
//   Goal:   {X: int, Y: int} // Position the dice will land on in the end.
// }
Dice.Roll = {Interface: "Transition" };

Dice.Roll.Start = function(netstate)
{
	this.EndTime = this.StartTime + this.Duration;
	var rng = Script.API.GetRNG();
	var tilt = rng.randInt(1, 2);
	var lastFrame = { X: this.OriginalState.X, Y: this.OriginalState.Y, Face: undefined, Tilted: tilt, Rotation: this.OriginalState.Rotation, EndTime: this.StartTime};
	var bounce = rng.randSign() * Math.PI/10;
	var frames = [];
	for(var i = 0; i < this.Bumps; i++)
	{
		var factor = i/(this.Bumps+1);
		var frame = {};
		frame.StartTime = lastFrame.EndTime;
		frame.EndTime   = this.StartTime + this.Duration * factor;

		var startX = lastFrame.X;
		var startY = lastFrame.Y;
		var endX   = this.OriginalState.X*(1-factor) + this.Goal.X*factor;
		var endY   = this.OriginalState.Y*(1-factor) + this.Goal.Y*factor;
		var dist   = Distance(startX, startY, endX, endY);
		var angle  = Angle2(startX, startY, endX, endY);
		angle += bounce;
		bounce += rng.randFloat(-Math.PI/20, Math.PI/20);
		dist *= (1.2 + factor/2.0);

		frame.X = startX + dist * Math.cos(angle);
		frame.Y = startY + dist * Math.sin(angle);
		frame.Rotation = rng.randInt(-40, +40);

		do frame.Tilted = rng.randInt(1, this.Target.NumFrames-1);
		while(frame.Tilted === lastFrame.Tilted);

		do frame.Face = rng.randInt(0, this.Target.NumFaces-1);
		while(lastFrame.Face === frame.Face);

		frames.push(frame);
		lastFrame = frame;
	};
	// Last frame, final coordinates.
	this.Goal.StartTime = lastFrame.EndTime;
	this.Goal.EndTime   = this.EndTime;
	this.Goal.Face      = lastFrame.Face;
	this.Goal.Rotation  = rng.randInt(-9, +9)*5;
	frames.push(this.Goal);

	this.LastFrame = {};
	this.LastFrame.X = this.OriginalState.X;
	this.LastFrame.Y = this.OriginalState.Y;

	this.Frames  = frames;
	this.Target.Tilted = tilt;

	PlaySound("Library/diceThrow1.ogg");
	Script.API.UpdateSeed(rng);
};

Dice.Roll.GameTick = function(time, netstate)
{
	var curFrame = this.Frames[0];

	if(!curFrame || time > this.EndTime)
		return 1;

	this.Target.X = linear2(this.LastFrame.X, curFrame.X, time, curFrame.StartTime, curFrame.EndTime);
	this.Target.Y = linear2(this.LastFrame.Y, curFrame.Y, time, curFrame.StartTime, curFrame.EndTime);

	if(time > curFrame.EndTime)
	{
		this.Frames.shift();
		this.LastFrame = curFrame;
		this.Target.CurrentFace = curFrame.Face;
		this.Target.Rotation    = curFrame.Rotation;
		this.Target.Tilted      = curFrame.Tilted;
	}
};

Dice.Roll.Finish = function(netstate)
{
	this.Target.Tilted = 0;
	this.Target.X = this.Goal.X;
	this.Target.Y = this.Goal.Y;
	this.Target.Rotation = this.Goal.Rotation;
	this.Target.CurrentFace = this.Goal.Face;
	//this.Target.Z = gInterface.CalcTopZIndexFor(this.Handle)+1; // Terrible Hack.
};
