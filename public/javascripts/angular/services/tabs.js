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

	function active(id, callback, params)
	{
		tabsInit.promise.then(function(){
			$timeout(function(){
				if (!params) params = {};
				$rootScope.rootTab.active = (id == 'root');
				if (id == 'root') $rootScope.tab = $rootScope.rootTab;
				else
					for (num in $rootScope.tabs)
					{
						if (params.force) $rootScope.tabs[num].active = false;
						if ($rootScope.tabs[num].id == id)
						{
							$rootScope.tabs[num].active = true;
							$rootScope.tab = $rootScope.tabs[num];
							$rootScope.tab.unread = 0;
							if (!params.force) break;
						}
					}
				if (callback) callback();
				flush();
			});
		});
	}

	return {
		init: function(callback){
			$rootScope.tabs = $rootScope.$storage.tabs;
			$rootScope.rootTab = $rootScope.$storage.rootTab || $rootScope.rootTab;
			$rootScope.tab = $rootScope.$storage.tab || $rootScope.rootTab;
			tabsInit.resolve();
			if (callback) callback();
		},
		open: function(data, callback){
			$timeout(function(){
				$rootScope.tabs.push(data);
				if (data.active) active(data.id, callback, {force: true});
			});
		},
		close: function(id, callback){
			tabsInit.promise.then(function(){
				var res;
				for (num in $rootScope.tabs)
					if ($rootScope.tabs[num].id == id)
					{
						res = num;
						$timeout(function(){
							$rootScope.tabs.splice(res, 1);
							flush();
							if (callback) callback(res);
						});
					}
			});
		},
		active: active,
		addUnread: function(id, callback){
			tabsInit.promise.then(function(){
				for (var i in $rootScope.tabs)
				{
					if ($rootScope.tabs[i].id == id)
					{
						$timeout(function(){
							++$rootScope.tabs[i].unread;
							if (callback) callback();
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