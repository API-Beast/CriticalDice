var EmbDocument = function(template, data)
{
  this.Frame = document.createElement("iframe");
  this.Frame.classList.add("doc");
  this.Template = template;

  this.Data = data;
}

EmbDocument.prototype.initialize = function()
{
  this.Doc = this.Frame.contentWindow.document;

  this.Doc.open();
  this.Doc.write(this.Template);
  this.Doc.close();

  this.translate();
}

EmbDocument.prototype.makeList = function(list, data)
{
  var prop = list.getAttribute("property");
  var template = list.querySelector('item-template');
  var items = data[prop];
  list.removeChild(template);

  for(var i = 0; i < items.length; i++)
  {
    var item = this.makeItem(template, items[i]);
    list.appendChild(item);
  }
}

EmbDocument.prototype.makeItem = function(template, data)
{
  var item = this.Doc.createElement("item");
  item.innerHTML = template.innerHTML;

  var textKeys  = item.querySelectorAll("*[key]:not(input)");
  var inputKeys = item.querySelectorAll("input[key]");
  var lists     = item.querySelectorAll("item-list");

  for(var i = 0; i < textKeys.length; i++)
  {
    var ele = textKeys[i];
    var key = ele.getAttribute("key");
    if(data[key])
      ele.innerHTML = data[key];
    ele.contentEditable = true;
  }

  for(var i = 0; i < inputKeys.length; i++)
  {
    var ele = inputKeys[i];
    var key = ele.getAttribute("key");
    if(data[key])
      ele.value = data[key];
  }

  for(var i = 0; i < lists.length; i++)
    this.makeList(lists[i], data);

  return item;
}

EmbDocument.prototype.translate = function()
{
  var textProperties  = this.Doc.querySelectorAll("*[property]:not(input):not(item-list):not(img)");
  var inputProperties = this.Doc.querySelectorAll("input[property]");
  var imgProperties   = this.Doc.querySelectorAll("img[property]");
  var lists           = this.Doc.querySelectorAll("item-list");

  for(var i = 0; i < textProperties.length; i++)
  {
    var ele = textProperties[i];
    var prop = ele.getAttribute("property");
    if(this.Data[prop])
      ele.innerHTML = this.Data[prop];
    ele.contentEditable = true;
  }

  for(var i = 0; i < inputProperties.length; i++)
  {
    var ele = inputProperties[i];
    var prop = ele.getAttribute("property");
    if(this.Data[prop])
      ele.value = this.Data[prop];
  }

  for(var i = 0; i < imgProperties.length; i++)
  {
    var ele  = imgProperties[i];
    var prop = ele.getAttribute("property");
    if(this.Data[prop])
      ele.src = this.Data[prop];
    else
    {
      ele.src = "placeholder.png";
      ele.classList.add("placeholder");
    }
  }

  for(var i = 0; i < lists.length; i++)
    this.makeList(lists[i], this.Data);
}
