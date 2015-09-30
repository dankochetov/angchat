chatio.controller('privateCtrl', function($scope, $routeParams, $timeout, $q, $rootScope, autoLogout, socket){
	
	var companion;
	$scope.tabInit = $q.defer();

	$scope.messages = [];
	$scope.scrollGlue = true;

	$scope.tabInit.promise.then(function(tab){
		socket.emit('get user', tab.id);

		var close = $scope.$on('socket:user', function(event, companion){
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

			if ($rootScope['listeners.private.history.' + tab.id]) $rootScope['listeners.private.history.' + tab.id]();
			$rootScope['listeners.private.history.' + tab.id] = $scope.$on('socket:private history', function(event, data){
				if (data.from != $rootScope.user._id || data.to != tab.id) return;
				$scope.messages = data.data;
				$scope.scrollGlue = true;
			});
			if ($rootScope['listeners.private.message.' + tab.id]) $rootScope['listeners.private.message.' + tab.id]();
			$rootScope['listeners.private.message.' + tab.id] = $scope.$on('socket:new private message', function(event, data){
				if ((data.to == $rootScope.user._id && data.from != tab.id) || (data.from == $rootScope.user._id && data.to != tab.id)) return;
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			});
		}

	});
});