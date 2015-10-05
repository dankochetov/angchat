chatio.filter('onlyMy', function(){
	return function(rooms, id){
		var _rooms = [];
		for (var room in rooms)
		{
			room = rooms[room];
			if (room.owner == id) _rooms.push(room);
		}
		rooms = _rooms;
		return rooms;
	}
});