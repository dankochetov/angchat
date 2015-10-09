chatio.controller 'adminpanelCtrl', ['$scope', '$rootScope', 'socket', '$timeout', '$http', 'template', ($scope, $rootScope, socket, $timeout, $http, template) ->

	$scope.ranks = ['user', 'moderator', 'administrator', 'extra']
	$scope.changingRank = {}

	$http.get('/getuser').then (response) ->
		if response.data == '401'
			template.go '/index'
			template.clear

	listeners = []

	$scope.$on '$destroy', ->
		for listener in listeners
			listener()

	$scope.loadingRooms = $scope.loadingUsers = true

	socket.emit 'get rooms'
	socket.emit 'admin:get users'

	listeners.push socket.on 'rooms', (rooms) ->
		$timeout ->
			$scope.rooms = rooms
			$scope.loadingRooms = false

	listeners.push socket.on 'admin:users', (users) ->
		$timeout ->
			$scope.changingRank = {}
			$scope.users = users
			$scope.loadingUsers = false


	$scope.deleteRoom = (room) ->
		if confirm 'Are you sure you want to delete the ' + room.name + ' room?'
			socket.emit 'admin:delete room', room._id

	$scope.setRank = (user, rank) ->
		$scope.changingRank[user._id] = true
		socket.emit 'set rank',
			user: user
			rank: rank

	$scope.deleteUser = (user) ->
		if confirm 'Are you sure want to delete the ' + user.username + ' user?'
			socket.emit 'admin:delete user', user._id
]