chatio.controller 'roomsCtrl', ['$scope', '$route', '$rootScope', '$timeout', '$http', 'socket', ($scope, $route, $rootScope, $timeout, $http, socket) ->

  listeners = []
  $scope.$on '$destroy', ->
    for listener in listeners
      listener()

  $scope.rooms = []
  $scope.users = []
  $scope.loading = true
  listeners.push socket.on 'rooms', (data) ->
    $scope.loading = false
    $scope.rooms = data

  socket.emit 'get rooms'
  $scope.$on 'rendering finished', (event, data) ->
    #Tooltips
    jQuery -> jQuery('[data-toggle="tooltip"]').tooltip()

  $scope.getUser = (id) ->
    socket.emit 'get user', id
    close = socket.on 'user', (user) ->
      return if user._id != id
      $scope.users[user._id] = user
      close()

]