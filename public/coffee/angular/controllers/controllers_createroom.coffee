chatio.controller 'createroomCtrl', ['$scope', '$http', '$location', 'template', 'autoLogout', 'tabs', ($scope, $http, $location, template, autoLogout, tabs) ->

  $scope.submit = ->
    $scope.showLoading = true
    $http.post('/chat/createroom', $scope.formData).then (response) ->
      data = $scope.formData
      if response.data.status != 'success'
        $scope.errors = response.data.errors
        $scope.showLoading = false
      else
        newTab = 
          title: data.name
          id: response.data.id
          url: '/chat/room/' + response.data.id
          active: true
          private: false
        tabs.open newTab, ->
          $scope.showLoading = false
          template.go '/'

]