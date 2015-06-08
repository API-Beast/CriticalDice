"use strict";

var gLibrary = {};

function RequestLibrary(callback)
{
	// This is a bit funky due to the way Javascript handles functions, read the last line of this function first.
	var onFileListLoaded = function(response)
	{
		var parseDefinition = function(response, numFilesLeft, file)
		{
			var temp = Object.create(null);

			XINI.parse(response, temp);
			gLibrary = Merge(gLibrary, temp);

			if(!numFilesLeft && callback)
				callback();
		};

		var fileList = XINI.parse(response).Files;
		LoadTextFiles("Library/", fileList, parseDefinition);
	};

	LoadTextFiles("Library/", ["Index.xini"], onFileListLoaded);
}
