chatio.controller('roomsCtrl', function($scope, $route, $rootScope, $timeout, $http, socket){

	$scope.rooms = [];
	$scope.users = [];
	$scope.loading = true;
	$scope.$on('socket:rooms', function(event, data){
		$scope.loading = false;
		$scope.rooms = data;
	});

	socket.emit('get rooms');

	$scope.$on('rendering finished', function(event, data){
		//Tooltips
		jQuery(function(){
		  jQuery('[data-toggle="tooltip"]').tooltip();
		});
	});

	$scope.getUser = function(id){
		socket.emit('get user', id);
	}

	$scope.$on('socket:user', function(event, user){
		$scope.users[user._id] = user;
	});
});