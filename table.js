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
	var elements = document.querySelectorAll(".tabbed section h2 a");
	for (var i = 0; i < elements.length; i++)
		elements[i].addEventListener("click", SetActiveTab.bind(undefined, elements[i].parentNode.parentNode));

	gNetState  = new NetState();
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.OnEtablishedSession.push(SessionInit);
	gNetState.OnStatusText.push(Status);
}

function SessionInit(id)
{
	var hash = window.location.hash.substr(1);
	if(hash)
	{
		gNetState.Join(hash);
	}
	else
	{
		var loc = window.location;
		var url = loc.protocol+"//"+loc.hostname+loc.pathname+"#"+id;
		Status("Etablished Network.<br>Give other players this link to join: <a href='"+url+"'>"+url+"</a>");
		gNetState.CreateObject({Type: "Token", X: 200, Y: 200, Texture: "Content/coinToken.png"});
	}
	var loading = document.getElementById("loading");
	loading.className = "finished";
	window.addEventListener('beforeunload', SessionExit);
}

function SessionExit()
{
	gNetState.Leave();
}

function Status(text)
{
	var chatArea = document.getElementById("chat-area");

	var div = document.createElement('div');
	div.className = "status";
	div.innerHTML = text;

	chatArea.appendChild(div);
}