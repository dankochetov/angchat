chatio.controller 'privateCtrl', ['$scope', '$routeParams', '$timeout', '$q', '$rootScope', 'autoLogout', 'socket', ($scope, $routeParams, $timeout, $q, $rootScope, autoLogout, socket) ->

  $scope.tabInit = $q.defer()
  listeners = []
  $scope.$on '$destroy', (event, data) ->
    for listener in listeners
      listener()

  $scope.messages = []
  $scope.scrollGlue = true

  $scope.tabInit.promise.then (tab) ->
    tab.tabInit.promise.then (tab) ->
      init = (companion) ->
        companion = JSON.parse(companion) if typeof companion == 'string'
        socket.emit 'new user', JSON.stringify
          user: $rootScope.user
          room: companion
        $rootScope.title = ' - ' + companion.username
        socket.emit 'get private history', JSON.stringify
          id1: $rootScope.user._id
          id2: companion._id
        listeners.push socket.on 'private history', (data) ->
          return if data.from != $rootScope.user._id or data.to != tab.id
          $scope.messages = data.data
          $scope.scrollGlue = true

        listeners.push socket.on 'new private message', (data) ->
          return if data.to == $rootScope.user._id and data.from != tab.id or data.from == $rootScope.user._id and data.to != tab.id
          $scope.messages.push data
          $scope.scrollGlue = true

      socket.emit 'get user', tab.id
      close = socket.on 'user', (companion) ->
        return if companion._id != tab.id
        init companion
        close()

]