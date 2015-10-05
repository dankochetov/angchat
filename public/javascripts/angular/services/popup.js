chatio.factory('popup', function($timeout){

	var list = [];

	return {
		add: function(msg){
			$timeout(function(){
				var time = 0;
				if (list.length > 5)
				{
					list.splice(0, 1);
					time = 300;
				}
				$timeout(function(){
					list.push(msg);
				}, time);
				$timeout(function(){
						list.splice(0, 1);
				}, 5000+time);
			});
		},
		list: list
	}
});