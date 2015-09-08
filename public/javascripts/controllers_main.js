chatio.controller('mainCtrl', function($scope, $rootScope, $routeParams, autoSync){

	var socket;

	if (!$rootScope.sockets || !$rootScope.sockets['rooms'])
	{
		var socket = io.connect({forceNew: true});
		socket.emit('comment', 'socked opened for Rooms');
		socket.room = {_id: '/', name: 'Rooms'};

		$rootScope.room = socket.room;
		if (!$rootScope.sockets) $rootScope.sockets = {};
		$rootScope.sockets['rooms'] = socket;
	}
	else socket = $rootScope.sockets['rooms'];

	$scope.$on('usernames', function(event, data){
		$scope.$apply(function(){
			$scope.usernames = data;
		});
	});

});