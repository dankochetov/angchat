chatio.factory('tabs', function($rootScope, $timeout, $localStorage, $q){

	$rootScope.tab = {};
	$rootScope.rootTab = {
				title: 'New tab',
				url: '/chat/rooms',
				active: true
			};
	$rootScope.tabs = [];

	var tabsInit = $q.defer();

	function flush()
	{
		$rootScope.$storage.tabs = $rootScope.tabs;
		$rootScope.$storage.tab = $rootScope.tab;
		$rootScope.$storage.rootTab = $rootScope.rootTab;
	}

	function active(id)
	{
		tabsInit.promise.then(function(){
			console.log(id);
			$timeout(function(){
				$rootScope.rootTab.active = (id == 'root');
				if (id == 'root') $rootScope.tab = $rootScope.rootTab;
				else
					for (num in $rootScope.tabs)
					{
						var f = ($rootScope.tabs[num].id == id);
						if (f)
						{
							$rootScope.tab = $rootScope.tabs[num];
							$rootScope.tab.unread = 0;
						}
						$rootScope.tabs[num].active = f;
					}
			});
			flush();
		});
	}

	return {
		init: function(){
			$rootScope.tabs = $rootScope.$storage.tabs;
			if ($rootScope.$storage.tab == $rootScope.$storage.rootTab)
			{
				$rootScope.tab = $rootScope.rootTab = $rootScope.$storage.rootTab;
			}
			else
			{
				$rootScope.tab = $rootScope.$storage.tab;
				$rootScope.rootTab.active = false;
			}
			tabsInit.resolve();
		},
		open: function(data){
			$timeout(function(){
				$rootScope.tabs.push(data);
				if (data.active) active(data.id);
			});
			flush();
		},
		close: function(id){
			tabsInit.promise.then(function(){
				for (num in $rootScope.tabs)
					if ($rootScope.tabs[num].id == id)
					{
						$timeout(function(){
							$rootScope.tabs.splice(num, 1);
						});
						break;
					}
				flush();
			});
		},
		active: active,
		addUnread: function(id){
			tabsInit.promise.then(function(){
				for (var i in $rootScope.tabs)
				{
					if ($rootScope.tabs[i].id == id)
					{
						$timeout(function(){
							++$rootScope.tabs[i].unread;
						});
						break;
					}
				}
			});
		},
		count: function(){
			return $rootScope.tabs.length;
		}
	}
	

});