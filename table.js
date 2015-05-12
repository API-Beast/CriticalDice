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

function SetActiveTab(tab)
{
	var parent = tab.parentNode;
	var elements = parent.querySelectorAll("section");
	for(var i = 0; i < elements.length; i++)
	{
		elements[i].className = "";
	}
	tab.className = "active-tab";
}

function GameInit(argument)
{
	document.getElementById("host-button").addEventListener('click', NewSession);
	document.getElementById("join-button").addEventListener('click', JoinSession);

	var elements = document.querySelectorAll(".tabbed section h2 a");
	for (var i = 0; i < elements.length; i++)
		elements[i].addEventListener("click", SetActiveTab.bind(undefined, elements[i].parentNode.parentNode));
}

function NewSession()
{
	var input = document.getElementById("host-id");
	gNetState  = new NetState(input.value);
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.CreateObject({Type: "Token", X: 200, Y: 200, Texture: "Content/coinToken.png"});
}

function JoinSession()
{
	var input = document.getElementById("join-id");
	gNetState  = new NetState();
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.Join(input.value);
	//gNetState.RequestState();
}