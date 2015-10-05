chatio.controller('indexDefaultCtrl', function($scope, $rootScope, autoSync){

	$rootScope.title = ' - Main';

	$scope.fb_login = function(){
		FB.login(function(response){
			if (response.status == 'connected') window.location = '/signin/fb';
		});
	}

	$scope.vk_login = function(){
		VK.init({
			apiId: '5062854'
		});
		VK.Auth.login(function(response){
			if (response.session) window.location = '/signin/vk';
		});
	}
});