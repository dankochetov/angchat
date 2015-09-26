chatio.controller('indexCtrl', function($scope, $rootScope, $http, $route, $location, autoLogin, template){

	$rootScope.title = ' - Main';

	$scope.fb_login = function(){
		FB.login(function(response){
			if (response.status == 'connected')
			{
				$scope.showLoading = true;
				window.location = '/signin/fb';
			}
		});
	}

	$scope.vk_login = function(){
		VK.init({
			apiId: '5062854'
		});
		VK.Auth.getLoginStatus(function(response){
			if (!response.session)
				VK.Auth.login(function(response){
					if (response.session)
					{
						$scope.showLoading = true;
						window.location = '/signin/vk';
					}
				});
			else
			{
				$scope.showLoading = true;
				window.location = '/signin/vk';
			}
		});
	}
	$scope.go = function(data){
		$scope.showLoading = true;
		template.go(data);
		$scope.showLoading = false;
	}
});

chatio.controller('signinCtrl', function($scope, $http, $location, autoLogin, template){
	$scope.submit = function(){
		$scope.showLoading = true;
		$http.post('/signin', $scope.formData).then(function(response){
			if (response.data != 'success')
			{
				$scope.showLoading = false;
				$scope.errors = response.data;
			}
		});
	}
	$scope.template = template;
});

chatio.controller('signupCtrl', function($scope, $http, autoLogin, template){
	$scope.submit = function(){
		$scope.showLoading = true;
		$http.post('/signup', $scope.formData).then(function(response){
			if (response.data != 'success')
			{
				$scope.showLoading = false;
				$scope.errors = response.data;
			}
		});
	}
	$scope.template = template;
});