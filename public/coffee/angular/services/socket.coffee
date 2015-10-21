chatio.factory 'socket', ['$rootScope', '$q', ($rootScope, $q)->
    ready = $q.defer()
    sock = undefined
    listeners = []
    {
      init: ->
        sockInit = $q.defer()
        sock = new SockJS "#{hostname}/sockjs"

        sock.onopen = ->
          ready.resolve()

        sock.onmessage = (e)->
          data = JSON.parse e.data
          for i of listeners
            if i is data.event
              for k of listeners[i]
                listeners[i][k].callback data.data

      on: (event, callback)->
        if not listeners[event]? then listeners[event] = [] 
        id = (Math.random() * Math.random()).toString()
        listeners[event].push
          id: id
          callback: callback
        ->
          c = 0
          for i of listeners[event]
            if listeners[event][i].id is id
              listeners[event][i].callback = undefined
              listeners[event].splice c, 1
              break
            ++c

      emit: (event, data)->
        ready.promise.then ->
          sock.send JSON.stringify(
            event: event
            data: data)
    }
]