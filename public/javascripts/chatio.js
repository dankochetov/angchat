'use strict';

var chatio = angular.module('chatio', ['ngRoute', 'ngCookies', 'ngSanitize', 'luegg.directives']);
var socket = io.connect();