chatio.controller('headCtrl', function($rootScope, $localStorage, socket){
	
	socket.init();
	$rootScope.$storage = $localStorage.$default({
		tabs: [],
		tab: 'root'
	});

	$rootScope.showUsername = function(user){
		var res = user.username;
		if (user.vkontakte) res += ' <img src="/images/signin/vk.png">';
		if (user.facebook) res += ' <img src="images/signin/fb.png">';
		return res;
	}

});