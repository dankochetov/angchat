chatio.factory 'popup', ['$timeout', ($timeout) ->
  list = []
  {
    add: (msg) ->
      $timeout ->
        time = 0
        if list.length > 5
          list.splice 0, 1
          time = 300
        $timeout (->
          list.push msg
        ), time
        $timeout (->
          list.splice 0, 1
        ), 5000 + time
    list: list
  }
]