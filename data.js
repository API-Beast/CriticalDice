"use strict";

var Definitions = {Back: {}, Card: {}, Deck: {}};

function LoadSet(data, prefix)
{
	if(data.Back)
	for(var i = 0; i < data.Back.length; i++)
	{
		var back = data.Back[i];
		back.Img = prefix + "/" + back.Img;
		Definitions.Back[back.Name] = new CardBack(back);
	};

	if(data.Card)
	for(var i = 0; i < data.Card.length; i++)
	{
		var card = data.Card[i];
		card.Img  = prefix + "/" + card.Img;
		Definitions.Card[card.Name] = new CardDefinition(card);
	}

	if(data.Deck)
	for(var i = 0; i < data.Deck.length; i++)
	{
		var deck = data.Deck[i];
		var cardList = [];
		for (var j = 0; j < deck.CardList.length; j+=2)
		{
			var count = deck.CardList[j];
			var card  = Definitions.Card[deck.CardList[j+1]];
			while(count--)
				cardList.push(card);
		}
		Definitions.Deck[deck.Name] = cardList;
	}
}

function RequestData()
{
	// This is a bit funky due to the way Javascript handles functions, read the last line of this function first.
	var onFileListLoaded = function(response)
	{
		var parseDefinition = function(response, numFilesLeft, file)
		{
			var temp = Object.create(null);
			XINI.parse(response, temp);

			LoadSet(temp, "CardSets/"+file.beforeLastIndex('/'));

			//Definitions = Merge(Definitions, temp);

			if(!numFilesLeft && OnDataLoaded)
				OnDataLoaded();
		};

		var setList = XINI.parse(response).SetList;
		var fileList = setList.map(function(set){ return set+"/Set.xini"; });
		LoadTextFiles("CardSets/", fileList, parseDefinition);
	};

	LoadTextFiles("CardSets/", ["CardSets.xini"], onFileListLoaded);
}
