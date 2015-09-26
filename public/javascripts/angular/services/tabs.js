chatio.factory('tabs', function($rootScope, $timeout){

	return {
		init: function(){
			$rootScope.tabs = [];
			$rootScope.rootTab = {
				title: 'New tab',
				url: '/chat/rooms',
				active: true
			};
		},
		open: function(data){
			$rootScope.tabs.push(data);
		},
		close: function(id){
			for (num in $rootScope.tabs)
				if ($rootScope.tabs[num].id == id)
				{
					$rootScope.tabs.splice(num, 1);
					return num;
				}
		},
		active: function(id){
			$rootScope.rootTab.active = (id == 'root');
			for (num in $rootScope.tabs)
			{
				var f = ($rootScope.tabs[num].id == id);
				if (f) $rootScope.tab = $rootScope.tabs[num];
				$rootScope.tabs[num].active = f;
			}
		},
		count: function(){
			return $rootScope.tabs.length;
		}
	}
	

});