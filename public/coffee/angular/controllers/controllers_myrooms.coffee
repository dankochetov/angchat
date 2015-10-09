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
      socket.emit 'get rooms', $rootScope.user._id

  listeners.push socket.on 'rooms', (data) ->
    $timeout ->
      $scope.loading = false
      $scope.rooms = data

  $scope.delete = (room) ->
    if room.online == 0 and confirm('Are you sure you want to delete the "' + room.name + '" room?')
      socket.emit 'delete room',
        roomid: room._id
        userid: $rootScope.user._id

  $scope.template = template

]