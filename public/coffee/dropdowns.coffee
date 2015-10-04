$(document).ready ->
  $('.dropdown').on 'show.bs.dropdown', (e) ->
    $(this).find('.dropdown-menu').first().stop(true, true).slideDown 'fast'

  $('.dropdown').on 'hide.bs.dropdown', (e) ->
    $(this).find('.dropdown-menu').first().stop(true, true).slideUp 'fast'