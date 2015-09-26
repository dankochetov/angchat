chatio.factory('template', function($rootScope){

	var prev = [];

	return {
		go: function(route){
			prev.push($rootScope.templateUrl);
			$rootScope.templateUrl = route;
		},
		url: function(){
			return $rootScope.templateUrl;
		},
		back: function(){
			if (prev.length > 0)
				$rootScope.templateUrl = prev.splice(-1, 1)[0];
		}
	}
});