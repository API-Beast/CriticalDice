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
	var id = function(a){ return document.getElementById(a); };

	var elements = document.querySelectorAll(".tabbed section h2 a");
	for (var i = 0; i < elements.length; i++)
		elements[i].addEventListener("click", SetActiveTab.bind(undefined, elements[i].parentNode.parentNode));

	var nameField = id("name-input");
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
	window.addEventListener('unload', SessionExit, false);
	var peerID = GetSessionStorage("PeerID");
	if(peerID)
		gNetState  = new NetState(name, peerID);
	else
		gNetState  = new NetState(name);

	gInterface = new Interface(gNetState);
	var playfield = id("table");
	gInterface.Init(playfield);
	gNetState.OnEtablishedSession.push(SessionInit);
	gNetState.OnStatusText.push(Status);


	id("save-session-button").addEventListener('click', SaveSession);
	id("load-session-button").addEventListener('click', LoadSession);


	RequestLibrary(function()
	{
		var libraryList = id("library-list");
		libraryList.classList.add("library");

		var folders = gLibrary.Folder;
		for(var i = 0; i < folders.length; i++) {
			var f = folders[i];
			libraryList.appendChild(LibraryItem(f));
		};

		var prefabs = gLibrary.Prefab;
		for(var i = 0; i < prefabs.length; i++)
		{
			var p = prefabs[i];
			libraryList.appendChild(LibraryItem(p));
		};

	});
}

function LibraryItem(p)
{
	var item = document.createElement("div");
	var label = document.createElement("div");
	label.className = "label";
	item.appendChild(label);

	var icon;
	if(typeof p.Icon === 'string')
	{
		var colorRegEx = /^(#[a-f0-9]{6}|#[a-f0-9]{3}|rgb *\( *[0-9]{1,3}%? *, *[0-9]{1,3}%? *, *[0-9]{1,3}%? *\)|rgba *\( *[0-9]{1,3}%? *, *[0-9]{1,3}%? *, *[0-9]{1,3}%? *, *[0-9]{1,3}%? *\)|black|green|silver|gray|olive|white|yellow|maroon|navy|red|blue|purple|teal|fuchsia|aqua)$/i;
	  if(p.Icon.match(colorRegEx)) // Color
		{
			icon = document.createElement("span");
			icon.style.backgroundColor = p.Icon;
			icon.classList.add("single-color");
		}
		else // URL
		{
			icon = document.createElement("img");
			icon.src = p.Icon;
		}
	}
	else if(Array.isArray(p.Icon)) // URL + Offset and Size
	{
		icon = document.createElement("span");
		// p.Icon = [path, xOff, yOff, width, height]
		icon.style.backgroundImage    = p.Icon[0];
		icon.style.backgroundPosition = subs("-{1}px -{2}px", p.Icon);
		icon.style.width  = p.Icon[3];
		icon.style.height = p.Icon[4];
	}
	if(icon)
	{
		icon.classList.add("icon");
		label.appendChild(icon);
	}

	var name = document.createTextNode(p.Title || p.Name);
	label.appendChild(name);

	if(p.Prefab || p.Folder)
	{
		item.className = "folder";
		item.addEventListener('click',
			function()
			{
				this.classList.toggle("open");
			});

		var contents = document.createElement("div");
		contents.className = "contents";

		if(p.Folder) for(var i = 0; i < p.Folder.length; i++) contents.appendChild(LibraryItem(p.Folder[i]));
		if(p.Prefab) for(var i = 0; i < p.Prefab.length; i++) contents.appendChild(LibraryItem(p.Prefab[i]));

		item.appendChild(contents);
	}
	else
	{
		item.className = "item";
		item.draggable = true;
		item.addEventListener('dragstart',
			function(p, e)
			{
				e.dataTransfer.setData('text/prs.prefab+json', JSON.stringify(p));
			}.bind(null, p));
	}
	return item;
}

function SaveSession()
{
	var link = document.createElement('a');
	var data = JSON.stringify(gNetState.State);
	link.download = "session-"+new Date().toLocaleDateString()+".json";
	link.href = 'data:,'+data;
	// Firefox doesn't emulate the click if the element isn't in the DOM
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
}

function LoadSession()
{
	var input = document.createElement('input');
	input.type = "file";
	input.addEventListener("change", function(event){
		var f = event.target.files[0];
		if(f)
		{
			var r = new FileReader();
			r.onload = function()
			{
				var contents = this.result;
				var result = JSON.parse(contents);
				gNetState.SetState(result);
			};
			r.readAsText(f);
		}
	});

	document.body.appendChild(input);
	input.click();
	document.body.removeChild(input);
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

	var sessionPeers = GetSessionStorage("Peers");
	if(sessionPeers)
	{
		var joinNextPeer = function()
		{
			var peer = sessionPeers.pop();
			if(peer)
				gNetState.Join(peer, joinNextPeer);
			else
			{
        var autoSave = GetSessionStorage("AutoSave");
        if(autoSave)
        {
          Status(tr("No peer available. Restoring Auto-Save."));
				  gNetState.SetState(autoSave);
          gNetState.Host();
        }
        else
          Status(tr("No Auto-Save that can be restored available."));
			}
		};
		joinNextPeer();
	}
	else
	{
		if(hash)
			gNetState.Join(hash);
		else
			gNetState.Host(); /* Host new game. */
	}

	var loading = document.getElementById("loading");
	loading.className = "finished";
	window.addEventListener('beforeunload', SessionExit);

	SetSessionStorage("PeerID", id);
}

function SessionExit()
{
	var peers = [];
	for(var peer in gNetState.Players)
		peers.push(peer); // We only want the key, this is intended

	SetSessionStorage("Peers", peers);
	SetSessionStorage("AutoSave", gNetState.State);
	// gNetState.Leave();
}

function Status(text)
{
	var chatArea = document.getElementById("chat-area");

	var div = document.createElement('div');
	div.className = "status";
	div.innerHTML = text;

	chatArea.appendChild(div);
}
