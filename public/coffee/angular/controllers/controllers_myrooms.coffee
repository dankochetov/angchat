chatio.controller 'myroomsCtrl', ['$scope', '$http', '$rootScope', '$timeout', 'socket', 'autoLogout', 'template', ($scope, $http, $rootScope, $timeout, socket, autoLogout, template) ->

  $scope.rooms = []
  $scope.loading = true
  listeners = []
  $scope.$on '$destroy', (event, data) ->
    for i of listeners
      listeners[i]()

  socket.emit config.events['get rooms'], $rootScope.user._id

  listeners.push socket.on config.events['rooms'], (rooms) ->
    if rooms.length > 0
      for room, i in rooms
        if room.owner isnt $rootScope.user._id then rooms.splice i, 1
      $timeout ->
        $scope.loading = false
        $scope.rooms = rooms

  $scope.delete = (room) ->
    if room.online == 0 and confirm('Are you sure you want to delete the "' + room.name + '" room?')
      socket.emit config.events['delete room'],
        roomid: room._id
        userid: $rootScope.user._id

  $scope.template = template

]