var StrawberryApp = angular.module('StrawberryApp', [
	"ngRoute",
	"ui.bootstrap"
	]);
StrawberryApp.config(function($routeProvider) {})
StrawberryApp.constant('BOOKFILE', "/data/book.json")	// BOOK file, TODO: make filelist file and use appCache
.constant('HIDDEN_MARK', "_")	// mark instead of hidden word
.value('BOOK', []);	// it is changed only one time right after loading BOOK file
StrawberryApp.factory('sortBy', function() {
	var by = function(name) {
		var sort_key = 1;

		if(name[0] === '-') {
			sort_key = -1;
			name = name.substr(1);
		}

		return function(a, b) {
			var result = a[name] > b[name] ? 1 : a[name] < b[name] ? -1 : 0;
			return result * sort_key;
		};
	};

	return function() {
		var props = arguments,
			count = props.length;

		return function(obj1, obj2) {
			var result = i = 0;
			while(result === 0 && i < count) {
				result = by(props[i++])(obj1, obj2);
			};

			return result;
		};
	};
})
.factory('PDATA', function(sortBy, BOOK) {	// TODO: when it grow large data, we need to move data to database
	var pData = [],
		pDataByFailure = [];

	// TODO : personal data spec in local storage
	// use worker for sorting
	// 

	var _updatePData = function(index, failure) {
		pData[index].count += failure === '+' ? 1 : -1;
		pData[index].count = pData[index].count > 0 ? pData[index].count : 0;
		angular.extend(pDataByFailure, pData);
		pDataByFailure.sort(sortBy('-count', 'index'));
	};

	var _getPData = function() {
		// Logic
		// TODO: It should be seperated from this function?
		var index = parseInt(Math.random() * 10) % BOOK.length;	// TEMP
		var result = pData[index];

		if(!pData[index]) {
			pData[index] = {index:index, count: 0};
		}

		return pData[index];
	};

	return {
		updatePData : _updatePData,
		getPData : _getPData
	};
})
.factory('Status', function() {
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
		// action status : next, clear
		getActionStatus: function() { return nextActionStatus; }
	};
})
.factory('loadFile', function($http) {
	return function(filename, callback) {
		$http.get(filename)
			.success(function(data, status, header, config) {
			callback(data);
		});
	};
})
.factory('getNewWord', function(HIDDEN_MARK, BOOK, PDATA) {
	var hideChar = function(str) {
		return str.replace(/\w/g, HIDDEN_MARK);
	};

	return function() {
		// TODO : don't choose duplicate sentence.
		var index = PDATA.getPData().index; //parseInt(Math.random() * 10) % BOOK.length;
		var word = BOOK[index];
		var rpartition_answer = /\-\w+\-/;		// Is it -on- sale?  -> on
		var rpartition_head = /[\w\s']+(?=\s\-)/;	// Is it
		var rpartition_tail = /[a-zA-Z?.!]+$/;		// sale?
		if(!word.partition) {
			word.partition = {};
			word.partition.answer = word.sentence.match(rpartition_answer).pop().replace(/\-/g,"");
			word.partition.head = (word.sentence.match(rpartition_head) || []).pop() || "";	// prevent null reference
			word.partition.tail = ((word.sentence.match(rpartition_tail) || []).pop() || "");			
		}

		return {
					answer: word.partition.answer,
					head: word.partition.head,
					tail: word.partition.tail,
					hiddenChar: hideChar(word.partition.answer),
					translate: word.translate,
					index: index
				};
	};
});
StrawberryApp.controller('MainCtrl', function($scope,
	loadFile, BOOK, BOOKFILE, HIDDEN_MARK, PDATA,
	Status, getNewWord) {
	$scope.word = {};
	
	$scope.nextWord = function() {
		$scope.word = getNewWord();
		$scope.form = Status.changeStatus("default");
	}

	$scope.init = function() {
		loadFile(BOOKFILE, function(data) {
			angular.extend(BOOK, data.words);	// make localstorage
			$scope.nextWord();
		});
	};

	$scope.inputChange = function() {
		var word = $scope.word;
		var inputWord = word.inputWord.toLowerCase();
		var ralpha = /\w/g;
		var rhiddenMark = new RegExp("\\" + HIDDEN_MARK + "{" + inputWord.length + "}"); 
		var hiddenChar = $scope.word.hiddenChar;
		$scope.word.hiddenChar = hiddenChar.replace(ralpha, HIDDEN_MARK)
										   .replace(rhiddenMark, inputWord);

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
		var status = Status.getActionStatus();
		switch(status) {
			case "next":
			$scope.nextWord();
			break;
			case "clear":
			$scope.word.inputWord = "";
			$scope.inputChange();	// TODO: remove changeStatus called twice
			break;
		}

		PDATA.updatePData($scope.word.index, status === "next" ? '-' : '+');
		$scope.form = Status.changeStatus("default");
	};
});