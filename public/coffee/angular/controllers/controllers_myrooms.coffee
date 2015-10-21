chatio.controller 'myroomsCtrl', ['$scope', '$http', '$rootScope', '$timeout', 'socket', 'autoLogout', 'template', ($scope, $http, $rootScope, $timeout, socket, autoLogout, template) ->

  $scope.rooms = []
  $scope.loading = true
  listeners = []
  $scope.$on '$destroy', (event, data) ->
    for i of listeners
      listeners[i]()

  $http.get('/getuser').then (response) ->
    $timeout ->
      $rootScope.user = response.data
      socket.emit '14', $rootScope.user._id

  listeners.push socket.on '31', (rooms) ->
    for room, i in rooms
      if room.owner != $rootScope.user._id then rooms.splice i, 1
    $timeout ->
      $scope.loading = false
      $scope.rooms = rooms

  $scope.delete = (room) ->
    if room.online == 0 and confirm('Are you sure you want to delete the "' + room.name + '" room?')
      socket.emit '15',
        roomid: room._id
        userid: $rootScope.user._id

  $scope.template = template

]