chatio.controller('initCtrl', function($scope, $location, auth){
	$scope.init = function(user){
		auth(user);
	}
});