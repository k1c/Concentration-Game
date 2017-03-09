var user;
var cardDictionary = {};    //{card:[selectedCar,number]}
var cardFlip = 0;
var totalCards;
var numGuesses = 0;


$(document).ready(function(){

  do{
    user = window.prompt("What is your name?","Username");   //window.prompt("What is your name?","default");

    if(user.length === 0){
      window.alert("Username cannot be left empty. Click OK to re-enter.");
    }

  }while(user.length === 0);

  //below is what is sent first from the client

  $.ajax({
    method:"GET",
    url:"/memory/intro",
    data:{'username':user},
    success:displayGame,   //if succeeds, it runs displayGame
    dataType:'json'   //automatically parse the server response as a JSON object
  });

});

//Function: displayGame
//Purpose: display a grid of facedown cards, each card contains a click-listener function
//Parameters: data
//Returns: none

function displayGame(data){      //data is the server response

  $('#gameboard').empty();

  totalCards = data.difficulty*data.difficulty;

  var row, div;

  for (var i=0; i<data.difficulty;i++){

    row = $("<tr></tr>");

    for(var j=0; j<data.difficulty; j++){
      cell = $("<td></td>");
      div = $("<div class='card' data-row='"+i+"'data-column='"+j+"' ></div>");
      div.append("<span></span>");
      div.on("click",chooseCard);  //clickHandler (click handler on chooseCard )
      cell.append(div);
      row.append(cell);
    }
    $('#gameboard').append(row);          //appends row to table
  }
}

//Function: chooseCard
//Purpose: serves as the click handler for any clicked card and oversees the matching and victory behaviours of the game.
//Parameters: none
//Returns: none

function chooseCard(){   //this will get called every time card is clicked

  var selectedCard = $(this);     //use $(this) to determine which card was selected

  if (cardFlip<2){   //this condition ensures that a GET request isn't sent if a third card is requested
    $.ajax({
      method:"GET",
      url:"/memory/card",
      data:{'username':user,'row':selectedCard.data('row'),'column':selectedCard.data('column'),'gameOver':false},
      success:initDictionary,   //if succeeds, it runs initDictionary
      dataType:'text'
    });
  }

  //Function: initDictionary
  //Purpose: initialize a dictionary in the format of {card:[selectedCard,number]}
  //Parameters: number
  //Returns: none

  function initDictionary(number){

    if (cardFlip === 0){  //no card has been flipped

      cardDictionary.card1 = [selectedCard,number];     //initialize card 1
      cardDictionary.card1[0].off("click",chooseCard);  //remove click handler
      showCard(number);
      cardFlip++;

    } else if (cardFlip === 1){  //1 card has been flipped

      cardDictionary.card2 = [selectedCard,number];     //initialize card 2
      cardDictionary.card2[0].off("click",chooseCard);  //remove click handler
      showCard(number);
      cardFlip++;
      numGuesses++;

      if(checkMatch()){       //check if card1 and card2 match

        totalCards-=2;       //if they match, remove the cards from card count

        if(isGameOver()){    //check if game is over
          window.setTimeout(displayStats,1000);
        }

        window.setTimeout(function(){cardFlip=0;}, 1000);      //added the timer so that I don't reset my cardFlip too quickly thereby allowing a user to click a 3rd card

      }else{   //card1 and card2 don't match

        cardDictionary.card1[0].on("click",chooseCard);   //re-add the click listener for card1
        cardDictionary.card2[0].on("click",chooseCard);   //re-add the click listener for card2
        window.setTimeout(hideCards,1000);    //hide the cards
      }
    }
  }

  //Function: showCard
  //Purpose: flips a card and displays the number
  //Parameters: number
  //Returns: none

  function showCard(number){

    selectedCard.slideUp();

    var flip = window.setTimeout(function(){
      selectedCard.attr("class","card flippedCard");
      selectedCard.find('span').text(number);
      selectedCard.slideDown();},300);
    }

  //Function: hideCards
  //Purpose: hide two cards by re-setting their css to their less specific class
  //Parameters: none
  //Returns: none

  function hideCards(){

    cardDictionary.card1[0].slideUp();
    cardDictionary.card2[0].slideUp();

    var hide = window.setTimeout(function(){
      cardDictionary.card1[0].attr("class","card");
      cardDictionary.card2[0].attr("class","card");
      cardDictionary.card1[0].find('span').text("");
      cardDictionary.card2[0].find('span').text("");
      cardDictionary.card1[0].slideDown()
      cardDictionary.card2[0].slideDown();

      cardFlip = 0;},600);   //re-setting the cardFlip

  }

  //Function: checkMatch
  //Purpose: check to see if two card numbers match
  //Parameters: none
  //Returns: true if match, false otherwise

  function checkMatch(){

    if(cardDictionary.card1[1] === cardDictionary.card2[1]){
      return true;
    }else{
      return false;
    }
  }

  //Function: isGameOver
  //Purpose: checks to see if the game is over by looking at the totalCards count
  //Parameters: none
  //Returns: true if game over, false otherwise

  function isGameOver(){

    if(totalCards <= 0){
      return true;
    }
      return false;
    }

  //Function: displayStats
  //Purpose: display the number of guesses once the game is over
  //Parameters: none
  //Returns: none

  function displayStats(){

    window.alert("You've won with "+numGuesses+" guesses!\n\nClick OK to increase difficulty.");
    resetGame();
  }

  //Function: resetGame
  //Purpose: reset the game (with the same user) once the game is over
  //Parameters: none
  //Returns: none

  function resetGame(){

    $.ajax({
      method:"GET",
      url:"/memory/card",
      data:{'username':user,'gameOver':true},
      success:displayGame,   //if succeeds, it runs displayGame
      dataType:'json'
    });
  }
}
