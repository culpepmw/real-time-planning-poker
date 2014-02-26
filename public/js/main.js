var id = undefined;
var card = null;
var participants = 0
var cardsButtonDisplayed = false;
var progressBarDisplayed = true;
var playAgainButtonDisplayed = false;

$(document).ready(function() {


	
	/**
	* Socket.IO
	* ________________________
	*/
	var socket = io.connect(window.location.href);


	/**
	* Participants
	*/

	// Everytime a new person joins or leave, update the participant's list
	socket.on('participants', function (data) {
		// Clear the participant's list
		$('#participants').html('');

		// We keep client's id to recognize him
		if(data.id !== undefined){
			id = data.id;
		}

		// Send a alert for a connection
		if(data.connect !== undefined){
			var alert = newAlert('success', data.connect+' just joined');
			$('#alerts').append(alert.alert);
			removeAlert(alert.id);
		}

		// Send a alert for a disconnection
		if(data.disconnect !== undefined){
			var alert = newAlert('danger', data.disconnect+' just left');
			$('#alerts').append(alert.alert);
			removeAlert(alert.id);
		}

		// Initialize vars
		var i;
		var count = 0;

		for (i in data.people) {
			if (data.people.hasOwnProperty(i)) {
				// Differentiate current client
				if(i == id){
					$('#participants').append('<li class="list-group-item list-group-item-success activePlayer notChangingName">'+data.people[i].name+'</li>');					
				}else{
					$('#participants').append('<li class="list-group-item">'+data.people[i].name+'</li>');
				}
				count++;
			}
		}
		participants = count;
		displayCards(data.people);
	});

	/**
	* Selected Cards
	*/

	socket.on('cardSelected', function(people){
		displayCards(people);
	});

	/**
	* Update User Story
	*/
	socket.on('newUserStory', function(userStory){
		updateUserStory(userStory);
	});

	/**
	* Reveal Cards
	*/
	socket.on('revealCards', function(){
		revealCards();
	});

	/**
	* Play Again
	*/
	socket.on('playAgain', function(people){
		playAgain(people);
	});




	/**
	* Home
	* ________________________
	*/

	/**
	* Theme
	*/

	$('#changeTheme li a').click(function(e){
		var newTheme = $(this).attr('data-theme');
		changeTheme(newTheme);
	});


	/**
	* Get Planning !
	*/

	$("#getPlanning").click(function(event){
		// Remove effect for button and footer
		$('#getPlanning').addClass('animated bounceOutDown');
		$('#footer').addClass('animated fadeOutDown');
		
		// Remove effect of lead text 500ms after
		setTimeout(function() {
			$('p.lead').addClass('animated bounceOutDown');
		}, 500);

		// Remove effect of title 1000ms after
		setTimeout(function() {
			$('h1').addClass('animated bounceOutDown');
		}, 1000);

		// Actual remove 1500ms after
		setTimeout(function() {
			$('#preGame').remove();
		}, 1500);

		// Game Arrival effect 1500ms after
		setTimeout(function() {
			$('#game').show(function(){
				$('#game').find('input').focus();
			});
			$('#game').addClass('animated flipInY');
		}, 1500);

		event.preventDefault();
	});


	/**
	* Select card
	*/

	$('.cardSelection').click(function(event){
		// Get the selected card value
		var cardValue = $(this).html();

		// Send it to the server
		socket.emit('cardSelected', cardValue);

		// Prevent default action
		event.preventDefault();
	});

	/**
	* Change username
	*/

	// Since the elements do not exist yet, we have to use 'on' instead of just 'hover'
	$('#participants').on('mouseenter', '.activePlayer', function() {
		$(this).removeClass('list-group-item-success');
		$(this).addClass('list-group-item-warning');
	}).on('mouseleave', '.activePlayer', function() {
		$(this).removeClass('list-group-item-warning');
		$(this).addClass('list-group-item-success');
	});

	$('#participants').on('click','.notChangingName',function(e){
		// We stock it's current name
		var currentName = $(this).html();

		// And add the form with it's name
		var input = '<form id="changeName">'
			+'<div class="input-group">'
				+'<input id="username" type="text" placeholder="'+currentName+'" class="form-control" autofocus>'
			+'</div>'
		+'</form>';
		$(this).html(input);

		// Then change the class in order to prevent more input to come
		$(this).removeClass('notChangingName');
		$(this).addClass('changingName');
		e.preventDefault();
	});

	// When the name is chosen send it to the server
	$('#participants').on('submit', '#changeName',function(e){
		// Get the new name
		var newName = $(this).find('input').val();

		// Send it to the server
		socket.emit('newName', newName);

		// Following is irrelevant since the list is going to be re-generated
		$(this).parent().html(newName);
		$(this).parent().removeClass('changingName');
		$(this).parent().addClass('notChangingName');
		$(this).remove();
		e.preventDefault();
	});


	/**
	* Change User Story
	*/

	// Update user story (visually and to server)
	$(document).on('submit', '#userStoryForm',function(e){
		// Get the new User Story
		var userStory = $(this).find('input').val();

		// Hide the form and show the new User Story
		//updateUserStory(userStory);
		
		// Send it to the server
		socket.emit('newUserStory', userStory);

		e.preventDefault();
	});

	// get the form back
	$('#userStory').click(function(e){
		var userStory = $(this).html();
		changeUserStory();

		e.preventDefault();
	});

	/**
	* Reveal Cards
	*/
	$(document).on('click','#revealCards',function(e){
		socket.emit('revealCards');
		e.preventDefault();
	});

	/**
	* Reveal Cards
	*/
	$(document).on('click','#playAgain',function(e){
		socket.emit('playAgain');
		e.preventDefault();
	});




});


/**
* Functions
* ________________________
*/

function generateRandomString(){
    var howmany = 15;
    var input = 'abcdefghijklmnopqrstuvwxyz0123456789';
    var output = new Array();
    var input_arr = input.split('');
    var input_arr_len = input_arr.length;
    
    for (x=0; x<howmany; x++){
        output[x] = input_arr[Math.floor(Math.random()*input_arr_len)];
    }
    
    output = output.join('');
    
    return output;
}

// Creates an alert, feed with alert type and content
function newAlert(type, msg){
	// Generate a random id for the alert
	var id = generateRandomString();

	// Generate the text and class for the associated alert
	var alert = '<div id='+id+' class="alert alert-'+type+' alert-dismissable animated fadeInDown">'
	+'<button type="button" data-dismiss="alert" aria-hidden="true" class="close">×</button>'
	+'<p>'+msg+'</p>'
	+'</div>';

	// Send the resulting object
	var data = {};
	data.id = id;
	data.alert = alert;
	return data;
}

// Removes an alert with style
function removeAlert(id){
	setTimeout(function() {
		$('#'+id).addClass('fadeOutRight');
	}, 1500);
	setTimeout(function() {
		$('#'+id).remove();
	}, 2000);
}

function hideProgressBar(){
	$('#progressBar').hide();
	$('#progressBarArea').append('<button id="revealCards" type="button" class="btn btn-primary btn-lg btn-block animated flipInY">Reveal cards </button>');
	// Then update variables to know where we're at
	cardsButtonDisplayed = true;
	progressBarDisplayed = false;
}

function showProgressBar(progress){
	$('#progressBar').show();
	updateProgressBar(progress);
	$('#revealCards').remove();
	$('#playAgain').remove();
	// Then update variables to know where we're at
	cardsButtonDisplayed = false;
	progressBarDisplayed = true;
}

function updateProgressBar(progress){
	$('#progressBar div').css('width', progress+'%');
}

function displayCards(people){
	// Clear the current cards
	$('#cardsResult').html('');

	// Initialize vars
	var count = 0;
	var i;

	for (i in people) {
		if (people.hasOwnProperty(i)) {
			// Check only people who chose cards
			if(people[i].card !== undefined){
				// Differentiate current client
				if(i == id){
					$('#cardsResult').append('<li><span>'+people[i].name+'</span>'
						+'<div data-card="'+people[i].card+'" class="bg-success cards">'
							+'<p>'+people[i].card+'</p>'
						+'</div>'
					+'</li>');					
				}else{
					$('#cardsResult').append('<li><span>'+people[i].name+'</span>'
						+'<div data-card="'+people[i].card+'" class="bg-danger cards">'
							+'<p></p>'
						+'</div>'
					+'</li>');
				}
				count++;
			}
		}
	}

	// Getting progression Status
	var progress = (100*count)/participants;

	// If the progress is at 100%, display the Reveal Cards Button
	if(progress == 100 && cardsButtonDisplayed == false){
		hideProgressBar();
	// If the progress is not at 100% but the reveal Cards button is set, delete it
	}else if(progress != 100 && cardsButtonDisplayed == true) {
		showProgressBar(progress);
	// If the progress is not at 100%, update the bar
	}else if(progress != 100) {
		updateProgressBar(progress);
	}else if(playAgainButtonDisplayed == true){
		cardValue();
	}
}

function updateUserStory(userStory){
	$('#userStory').html(userStory).show();
	$('#userStoryForm').hide();
}

function changeUserStory(){
	var oldUserStory = $('#userStory').html();
	$('#userStoryForm').find('input').attr('placeholder', oldUserStory).val(''); 
	$('#userStoryForm').show(function(){
		$('#userStoryForm').find('input').focus();
	});
	$('#userStory').hide();
}

function cardValue(){
	// We check each data-card attribute
	$('.cards').each(function(){
		// We don't change our card because it is albready displayed
		if($(this).hasClass('bg-success') == false){
			// But everyone elses
			var value = $(this).data('card');
			$(this).find('p').html(value);
			// And we also change the background
			$(this).addClass('bg-primary').removeClass('bg-danger');
		}
	});
}

function revealCards(){
	// Show the value of each card
	cardValue();

	// Change the "primary" background of button to "warning"
	$('#revealCards').removeClass('btn-primary')
	.addClass('btn-warning')
	.html('Play Again (5)') // Change text with timer
	.attr('disabled','disabled') // Disable button (to prevent launching a new game without looking at cards)

	// Disable card buttons to prevent user from changing it's value
	$('#cardsSelection button').attr('disabled', 'disabled');

	playAgainButtonDisplayed = true;

	// 5 seconds timer
	setTimeout(function(){
		$('#revealCards').html('Play Again (4)');
	}, 1000);

	setTimeout(function(){
		$('#revealCards').html('Play Again (3)');
	}, 2000);

	setTimeout(function(){
		$('#revealCards').html('Play Again (2)');
	}, 3000);

	setTimeout(function(){
		$('#revealCards').html('Play Again (1)');
	}, 4000);

	// Enable play again after 5 seconds
	setTimeout(function() {
		$('#revealCards').removeAttr('disabled')
		.removeClass('btn-warning')
		.addClass('btn-info')
		.html('Play Again !')
		.attr('id', 'playAgain'); // Change the id to "playAgain"
	}, 5000);
}

function playAgain(people){
	// Reset cards
	displayCards(people);

	// Show ProgressBar
	showProgressBar(0);

	// Enable card button again
	$('#cardsSelection button').removeAttr('disabled');

	// Prepare for new user story
	changeUserStory();
}

function changeTheme(theme){
	// Remove previously added theme
	$('#customTheme').remove();
	// Add link to theme
	$('head').append('<link id="customTheme" rel="stylesheet" href="/css/themes/'+theme+'.css" />');
	// Add the border-radius to 0 back
	$('.navbar').css('border-radius', 0);
	// Set the name of the theme in the button
	$('#themeButton').html('Theme : '+capitaliseFirstLetter(theme)+' <span class="caret"></span>');
}

function capitaliseFirstLetter(string)
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}

