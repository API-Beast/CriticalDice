"use strict";

Sidebar.Archive = function(netState)
{
  this.NetState = netState;
  this.Div = document.getElementById('public-archive');
  this.PrepareArchive(this.Div);
}

Sidebar.Archive.prototype.PrepareArchive = function(div)
{
  div.classList.add("archive");

  var items = document.createElement("div");
  items.classList.add('list');
  div.ItemList = items;
  div.appendChild(items);

  var newTextFile = document.createElement("button");
  newTextFile.classList.add("item");
  newTextFile.innerHTML = "<i class='fa fa-file-text'></i> New Text-Document";
  div.appendChild(newTextFile);

  var dropArea = document.createElement("div");
  dropArea.classList.add("item");
  dropArea.classList.add("hint");
  dropArea.innerHTML = "...or drag files here to import them.";
  div.appendChild(dropArea);

  var self = this;
  dropArea.OnObjectDrop = function(evnt)
  {
    console.log(evnt);
    self.AddItem(evnt.object);
    evnt.result = "MOVE";
  };
};

Sidebar.Archive.prototype.AddItem = function(obj)
{
  var item = LibraryItem(obj.State);
  item.classList.add("item");

  this.Div.ItemList.appendChild(item);
}
