chatio.controller 'privateCtrl', ['$scope', '$routeParams', '$timeout', '$q', '$rootScope', 'autoLogout', 'socket', ($scope, $routeParams, $timeout, $q, $rootScope, autoLogout, socket)->

  $scope.tabInit = $q.defer()
  $scope.chatWindowInit = $q.defer()
  $scope.tabShowInit = $q.defer()
  $scope.chatWindow = {}
  $scope.totalMessages = 0
  $scope.listeners = []
  $scope.$on '$destroy', (event, data)->
    for listener in $scope.listeners
      listener()

  $scope.messages = []
  

  $scope.tabActiveInit = (tab)->
    tab.tabActiveInit.promise.then ->
      $timeout ->
        $scope.chatWindowJQuery = angular.element(".chatWindow-#{tab.id}")
        $scope.tabShowInit.resolve()
        $scope.chatWindow = $scope.chatWindowJQuery[0]
        $scope.scrollGlue = true
      $timeout (-> $scope.scrollGlue = false ), 100

  $scope.tabShowInit.promise.then ->
    $scope.chatWindowJQuery.bind 'scroll', ->
      if $scope.chatWindow.scrollTop is 0 and $scope.messages.length isnt $scope.totalMessages
        $timeout -> $scope.loadHistory(false)

  $scope.tabInit.promise.then (tab)->
    tab.tabInit.promise.then (tab)->

      init = (companion)->
        companion = JSON.parse(companion) if typeof companion == 'string'
        socket.emit '0', JSON.stringify
          user: $rootScope.user
          room: companion
        $rootScope.title = ' - ' + companion.username

        $scope.listeners.push socket.on '5', (data)->
          if data.from != $rootScope.user._id or data.to != tab.id then return

          $scope.tabActiveInit?(tab)
          delete $scope.tabActiveInit

          $scope.totalMessages = data.data.count
          pos = $scope.chatWindow.scrollHeight - $scope.chatWindow.scrollTop
          for id of data.data.messages
            data.data.messages[id].id = (Math.random() * Math.random()).toString()
          $timeout ->
            $scope.loadingHistory = false
            $scope.messages = data.data.messages.concat $scope.messages
          $timeout -> $scope.chatWindow.scrollTop = $scope.chatWindow.scrollHeight - pos
          $timeout (-> $scope.scrollGlue = false ), 100

        $scope.loadHistory = (scroll = true)->
          $timeout ->
            $scope.scrollGlue = scroll
            $scope.loadingHistory = true
          socket.emit '4',
            id1: $rootScope.user._id
            id2: companion._id
            skip: $scope.messages.length   
        $scope.loadHistory()

        $scope.listeners.push socket.on '9', (data)->
          if data.to == $rootScope.user._id and data.from != tab.id or data.from == $rootScope.user._id and data.to != tab.id then return 
          ++$scope.totalMessages
          $timeout -> $scope.scrollGlue = true
          $timeout -> $scope.messages.push data
          $timeout (-> $scope.scrollGlue = false ), 100

      socket.emit '22', tab.id
      close = socket.on '23', (companion)->
        if companion._id isnt tab.id then return 
        init companion
        close()

]