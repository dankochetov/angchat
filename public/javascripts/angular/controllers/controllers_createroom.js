chatio.controller('createroomCtrl', function($scope, $http, $location, template, autoLogout){
	$scope.submit = function(){
		$http.post('/chat/createroom', $scope.formData).then(function(response){
			console.log(response.data);
			if (response.data.status != 'success') $scope.errors = response.data.errors;
			else
			{
				$location.search('room', response.data.id);
				template.go('/');
			}
		});
	}
});