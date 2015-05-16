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

	var nameField = document.getElementById("name-input");
	var name = GetStored("nick");
	if(!name)
	{ 
		name = RandomName();
		SetStored('nick', name);
	}
	nameField.value = name;
	nameField.addEventListener('blur', function(){ SetStored('nick', this.value); gNetState.ChangeNick(this.value); });
	nameField.addEventListener('keydown', function(e){ if(e.which == 13 || e.keyCode == 13){ SetStored('nick', this.value); gNetState.ChangeNick(this.value); } });

	window.addEventListener('storage', OnStorageChange, false);

	gNetState  = new NetState(name);
	gInterface = new Interface(gNetState);
	var playfield = document.getElementById("table");
	gInterface.Init(playfield);
	gNetState.OnEtablishedSession.push(SessionInit);
	gNetState.OnStatusText.push(Status);
}

function OnStorageChange(event)
{
	if(event.key === "nick")
	{
		var nameField = document.getElementById("name-input");
		nameField.value = JSON.parse(event.newValue);
		gNetState.ChangeNick(nameField.value);
	}

}

function SessionInit(id)
{
	var loc = window.location;
	var hash = loc.hash.substr(1);
	var url = loc.protocol+"//"+loc.hostname+loc.pathname+"#"+id;

	Status(tr("Etablished Session.<br>Give other players this link to join you: <a href='{0}'>{0}</a>", [url]));
	if(hash)
		gNetState.Join(hash);
	else
		gNetState.CreateObject({Type: "Token", X: 200, Y: 200, Texture: "Content/coinToken.png"});

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