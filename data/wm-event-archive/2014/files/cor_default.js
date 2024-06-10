var default_counter = 3;
var counter_limit = default_counter;

function modal_open(p_id)
{
	var w = $("#"+p_id+"-box").css("width");
	var h = $("#"+p_id+"-box-content").css("height");

	$("#"+p_id+"-content").css("margin-left", "-"+(parseInt(w)/2)+"px");
	$("#"+p_id+"-content").css("margin-top", "-"+(parseInt(h)/2)+"px");
	
	$("#"+p_id).fadeIn(150);
 	$("#"+p_id+"-content").show();
 	$("#"+p_id+"-content").animate({
 		opacity: 1,
    top: '50%'
 	}, 300);
}
	
function modal_close(p_id, p_func)
{
 	$("#"+p_id+"-content").animate({
 		opacity: 0.1,
    top: '45%'
 	}, 300, function(){
 		$("#"+p_id+"-content").hide();
 		$("#"+p_id).fadeOut(100);
 		p_func;
 	});
}

function update_counter()
{
	counter_limit -= 1;
	$("#download_counter").html(counter_limit);
	if(counter_limit == 0)
	{
		clearInterval(timer);
		window.location = ''+$("#obtained_link").val();
		close_download();
	}
}

function close_download()
{
	modal_close("modal-download");
}

$(document).ready(function(){
	
	$("#logo").click(function(){
		window.location = $(this).attr("rel");
	});
	
	$(".menu-category").hover(function(){
		var relation = $(this).attr("rel");
		$(".submenu").hide();
		$(".menu-cat-img-"+relation).hide();
		$("#menu-cat-img-"+relation+"-hover").show();
		$("#submenu-"+relation).fadeIn(75);
	},function(){
		var relation = $(this).attr("rel");
		$(".menu-cat-img-"+relation).hide();
		$("#menu-cat-img-"+relation).show();
		$("#submenu-"+relation).fadeOut(75);
	});
	
	$("#language-selector").hover(function(){
		$("#language-available").fadeIn(100);
	},function(){
		$("#language-available").fadeOut(100);
	});
	
	$(".language-item").hover(function(){
		$(this).css("background", "#2f241f");
	},function(){
		$(this).css("background", "#1b1717");
	});
	
	$("#btn-play-now").hover(function(){
		$(this).css("background-position", "0 -86px");
	}, function(){
		$(this).css("background-position", "0 0");
	});
	
	$(".login-button").click(function(){
		modal_open("modal-signin");
		$("#signin_user").focus();
		$("#signin_user, #signin_pass").keypress(function(ev){
  			if(ev.which == 13)
  				$("#btn-signin-main").click();
  	});
	});
 
	$(".modal-close").click(function(){
		var relation = $(this).attr("rel");
		modal_close("modal-"+relation);
		if(relation == "signin")
			$("#login-error").html("");
	});
});