chatio.filter('onlyMy', function(){
	return function(rooms, login){
		var _rooms = [];
		for (var room in rooms)
		{
			room = rooms[room];
			if (room.owner == login) _rooms.push(room);
		}
		rooms = _rooms;
		return rooms;
	}
});