"use strict";

Sidebar.Properties = function(netState)
{
  this.Div = document.getElementById('sidebar-properties');
  this.NetState = netState;
  this.PropertyPanes = [];
}

Sidebar.Properties.prototype.OnSelectionChanged = function(newSelection)
{
  this.Div.innerHTML = "";
  for(var i = 0; i < newSelection.length; i++)
  {
    var object = newSelection[i];
    if(!object.Properties)
      continue;

    var list = document.createElement('div');
    list.classList.add("property-list");
    list.ObjectProperties = {};
    list.ObjectHandle     = object;

    for(var j = 0; j < object.Properties.length; j++)
    {
      var name        = object.Properties[j][0];
      var title       = object.Properties[j][1];
      var placeholder = object.Properties[j][2];
      var type        = object.Properties[j][3];
      var item = document.createElement('label');
      item.classList.add('item');

      var caption = document.createElement('span');
      caption.appendChild(document.createTextNode(title || name));

      var val = object.State[name];
      var input = document.createElement('input');
      input.placeholder =        placeholder || "";
      input.value       = object.State[name] || "";
      if(typeof(val) === "number")  input.type = "number";
      if(typeof(val) === "boolean") input.type = "checkbox";
      if(type)                      input.type = type;

      input.addEventListener("input", this.ValueChanged.bind(this, object, name));

      var noPropagate = function(e){  e.stopPropagation(); }
      input.addEventListener('mousedown', noPropagate);
      input.addEventListener('keydown',   noPropagate);

      list.ObjectProperties[name] = input;

      item.appendChild(caption);
      item.appendChild(input);

      list.appendChild(item);
    }
    this.Div.appendChild(list);
    this.PropertyPanes.push(list);
  }

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
