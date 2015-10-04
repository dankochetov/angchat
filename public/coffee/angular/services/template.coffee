chatio.factory 'template', ['$rootScope', ($rootScope) ->
  prev = []
  {
    go: (route) ->
      prev.push $rootScope.templateUrl
      $rootScope.templateUrl = route
    url: ->
      $rootScope.templateUrl
    back: ->
      if prev.length > 0
        $rootScope.templateUrl = prev.splice(-1, 1)[0]

  }
]