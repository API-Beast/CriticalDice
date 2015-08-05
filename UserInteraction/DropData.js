"use strict";

Extend("Interface.prototype.OnDrop", function(e)
{
  e.preventDefault();
  this.Table.className = "";

  // Prefab-Drop
  // Internal, we won't get this from outside.
  var prefab = e.dataTransfer.getData("text/prs.prefab+json");
  if(prefab)
  {
    prefab = JSON.parse(prefab);
    prefab.X = e.pageX;
    prefab.Y = e.pageY;
    this.NetState.Script.Create("Object", prefab, undefined, RELIABLE);
    return;
  }

  // URL-Drop
  // "URL"-Datatype is the first valid URL in a "text/uri-list" according to MDN
  var url = e.dataTransfer.getData("URL");
  if(url)
  {
    // Only create token if the URL is for a image.
    // Scrap that... Everyone but Imgur denies our Cross-URL XHTTP-requests.
    // Just check if the URL "looks" like a image.
    if(url.match(/.(\.png|\.jpg|\.jpeg|\.gif|\.apng)/))
    {
      var token = {Type: "Cutout", X: e.pageX, Y: e.pageY, TexSize: "cover", VertAlign: "bottom", Texture: url};
      this.NetState.Script.Create("Object", token, undefined, RELIABLE);
    }
    /*else if(url.match(/.(\.mp3|\.ogg)/))
    {
      var player = {Type: "Player", X: e.pageX, Y: e.pageY, Source: url};
      this.NetState.Script.Create("Object", player);
    }*/
  }
  else // Firefox sends Images also as Files, o_O, so we have to do a either or
  {
    // File upload
    var files = e.dataTransfer.files;
    for (var i = 0; i < files.length; i++)
    {
      var file = files[i];
      if(file.type.match(/image.*/))
      {
        var self  = this;

        var reader = new FileReader();
        var token  = this.NetState.Script.Create("Object", {Type: "Cutout", X: e.pageX+(i*40), Y: e.pageY, VertAlign: "bottom", TexSize: "cover"}, undefined, RELIABLE);

        var image = new Image();
        reader.onload = function()
        {
          image.onload = function()
          {
            self.NetState.Script.Update(token, {Width: image.width, Height: image.height}, RELIABLE);
          };
          image.src = reader.result;
          token.PlaceholderSrc = reader.result;
        }
        reader.readAsDataURL(file);


        var xhttp = new XMLHttpRequest();
        var fd    = new FormData();
        fd.append('image', file);
        xhttp.open('POST', 'https://api.imgur.com/3/image');
        xhttp.setRequestHeader('Authorization', 'Client-ID c7a1ef740b6ffdd');
        xhttp.onreadystatechange = function()
        {
          if(this.readyState === 4)
          {
            if(this.status === 200)
            {
              var response = JSON.parse(this.responseText);
              self.NetState.Script.Update(token, {Texture: response.data.link}, RELIABLE);
            }
            else
              self.NetState.Script.Remove(token, self.InterfaceID);
          }
        };
        xhttp.send(fd);
      }
      else
      {
        var reader = new FileReader();
        reader.onload = function ()
        {
          var text = marked(reader.result);
          console.log(text);
          this.NetState.Script.Create("Object", {Type: "Sheet", X: e.pageX+(i*40), Y: e.pageY, Content: text}, undefined, RELIABLE);
        }.bind(this);
        reader.readAsText(file);
      }
    };
  }
});
