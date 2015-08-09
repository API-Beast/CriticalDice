"use strict";

Sidebar.Properties = function(netState)
{
  this.NetState = netState;
  this.PropertyPanes = [];

  this.Div = document.getElementById('sidebar-properties');
  this.Div.innerHTML = "<i>Select a object to see it's properties here.</i>";
}

Sidebar.Properties.prototype.OnSelectionChanged = function(newSelection)
{
  this.Div.innerHTML = "";
  this.PropertyPanes = [];
  for(var i = 0; i < newSelection.length; i++)
  {
    var object = newSelection[i];
    if(!object.Properties)
      continue;

    var list = CreateElement('div', ['property-list']);
    list.ObjectProperties = {};
    list.ObjectHandle     = object;

    var label = CreateElement('span', ['label'], ['contentEditable']);
    label.innerHTML = GetLabel(object.State);

    var title = CreateElement('div', ['item', 'title'], null, [label]);
    title.addEventListener('click',
      function(list, e)
      {
        list.classList.toggle("open");
        e.stopPropagation();
      }.bind(this, list));
    list.appendChild(title);


    for(var j = 0; j < object.Properties.length; j++)
    {
      var name        = object.Properties[j][0];
      var title       = object.Properties[j][1];
      var placeholder = object.Properties[j][2];
      var type        = object.Properties[j][3];

      var caption = CreateElement('span');
      caption.appendChild(document.createTextNode(title || name));

      var val = object.State[name];
      var input = CreateElement('input');
      input.addEventListener("input", this.ValueChanged.bind(this, object, name));
      input.placeholder =        placeholder || "";
      input.value       = object.State[name] || "";
      if(typeof(val) === "number")  input.type = "number";
      if(typeof(val) === "boolean") input.type = "checkbox";
      if(type)                      input.type = type;
      list.ObjectProperties[name] = input;

      list.appendChild(CreateElement('label', 'item', null, [caption, input]));
    }
    this.Div.appendChild(list);
    this.PropertyPanes.push(list);
  }
  if(this.PropertyPanes.length === 0)
    this.Div.innerHTML = "<i>Select a object to see it's properties here.</i>";
}

Sidebar.Properties.prototype.OnObjectChange = function(iface, handle, oldState, delta)
{
  for (var i = 0; i < this.PropertyPanes.length; i++)
  {
    if(this.PropertyPanes[i].ObjectHandle !== handle)
      continue;

    var list = this.PropertyPanes[i].ObjectProperties;

    for(var prop in list)
    if(list.hasOwnProperty(prop))
    {
      if(list[prop].value != handle.State[prop] || "")
        list[prop].value = handle.State[prop] || "";
    }

  }
}

Sidebar.Properties.prototype.ValueChanged = function(target, targetProperty, event)
{
  var value = event.target.value;
  var delta = {};
  delta[targetProperty] = value;
  this.NetState.Script.Update(target, delta, RELIABLE);
}
