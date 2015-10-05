//Dropdown animation
function dropdownSlide()
{

	$('.dropdown').off();

	$('.dropdown').on('show.bs.dropdown', function(e){
		$(this).find('.dropdown-menu').first().stop(true, true).slideToggle('fast');
	});

	 $('.dropdown').on('hide.bs.dropdown', function(e){
		$(this).find('.dropdown-menu').first().stop(true, true).slideToggle('fast');
	});
}