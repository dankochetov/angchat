chatio.controller('roomsCtrl', function($scope, $route, $rootScope, $timeout, $http){

	var socket = $scope.socket = $rootScope.roomsSocket;
	socket.off('user');
	socket.off('rooms');

	$scope.rooms = [];
	$scope.users = [];
	$scope.loading = true;
	socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.$apply(function(){
			$scope.rooms = data;
		});
	});
	socket.emit('get rooms');

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