#Dropdown animation
dropdownSlide = ->
  $('.dropdown').off()
  $('.dropdown').on 'show.bs.dropdown', (e)->
    $(this).find('.dropdown-menu').first().stop(true, true).slideToggle 'fast'

  $('.dropdown').on 'hide.bs.dropdown', (e)->
    $(this).find('.dropdown-menu').first().stop(true, true).slideToggle 'fast'