chatio.factory('backBtnService', function($log){
	var f = false;
	return function(val){
		if (val != undefined) this.f = val;
		else return this.f;
	}
});

chatio.factory('auth', function(){
	var user;
	return function(val){
		if (val != undefined) this.user = val;
		else return JSON.parse(this.user);
	}
})