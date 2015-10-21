chatio.controller 'roomsCtrl', ['$scope', '$route', '$rootScope', '$timeout', '$http', 'socket', ($scope, $route, $rootScope, $timeout, $http, socket) ->

  listeners = []
  $scope.$on '$destroy', ->
    for listener in listeners
      listener()

  $scope.rooms = []
  $scope.users = []
  $scope.loading = true
  listeners.push socket.on '31', (data) ->
    $scope.loading = false
    $scope.rooms = data

  socket.emit '14'
  $scope.$on 'rendering finished', (event, data) ->
    #Tooltips
    jQuery -> jQuery('[data-toggle="tooltip"]').tooltip()

  $scope.getUser = (id) ->
    socket.emit '22', id
    close = socket.on '23', (user) ->
      return if user._id != id
      $scope.users[user._id] = user
      close()

]