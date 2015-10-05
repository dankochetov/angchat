chatio.controller('privateCtrl', function($scope, $routeParams, $timeout, $q, $rootScope, autoLogout, socket){
	
	var companion;
	$scope.tabInit = $q.defer();

	var listeners = [];

	$scope.$on('$destroy', function(event, data){
		for (var i in listeners) listeners[i]();
	});

	$scope.messages = [];
	$scope.scrollGlue = true;

	$scope.tabInit.promise.then(function(tab){
		socket.emit('get user', tab.id);

		var close = socket.on('user', function(companion){
			if (companion._id != tab.id) return;
			init(companion);
			close();
		});

		function init(companion)
		{
			if (typeof companion == 'string') companion = JSON.parse(companion);
			socket.emit('new user', JSON.stringify({user: $rootScope.user, room: companion}));

			$rootScope.title = ' - ' + companion.username;
			
			socket.emit('get private history', JSON.stringify({id1: $rootScope.user._id, id2: companion._id}));

			listeners.push(socket.on('private history', function(data){
				if (data.from != $rootScope.user._id || data.to != tab.id) return;
				$scope.messages = data.data;
				$scope.scrollGlue = true;
			}));
			listeners.push(socket.on('new private message', function(data){
				if ((data.to == $rootScope.user._id && data.from != tab.id) || (data.from == $rootScope.user._id && data.to != tab.id)) return;
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			}));
		}

	});
});