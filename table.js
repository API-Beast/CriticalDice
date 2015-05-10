"use strict";

var gNetState  = null;
var gInterface = null;

document.onreadystatechange = function ()
{
  var state = document.readyState;
  if(state == 'interactive')
  {
  	GameInit();
  }
}

function GameInit(argument)
{
	document.getElementById("host-button").addEventListener('click', NewSession);
	document.getElementById("join-button").addEventListener('click', JoinSession);
}

function NewSession()
{
  var startDialog = document.getElementById("start-dialog");
  startDialog.style.display = 'none';

	var input = document.getElementById("host-id");
	gNetState  = new NetState(input.value);
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.CreateObject({Type: "Token", X: 200, Y: 200, Texture: "Content/coinToken.png"});
}

function JoinSession()
{
  var startDialog = document.getElementById("start-dialog");
  startDialog.style.display = 'none';

	var input = document.getElementById("join-id");
	gNetState  = new NetState();
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.Join(input.value);
	//gNetState.RequestState();
}