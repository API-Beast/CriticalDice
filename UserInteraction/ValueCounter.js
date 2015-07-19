"use strict";

// Depends on ActionBar
// Adds a number to it that sums the value of all selected objects. (Mainly for dice counting)

Extend("Interface.prototype.Init", function()
{
  this.ValueCounter = document.createElement("span");
  this.ValueCounter.classList.add("item");
  this.ValueCounter.classList.add("value-counter");
  this.ValueCounter.innerHTML = "0";
});

Extend("Interface.prototype.UpdateSelection", function()
{
  var value = 0;
  var values = [];
  var sum = 0;
  var string = "";
  var decoration = "";
  for(var i = 0; i < this.Selection.length; i++)
  if(this.Selection[i].GetValue)
  {
    value = this.Selection[i].GetValue() || 0;
    decoration = this.Selection[i].GetValueDecoration();
    sum += value;
    if(decoration)
     value = "<b class='"+decoration+"'>"+value.toString()+"</b>";
    values.push(value);
  }

  this.ValueCounter.innerHTML = values.join('<i>,</i> ')+" <i>=</i> "+sum.toString();

  if(values.length > 0)
    this.ActionBar.appendChild(this.ValueCounter);
  else if(this.ValueCounter.parentNode === this.ActionBar)
    this.ActionBar.removeChild(this.ValueCounter);
});
