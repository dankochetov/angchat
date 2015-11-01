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
        if typeof companion is 'string' then companion = JSON.parse(companion)
        socket.emit config.events['new user'], JSON.stringify
          user: $rootScope.user
          room: companion
        $rootScope.title = ' - ' + companion.username

        $scope.listeners.push socket.on config.events['private history'], (data)->
          if data.from isnt $rootScope.user._id or data.to isnt tab.id then return

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
          socket.emit config.events['get private history'],
            id1: $rootScope.user._id
            id2: companion._id
            skip: $scope.messages.length   
        $scope.loadHistory()

        $scope.listeners.push socket.on config.events['new private message'], (data)->
          if data.to is $rootScope.user._id and data.from isnt tab.id or data.from is $rootScope.user._id and data.to isnt tab.id then return 
          ++$scope.totalMessages
          $timeout -> $scope.scrollGlue = true
          $timeout -> $scope.messages.push data
          $timeout (-> $scope.scrollGlue = false ), 100

      socket.emit config.events['get user'], tab.id
      close = socket.on config.events['user'], (companion)->
        if companion._id isnt tab.id then return 
        init companion
        close()

]