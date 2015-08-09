function CreateElement(name, classes, functions, children)
{
  var ele = document.createElement(name);

  if(typeof(classes) === "string")
    ele.classList.add(classes);
  else if(classes)
  for(var i = 0; i < classes.length; i++)
    ele.classList.add(classes[i]);

  if(functions)
  for(var i = 0; i < functions.length; i++)
  {
    var f = functions[i];
    if(f === "contentEditable")
      ele.contentEditable = "true";
  }

  if(children)
  for(var i = 0; i < children.length; i++)
    ele.appendChild(children[i]);

  var noPropagate = function(e){  e.stopPropagation(); }
  if(ele.contentEditable === 'true' || name === 'input')
  {
    ele.addEventListener('mousedown', noPropagate);
    ele.addEventListener('keydown',   noPropagate);
  }

  return ele;
}
