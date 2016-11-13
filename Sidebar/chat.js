"use strict";

Sidebar.Chat = function(netstate)
{
  this.NetState = netstate;
  this.Div = document.getElementById("chat-input");
  this.History = [""];
  this.HistoryPos = -1;
  this.Div.addEventListener('keydown', this.OnKeyDown.bind(this));
}

Sidebar.Chat.prototype.Send = function(message)
{
  if(message[0]==="/")
  {
    var parts = message.split(" ");
    var command = parts.shift();
    var parameters = parts.join(" ");
    if(command === "/me")
      this.NetState.Chat(parameters, "action");
    else if(command === "/roll")
    {
      // using dice.js
      var expr = dice.parse(parameters);
      var result = dice.eval(expr);
      this.NetState.Chat("<i>"+parameters+"</i> = ", "roll", +result);
      this.NetState.Chat(dice.stringify(result), "note");
    }
  }
  else
    this.NetState.Chat(message);
}

Sidebar.Chat.prototype.OnKeyDown = function(e)
{
  if(e.which == 13 || e.keyCode == 13)
  if(!e.shiftKey)
  {
    if(this.Div.value.length)
    {
      if(this.HistoryPos !== -1)
        this.History.splice(this.HistoryPos, 1);

      this.Send(this.Div.value);
      this.History.unshift(this.Div.value);
      this.Div.value = "";
      this.HistoryPos = -1;
    }
    e.preventDefault();
  }

  if(e.which == 38)
  if(this.History[this.HistoryPos+1])
  {
    if(this.HistoryPos === -1)
      this.cachedValue = this.Div.value;

    this.HistoryPos++;
    this.Div.value = this.History[this.HistoryPos];
    e.preventDefault();
  }

  if(e.which == 40)
  if(this.History[this.HistoryPos-1])
  {
    this.HistoryPos--;
    this.Div.value = this.History[this.HistoryPos];
    e.preventDefault();
  }
  else if(this.HistoryPos === 0)
  {
    this.Div.value = this.cachedValue || "";
    this.HistoryPos = -1;
    e.preventDefault();
  }

  if(e.which !== 13 && e.which !== 38 && e.which !== 40)
    this.HistoryPos = -1;
};
