chatio.factory 'template', ['$rootScope', '$localStorage', ($rootScope, $localStorage) ->

  root = exports ? this

  go = (route) ->
    if $rootScope.templateUrl? then root.history.push $rootScope.templateUrl
    $localStorage.templateUrl = route
    $rootScope.templateUrl = route

  {
    go: go
    setDefault: (route) -> $localStorage.templateUrl = route
    init: (route) ->
      root.history = $localStorage.templateHistory or []
      $localStorage.templateHistory = root.history
      go $localStorage.templateUrl or route
    url: -> $rootScope.templateUrl
    back: ->
      if root.history.length > 0
        $rootScope.templateUrl = root.history.splice(-1, 1)[0]
        $localStorage.templateUrl = $rootScope.templateUrl
    clear: -> root.history = []
  }

]