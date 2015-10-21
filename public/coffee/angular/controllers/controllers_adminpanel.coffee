chatio.controller 'adminpanelCtrl', ['$scope', '$rootScope', 'socket', '$timeout', '$http', 'template', ($scope, $rootScope, socket, $timeout, $http, template) ->

	$scope.recordsPerPage = 5
	$scope.usersPage = 1

	if $rootScope.user.rank < 2
		template.go '/chat'
		template.clear

	$scope.ranks = ['user', 'moderator', 'administrator', 'extra']
	$scope.changingRank = {}
	$scope.statsPeriod = 'today'

	$http.get('/getuser').then (response) ->
		if response.data == '401'
			$rootScope.user = {}
			template.go '/index'
			template.clear

	listeners = []

	$scope.$on '$destroy', ->
		for listener in listeners
			listener()

	$scope.loadingRooms = $scope.loadingUsers = $scope.loadingStats = true

	socket.emit '28', (new Date()).format 'isoDate'
	socket.emit '14'
	$scope.loadUsers = ->
		socket.emit '24', {recordsPerPage: $scope.recordsPerPage, page: $scope.usersPage}
	$scope.loadUsers()

	listeners.push socket.on '29', (stats) ->
		$timeout ->
			$scope.stats = stats
			$scope.loadingStats = false

	listeners.push socket.on '31', (rooms) ->
		$timeout ->
			$scope.rooms = rooms
			$scope.loadingRooms = false

	listeners.push socket.on '30', (users) ->
		$timeout ->
			$scope.changingRank = {}
			$scope.users = users
			$scope.loadingUsers = false


	$scope.deleteRoom = (room) ->
		if confirm 'Are you sure you want to delete the ' + room.name + ' room?'
			socket.emit '16', room._id

	$scope.setRank = (user, rank) ->
		$scope.changingRank[user._id] = true
		socket.emit '25',
			user: user
			rank: rank

	$scope.deleteUser = (user) ->
		if confirm 'Are you sure want to delete the ' + user.username + ' user?'
			socket.emit '26', user._id
]