chatio.controller('privateCtrl', function($scope, $routeParams, $timeout, $q, $rootScope, autoLogout, socket){
	
	var companion;
	$scope.tabInit = $q.defer();

	$scope.messages = [];
	$scope.scrollGlue = true;

	$scope.tabInit.promise.then(function(tab){
		$rootScope.tab = tab;
		socket.emit('get user', tab.id);

		var close = $scope.$on('socket:user', function(event, companion){
			init(companion);
			close();
		});

		function addServerMessage(text, type)
		{
			$scope.$apply(function(){
				$scope.messages.push({
					username: 'server',
					text: text,
					type: type,
					time: Date.now()
				});
			});
		}

		function init(companion)
		{
			if (typeof companion == 'string') companion = JSON.parse(companion);
			socket.emit('new user', JSON.stringify({user: $rootScope.user, room: companion}));

			$rootScope.title = ' - ' + companion.username;
			
			socket.emit('get private history', JSON.stringify({id1: $rootScope.user._id, id2: companion._id}));

			$scope.$on('socket:reconnect', function(){
				location.reload();
			});

			$scope.$on('socket:disconnect', function(){
				addServerMessage('Connection lost', 'error');
			});

			$scope.$on('socket:private history', function(event, data){
				$scope.messages = data;
				$scope.scrollGlue = true;
			});

			$scope.$on('socket:new private message', function(event, data){
				if (data.to != $rootScope.user._id && data.to != tab.id && data.from != tab.id && data.from != $rootScope.user._id) return;
				$scope.messages.push(data);
				$scope.scrollGlue = true;
			});
		}

	});
});