chatio.controller('signupCtrl', function(backBtnService){
	backBtnService(true);
});

chatio.controller('signinCtrl', function(backBtnService){
	backBtnService(true);
});

chatio.controller('backBtnCtrl', function($scope, backBtnService){
	$scope.showBackBtn = function(){
		return backBtnService();
	}
});

chatio.controller('indexCtrl', function(backBtnService){
	backBtnService(false);
});