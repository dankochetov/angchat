chatio.service('userInfo', function($cookies){
	function user()
	{
		return $cookies.getObject('user');
	} 

	return {
		logged: function(){
			if (user() == undefined) return false;
			return user().logged;
		},

		name: function(){
			return user().name;
		},

		login: function(name){
			$cookies.putObject('user',{
				logged: true,
				name: name
			});
		},

		logout: function(){
			$cookies.remove('user');
		}
	}
});