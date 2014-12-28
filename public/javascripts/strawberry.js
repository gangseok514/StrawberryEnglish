var StrawberryApp = angular.module('StrawberryApp', [
	"ngRoute",
	"ui.bootstrap"
	]);
StrawberryApp.config(function($routeProvider) {})
StrawberryApp.controller('MainCtrl', function($scope) {

	var g = StrawberryApp;
	var bookname = "/data/book.json";

	g.words = [];

	var hiddenMark = "_";

	var hideChar = function(str) {
		return str.replace(/\w/g, hiddenMark);
	};

	var setData = function() {
		var words = g.words;
		// TODO : don't choose duplicate sentence.
		var index = parseInt(Math.random() * 10) % words.length;
		var word = words[index];
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

	var changeStatus = function(status) {
		var myForm = {};
		var formArr = [];

		switch(status) {
			case "default":
				formArr = [ "default", "" ];
			break;
			case "success":
				formArr = [ "success", "ok" ];
			break;
			case "failure":
				formArr = [ "error", "remove" ];
			break;
		}

		$scope.form = {
			statusInput: formArr[0],
			statusIcon: formArr[1]
		};
	}

	$scope.nextWord = function() {
		$scope.word = setData();
		changeStatus("default");
	}

	$scope.word = { head:"", tail:"", answer:"", hiddenChar:"" };
	//$scope.labelStatus = "label-default";
	$scope.correctResult = "default";
	changeStatus("default");

	$scope.init = function() {
		//$scope.word.partition = {};
		// TODO : use localStorage
		//var self = this;
		g.loadFile(bookname, function(data) {
			g.words = data.words;
			$scope.$apply(function() {
				$scope.word = setData();
			});
		});
	};

	$scope.inputChange = function() {
		var word = $scope.word;
		var inputWord = word.inputWord.toLowerCase();
		var ralpha = /\w/g;
		var rhiddenMark = new RegExp("\\" + hiddenMark + "{" + inputWord.length + "}"); 
		var hiddenChar = $scope.word.hiddenChar;
		$scope.word.hiddenChar = hiddenChar.replace(ralpha, hiddenMark).
											replace(rhiddenMark, inputWord);

		if(word.answer == inputWord) {
			changeStatus("success");
		} 
		else if(word.answer.length === inputWord.length) {
			changeStatus("failure");
		}
		else {
			changeStatus("default");
		}
	};

});

StrawberryApp.loadFile = function(filename, callback) {
	// TODO: change to $http
	// TODO: make two style queue (new and old) not to get duplicated quiz for random
	var result = $.getJSON(filename, function(data) {
		callback(data);
		//console.log(data.responseText);
	});
};