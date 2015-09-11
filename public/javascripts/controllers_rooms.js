chatio.controller('roomsCtrl', function($scope, $rootScope, $timeout, $http){

	var socket = $scope.socket = $rootScope.sockets['rooms'];

	$scope.rooms = [];
	$scope.users = [];
	$scope.loading = true;

	socket.emit('get rooms');

	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
		});
	});

	$scope.$on('rendering finished', function(event, data){
		$timeout(function(){
			//Tooltips
			jQuery(function(){
			  jQuery('[data-toggle="tooltip"]').tooltip();
			});
		}, 0);
	});

	$scope.getUser = function(id){
		socket.emit('get user', id);
	}

	socket.on('user', function(user){
		$timeout(function(){
			$scope.users[user._id] = user;
		}, 0);
	});
});