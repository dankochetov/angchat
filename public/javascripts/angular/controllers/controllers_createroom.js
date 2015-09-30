chatio.controller('createroomCtrl', function($scope, $http, $location, template, autoLogout, tabs){
	$scope.submit = function(){
		$http.post('/chat/createroom', $scope.formData).then(function(response){
			var data = $scope.formData;
			if (response.data.status != 'success') $scope.errors = response.data.errors;
			else
			{
				var newTab = {
						title: data.name,
						id: response.data.id,
						url: '/chat/room/' + response.data.id,
						active: true,
						private: false
					}
				tabs.open(newTab);
				template.go('/');
			}
		});
	}
});