chatio.controller('roomsCtrl', function($scope, $route, $rootScope, $timeout, $http, socket){

	var listeners = [];

	$scope.$on('$destroy', function(){
		for (var i in listeners) listeners[i]();
	});

	$scope.rooms = [];
	$scope.users = [];
	$scope.loading = true;
	listeners.push(socket.on('rooms', function(data){
		$scope.loading = false;
		$scope.rooms = data;
	}));

	socket.emit('get rooms');

	$scope.$on('rendering finished', function(event, data){
		//Tooltips
		jQuery(function(){
		  jQuery('[data-toggle="tooltip"]').tooltip();
		});
	});

	$scope.getUser = function(id){
		socket.emit('get user', id);
		var close = socket.on('user', function(user){
			if (user._id != id) return;
			$scope.users[user._id] = user;
			close();
		});
	}

	

	
});