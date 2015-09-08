chatio.controller('indexDefaultCtrl', function($scope, autoSync){
	$scope.fb_login = function(){
		FB.login(function(response){
			if (response.status == 'connected') window.location = '/signin/fb';
		});
	}

	$scope.vk_login = function(){
		VK.init(function(){
			window.location = '/signin/vk';
		}, function(){}, '5.37');
	}
});