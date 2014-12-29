var StrawberryApp = angular.module('StrawberryApp', [
	"ngRoute",
	"ui.bootstrap"
	]);
StrawberryApp.config(function($routeProvider) {})
StrawberryApp.constant('BOOKFILE', "/data/book.json")	// BOOK file
.constant('HIDDEN_MARK', "_")
.value('BOOK', []);	// it is changed only one time right after loading BOOK file
StrawberryApp.factory('Status', function() {
	var nextActionStatus = "";

	return {
		changeStatus: function(status) {
			var formArr = [];

			switch(status) {
				case "default":
					formArr = [ "default", "" ];
					nextActionStatus = "";
				break;
				case "success":
					formArr = [ "success", "ok" ];
					nextActionStatus = "next";
				break;
				case "failure":
					formArr = [ "error", "remove" ];
					nextActionStatus = "clear";
				break;
			}

			return {
					statusInput: formArr[0],
					statusIcon: formArr[1]
			};
		},
		getActionStatus: function() { return nextActionStatus; }
	};
})
.factory('loadFile', function() {
	return function(filename, callback) {
		// TODO: change to $http
		// TODO: make two style queue (new and old) not to get duplicated quiz for random
		var result = $.getJSON(filename, function(data) {
			callback(data);
			//console.log(data.responseText);
		});
	};
})
.factory('getNewWord', function(HIDDEN_MARK, BOOK) {
	var hideChar = function(str) {
		return str.replace(/\w/g, HIDDEN_MARK);
	};

	return function() {
		// TODO : don't choose duplicate sentence.
		var index = parseInt(Math.random() * 10) % BOOK.length;
		var word = BOOK[index];
		var rpartition_answer = /\-\w+\-/;
		var rpartition_head = /[\w\s']+(?=\s\-)/;
		var rpartition_tail = /[a-zA-Z?.!]+$/;
		if(!word.partition) {
			word.partition = {};
			word.partition.answer = word.sentence.match(rpartition_answer).pop().replace(/\-/g,"");
			word.partition.head = (word.sentence.match(rpartition_head) || []).pop() || "";
			word.partition.tail = ((word.sentence.match(rpartition_tail) || []).pop() || ""); //.replace("- ","");
		}

		return {
					answer: word.partition.answer,
					head: word.partition.head,
					tail: word.partition.tail,
					hiddenChar: hideChar(word.partition.answer),
					translate: word.translate
				};
	};
});
StrawberryApp.controller('MainCtrl', function($scope
	, loadFile, BOOK, BOOKFILE, HIDDEN_MARK
	, Status, getNewWord) {
	//var words = {}; //BOOK;
	var hiddenMark = "_";
	$scope.word = {};
	
	$scope.nextWord = function() {
		$scope.word = getNewWord();
		$scope.form = Status.changeStatus("default");
	}

	$scope.init = function() {
		//$scope.word.partition = {};
		// TODO : use localStorage
		//var self = this;
		loadFile(BOOKFILE, function(data) {
			angular.extend(BOOK, data.words);
			$scope.$apply(function() {
				$scope.nextWord();
			});
		});
	};

	$scope.inputChange = function() {
		var word = $scope.word;
		var inputWord = word.inputWord.toLowerCase();
		var ralpha = /\w/g;
		var rhiddenMark = new RegExp("\\" + HIDDEN_MARK + "{" + inputWord.length + "}"); 
		var hiddenChar = $scope.word.hiddenChar;
		$scope.word.hiddenChar = hiddenChar.replace(ralpha, HIDDEN_MARK).
											replace(rhiddenMark, inputWord);

		var result = ""
		if(word.answer == inputWord) {
			result = "success";
		} 
		else if(word.answer.length === inputWord.length) {
			result = "failure";
		}
		else {
			result = "default";
		}

		$scope.form = Status.changeStatus(result);
	};

	$scope.nextAction = function() {
		switch(Status.getActionStatus()) {
			case "next":
			$scope.nextWord();
			break;
			case "clear":
			$scope.word.inputWord = "";
			$scope.inputChange();	// TODO: remove changeStatus called twice
			break;
		}

		$scope.form = Status.changeStatus("default");
	};
});