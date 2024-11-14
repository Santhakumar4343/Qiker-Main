$( document ).ajaxComplete(function( event, request, settings ) {
	if (request.responseJSON && request.responseJSON.Token) {
		 // csrf_hash  = request.responseJSON.Token
	} 
});
var base_url = window.location.origin+'/';
// alert(base_url)
var AjaxR = {};
//var AuthorizationToken = (typeof (Storage) !== 'undefined') ? localStorage.getItem('Auth') : '';
var AuthorizationToken = document.cookie.replace(/(?:(?:^|.*;\s*)AuthTkn\s*\=\s*([^;]*).*$)|^.*$/, "$1");
function xhr(targetForm, targetUrl, method ='post') {
	//var object = {};
	// targetForm.forEach(function(value, key){
	// 	object[key] = value;
	// });
	return AjaxR = $.ajax({
		url: base_url + targetUrl,
		method: method, //"post",
		data: targetForm,
		//data: object,
		processData: false,
		contentType: false,
		headers: {
			'Authorization': 'Bearer ' + AuthorizationToken,
		},
		error: function (resp) {
			
			if (resp.responseJSON && resp.responseJSON.message) {
				
				showNotifications('error', resp.responseJSON.message);
			} else if (resp.statusText) {
				
				showNotifications('error', resp.statusText + ' ! Please try again.');
			}else{
				
				showNotifications('error', 'Something went wrong, Please try again.');
			}
		}
	});
}

//Send and Verify otp 

$(document).on('click', '.send-otp-btn', function () {
    const userEmail = $(this).data('email');
    const orderId = $(this).data('order-id'); // Get the order ID from the button

    if (!userEmail || !orderId) {
        alert("Email or Order ID is undefined. Cannot send OTP.");
        return;
    }

    $('#orderIdInput').val(orderId); // Set the order ID in the hidden input field
    $('#emailInput').val(userEmail); // Set the email in the hidden input field

    $.ajax({
        url: '/send-otp',
        type: 'GET',
        data: { userEmail: userEmail },
        success: function (response) {
            alert(response); // Notify the user that the OTP was sent
            $('#otpModal').modal('show'); // Show the OTP modal
        },
        error: function (error) {
            alert('Failed to send OTP. Please try again.');
            console.log(error);
        }
    });
});


$('#verifyOtpForm').submit(function (event) {
    event.preventDefault(); // Prevent the default form submission

    const userEmail = $('#emailInput').val();
    const otp = $('#otpInput').val();
    const orderId = $('#orderIdInput').val(); // Retrieve the order ID

    $.ajax({
        url: '/verify-otp',
        type: 'POST',
        data: { userEmail: userEmail, otp: otp },
        success: function (response) {
            alert(response); // Notify the user about the OTP verification status
            if (response.includes('successfully')) {
                $('#otpModal').modal('hide'); // Hide the OTP modal on successful verification
              
                // Make the API call to mark the order as delivered
                $.ajax({
                    url: '/orders/markDelivered',
                    type: 'GET',
                    data: { orderId: orderId },
                    success: function (response) {
                        alert(response.message); // Notify the user about the order status update
						location.reload();
                    },
                    error: function (error) {
                        alert('Failed to mark order as delivered. Please try again.');
                        console.log(error);
                    }
                });
            }
        },
        error: function (error) {
            alert('Failed to verify OTP. Please try again.');
            console.log(error);
        }
    });
});





$(document).on('change', '.previewFile', function () {
	let _this = $(this);
	let file = _this[0].files[0];
	
	let allowedExtensions = /(\.jpg|\.jpeg|\.png|\.gif)$/i;
	
	if(allowedExtensions.exec(file.name)){
		let reader = new FileReader();
		reader.addEventListener("load", function () {
			$(_this.data('id')).attr('src', reader.result);
			$(_this.data('id')).css('background-image', 'url(' + reader.result + ')');
		}, false);

		if (file) {
			reader.readAsDataURL(file);
		}
		
		if(typeof _this.data('url') != 'undefined'){
			let f = new FormData();
			f.set('ufile', file);
			f.set('target', _this.data('target'));
			// f.set(csrf_name, csrf_hash);
			if(file.size < 3000000){
				$('.spinner-border').removeClass('d-none');
				xhr(f, _this.data('url')).done(function (data) {
					data = JSON.parse(data);
					if (data.status == 1) {
						showNotifications("success", data.message);
						myModal.modal('hide');
						getSlider(_this.data('target'));
					}else{
						showNotifications("error", data.message);
					}
					$('.spinner-border').removeClass('d-none');
				})
			}else{
				setTimeout(function(){
					showNotifications("error",'Image File is too large.');
					$(_this.data('id')).css('background-image', 'url()');
					_this.val('');
				},2000)
				
			}
		}
	}else{
		_this.val('');
		showNotifications("error", 'Please upload the file having extensions .jpeg/.jpg/.png/.gif only.');
	}

})

/* initialize Server side datatable*/
var dataTableObj = [];
$(document).ready(function(){
	if ($(".display").length > 0) {
		var dataTableCount = 0;
		$('table.display').each(function () {
			dataTableObj[dataTableCount++] = manage_dataTable($(this));
		});
	}
})

function manage_dataTable(_this) {
	var tableOption = {};
	if (_this.hasClass('dataTableAjax')) {
		var actionUrl = base_url + _this.attr('data-action-url');
		/* tableOption["language"] = {
			"info": "<span class='currentPage'>Showing <span>01</span></span>",
			"paginate": {
				previous: `<img src="/assets/images/svg/prev.svg">`,
				next: `<img src="/assets/images/svg/next.svg">`
			}
		}; */
		tableOption["processing"] 		= true;
		//tableOption["oLanguage"] 		= {sProcessing: "<div class='table_loader_wrap'><img src="+base_url+'images/favicon.png'+"></div>"};
		tableOption["searching"] 		= true;
		tableOption["bLengthChange"] 	= false;
		tableOption["serverSide"] 		= true;
		tableOption["ordering"] 		= false;
		tableOption["responsive"]       = true;
		tableOption["ajax"] = {
			"url": actionUrl,
			"data": function (d) {
				if (typeof _this.attr('data-filter') != 'undefined') {
					$('.filter').each(function () {
						d[$(this).attr('name')] = ($(this).val());
					});
				}
			}
		};
	}
	if (typeof _this.attr('data-column-class') != 'undefined')
		tableOption["columns"] = eval(_this.attr('data-column-class'));
	
	if(typeof _this.attr('data-orders') != 'undefined'){
		tableOption["order"] = eval(_this.attr('data-orders'));
	}
	if(typeof _this.attr('data-sort') != 'undefined'){
		tableOption["columnDefs"] = eval(_this.attr('data-sort'));
	}
	
	tableOption["drawCallback"] = function (settings){
		let api = this.api();
		let res = api.rows({ page: 'current' }).data();
		
		$(_this.attr('data-id')).text(api.page.info().recordsTotal);
		
				
			// $('.currentPage').find('span').text(res.page()+1);
	}
	
	return _this.DataTable(tableOption);
}

$(document).on('change','[name="length"]',function(){
	 dataTableObj[0].page.len($(this).val()).draw();
})
$(document).on('keyup change', '.filter', function () {
	console.log('filter');
	dataTableObj[0].ajax.url(base_url + $('table').data('action-url')).clear().draw();
})

function showAnalytics(){
	let d = $('#dateRangePicker').val();
	let vid_id = $('#vid_id').val();
	let f = new FormData();
	f.append('daterange',d);
	f.append('vid_id',vid_id);
	xhr(f,'home/showAnalytics').done(function (data){
		if(data.length){
			data = JSON.parse(data);
			console.log(data);
			$.each( data, function( key, value ) {
			  $('.sc_videoContent').eq(key).html(value);
			});
		}
	})
}
/*****************************dateRangePicker*******************************************************/
// $(function() {
var daterangepicker = $('#dateRangePicker');
if(daterangepicker.length){
	var start = moment().subtract(6, 'days');
	var end = moment();

	function cb(start, end) {
		$('#dateRangePicker span').html(start.format('MMMM D, YYYY') + ' - ' + end.format('MMMM D, YYYY'));
		daterangepicker.val(start.format('YYYY/MM/DD') + ' - ' + end.format('YYYY/MM/DD'));
	}

	daterangepicker.daterangepicker({
		startDate: start,
		endDate: end,
		ranges: {
		   'Today': [moment(), moment()],
		   'Yesterday': [moment().subtract(1, 'days'), moment().subtract(1, 'days')],
		   'Last 7 Days': [moment().subtract(6, 'days'), moment()],
		   'Last 30 Days': [moment().subtract(29, 'days'), moment()],
		   'This Month': [moment().startOf('month'), moment().endOf('month')],
		   'Last Month': [moment().subtract(1, 'month').startOf('month'), moment().subtract(1, 'month').endOf('month')]
		}
	}, cb);

	cb(start, end);
	/* end Server side datatable*/
	daterangepicker.on('apply.daterangepicker', function(ev, picker) {
		$(this).val(picker.startDate.format('YYYY/MM/DD') + ' - ' + picker.endDate.format('YYYY/MM/DD'));
		dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
	});

	daterangepicker.on('cancel.daterangepicker', function(ev, picker) {
		$(this).val('');
		dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
	});
}
/*****************************dateRangePicker*******************************************************/

// });




$(document).on('click', '.openModalPopup', function () {
	
	let _this 	= $(this) , MyModal = $('#MyModal');
	let url 	= _this.attr('data-href');

	MyModal.find('.modal-title').text(_this.attr('data-title'))
	
	if (url) MyModal.find('.modal-body').empty().load(base_url+url);
	
	MyModal.find('.modal-dialog').removeClass().addClass('modal-dialog');
	
	let cls = _this.attr('data-cls');
	
	if (cls) MyModal.find('.modal-dialog').addClass(cls);	
	
	MyModal.modal({
		keyboard: false,
		show: true,
		backdrop: 'static',
	});
});

$(document).on('click','.deleteMe',function(e){
	e.preventDefault();
	let _this = $(this);
	let btntxt = _this.text();
	_this.text('Wait...').prop('disabled', true);
	let f = new FormData();
	xhr(f,_this.data('href')).done(function (data){
		data = JSON.parse(data);
				
		if (data.status == 1){
			showNotifications("success",data.message);
			if(typeof _this.attr('data-redirect') !== 'undefined')
				setTimeout(()=>{redirect(_this.attr('data-redirect'));},500);
			if(typeof _this.attr('data-remove') !== 'undefined')
				$(_this.attr('data-remove')).remove();
			
			myModal.modal('hide');
		}else 
		if(data.status == 0){
			showNotifications("error",data.message);
		}
		_this.text(btntxt).prop('disabled', false);
	})
});

if($('[data-target="select2"]').length){
	$('[data-target="select2"]').each(function(){
		var options = eval('[' + $(this).attr('data-option') + ']');
		if ($.isPlainObject(options[0])) {
			options[0] = $.extend({}, options[0]);
		}
		console.log(options);
		$(this)[$(this).attr('data-target')].apply($(this), options);
		
	});
}

function randomPassword(length , id = '') {
    var chars = "abcdefghijklmnopqrstuvwxyz!@#$%^&*()-+<>ABCDEFGHIJKLMNOP1234567890";
    var pass = "";
    for (var x = 0; x < length; x++) {
        var i = Math.floor(Math.random() * chars.length);
        pass += chars.charAt(i);
    }
	if(id){
		$(id).val(pass).attr('type','text');
	}else{
		return pass;
	}
    
}

$(document).on('click','.copytoclipboard',function(){
	let _this = $(this);
	$($(this).attr('data-target')).select();
	document.execCommand('copy');
	showNotifications('success','Copied Successfully !');
})

$(document).on('click','.copyfromhidden',function(){
 let _this = $(this);
  $($(this).attr('data-target')).attr("type", "text").select();
  document.execCommand('copy');
  $($(this).attr('data-target')).attr("type", "hidden");
  showNotifications('success','Copied !');
});

$(document).on('keypress','input[data-type="alphaNum"]',function(e){
	var regex = new RegExp("^[a-zA-Z0-9 ]+$");
    var str = String.fromCharCode(!e.charCode ? e.which : e.charCode);
    if (regex.test(str)) {
        return true;
    }
    e.preventDefault();
    return false;
})

$(document).on('keyup','input[data-length]',function(e){
	let ths		=	$(this),leng,clength;
		leng 	= 	ths.data('length');
		clength	= 	(ths.val()).length;
		$(this).next('span').text(leng-clength);
});


// Shorthand for queryselector
const qs = (selector, parentNode = document) => {
	console.log(selector);
	console.log(parentNode);
	return (parentNode).querySelector(selector)
};

// Shorthand for queryselectorAll
const qsa = (selector, parentNode = document) => {
	return parentNode.querySelectorAll(selector)
};

$(document).on('click','.showHidePassword',function(){
	let x = document.querySelector('[name="user_password"]');
	if (x.type === "password") {
		x.type = "text";
	}else{
		x.type = "password";
	}
})
 
$(document).on('click','.downloadGif',function(){
	let href = $('#ciu').find('a').attr('href');
	
	if(href.length){
		window.location = base_url + 'common/downloadimage?i='+href;
	}else{
		Custom_notify('error', 'No thumb to be download.');
	}
})

$('input').keypress(function (e) {
	if (e.which == 13) {
	  $('form').submit();
	  return false;    //<---- Add this line
	}
  });

$("form").submit(function(e){
	e.preventDefault();
	let _this = $(e.target);
	_this.find('[data-action="submitMe"]').trigger('click');
});



$(document).on("click",'[data-action="submitMe"]', (e) => {
	e.preventDefault();
	let _this = $(e.target);
	let btntxt = _this.html();
	_this.html('<span class="sc_wait_pro">Wait...</span>').prop('disabled', true);
	let form = _this.closest("form");
	checkValidation(form).then(()=>{
		if (typeof CKEDITOR  !== "undefined") { 
			for (instance in CKEDITOR.instances) 
			{
				CKEDITOR.instances[instance].updateElement();
			}
		}
		let f = new FormData(form[0]);
			f.set('offset', tzoffset());
			xhr(f, form.attr('action') ).done((data) => {
				//console.log(data)
				//data = JSON.parse(data);
				
				if($('.modal').length) $('.modal').modal('hide');
				if(data.status == 1){
					console.log(data.message)
					showNotifications("success",data.message);
					
					
					if($('table').length)
					dataTableObj[$('table').attr('data-refresh-dataTablePosition')].ajax.url(base_url+$('table').attr('data-action-url')).clear().draw();
					
					if( typeof form.attr('data-redirect') !== 'undefined'){
						setTimeout(()=>{redirect(form.attr('data-redirect'))},500);
					}
						
					if(typeof data.redirect != 'undefined'){
						setTimeout(()=>{redirect(data.redirect)},500);
					}
						
					if(typeof form.attr('data-reset') !== 'undefined')
						form[0].reset();
					
					if(typeof form.attr('data-update') != 'undefined' ){
						if(form.attr('data-update') == 'updateRecTitle'){ /****On recording Dashboard page , rename recording title form*****/
							
						}
					
						if(form.attr('data-update') == 'updateSecurePass'){ /****On recording Dashboard page , Secure recording*****/
							if(f.get('vid_privacy') == 'secure'){
								setTimeout(()=>{
									$('.modal-content').empty().load(base_url+'modal/secure_recording/'+f.get('vid_id'));
									myModal.modal();
								},1000)
							}
						}
					}
				}else 
				if(data.status == 0){
					showNotifications("error",data.message);
				}
				
				_this.html(btntxt).prop('disabled', false);
				
			}).fail(()=>{
				_this.html(btntxt).prop('disabled', false);
			});
	}).catch((mess)=>{
		_this.html(btntxt).prop('disabled', false);
		
		showNotifications('error',mess);
	})	
});

function checkValidation(form){
	return new Promise((resolve, reject) => {
		$('.require').removeClass('error');
	    form.find("input , textarea , select").each(function() {
			let _this = $(this);
            if (_this.hasClass("require") && $.trim(_this.val()) == "") {
                _this.addClass("error").focus();
                 reject((_this.data('error'))?  _this.data('error') :'You have missed out some required fields');
				 return false;
            }
			
			if (_this.hasClass("valid") && $.trim(_this.val()) != "" ){
				let email = /^([\w-]+(?:\.[\w-]+)*)@((?:[\w-]+\.)*\w[\w-]{0,66})\.([a-z]{2,6}(?:\.[a-z]{2})?)$/;	 
				let url = /(http|ftp|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
				let domain = /(http|https):\/\/[\w-]+(\.[\w-]+)+([\w.,@?^=%&amp;:\/~+#-]*[\w@?^=%&amp;\/~+#-])?/;
                let valid 	= _this.attr("data-valid");
				 console.log(eval(valid));
				if (!eval(valid).test(_this.val().trim())) {
					_this.addClass("error").focus();
					 reject((_this.data('verror'))?  _this.data('verror') :'Please enter a valid '+ valid);
					 return false;
				}
            }
        });
        resolve();
	})
}


function showNotifications(type, message){
   // let img = base_url+'assets/images/'+type+'.png';
   // $('#sc_comman_noti .sc_inner img').attr('src',img);
   let spanText='';
    if( type == 'success' )
       	spanText ="<span>Congratulations!</span>";
    else
        spanText ="<span>Yikes!</span>";
		$('.pc-notifications p').after().html(spanText+message);
		$('.pc-notifications').removeClass("pc-error pc-success");
		$('.pc-notifications').addClass("pc-"+type);
		$('.pc-notifications').addClass('open');
    setTimeout(function(){ 
        $('.pc-notifications').removeClass('open');
    }, 5000);
}





function is_valid_url(url){
	if(url.search("http") >= 0){
		let re = /^(http[s]?:\/\/){0,1}(www\.){0,1}[a-zA-Z0-9\.\-]+\.[a-zA-Z]{2,5}[\.]{0,1}/;
		return re.test(url);
	}
}

function tzoffset() {
	var d = new Date();
	return d.getTimezoneOffset();
}

function redirect(url) {
	setTimeout(()=>{
		window.location.href = base_url + url;
	},3000)
}

function showPopupVideo(){
	if($('.play_video').length){
	$(".play_video").magnificPopup({
		fixedContentPos: true,
// 		fixedBgPos: true,
		type: 'iframe',
		gallery: {
			enabled: true
		}
	});
	}
}

$(document).on("click", ".MoreText", function () {
    let ths = $(this);
    if (ths.text() == "..Read More") {
        ths.text("..Read Less");
        ths.prev("span.contentText").css({ display: "inline" });
        ths.prev().prev().hide();
    } else {
        ths.text("..Read More");
        ths.prev("span.contentText").css({ display: "none" });
        ths.prev().prev().show();
    }
});

$(document).on('click' , '.changeStatus' , function(e){
	// e.preventDefault();		
	let _this 	= 	$(this);
	let f 		= 	new FormData();
	let url 	=	_this.attr('url');
	let id 		=	_this.attr('id');
	let action 	=	_this.attr('action');
	
	f.append('id', id);
	f.append('action', action);
	
	if(action == 1){
		icon = 'success';
	}else{
		icon = 'warning';
	}
	if(_this.attr('title'))
	{
		let swals = {
		  title:_this.attr('title'),
		  text:_this.attr('text'),
		  icon:icon,
		  buttons: true,
		  dangerMode: (icon == 'warning') ? true : false ,
		};

		swal(swals)
		.then((done) => {
			if(done){
				xhr(f,url).done(function (data) {
					data = JSON.parse(data);
					if (data.status == 1) {
						showNotifications("success", data.message);
						dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
					}
				})	
			} 
		});
		
	}else{
		f.append('status', _this.is(":checked")?1:0) ;
		
		xhr(f,url).done(function (data) {
			//data = JSON.parse(data);
			if (data.status == 1) {
				showNotifications("success", data.message);
				dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
			}else{
				showNotifications("error", data.message);
			}
		})	
	}
});

$(document).on('click' , '.updateAllStatus' , function(e){
	e.preventDefault();		

	let allChekedOrderID = [];
	$('input.checkedOrder:checkbox:checked').each(function () {
		allChekedOrderID.push($(this).val());
	});
	if(allChekedOrderID.length == 0){
		showNotifications("error", 'Please select atleast one order.');
		return;
	}

	let _this 	= 	$(this);
	let action = _this.attr('action');
	let url = _this.attr('url');
	let confirmButtonText = 'Confirm';
	let cancelButtonText  = 'Reject';
	if(action == 1){
		title = 'Are you really want to delivered all selected order status ?'
		icon = 'success';
	}else if(action == 3){
		title = 'Are you really want to confirm all selected order status ?'
		icon = 'success';
	
	}else if(action == 4){
		title = 'Are you really want to Ready To Dispatch all selected order status ?'
		icon = 'success';

	}else if(action == 5){
		title = 'Are you really want to Dispatch all selected order status ?'
		icon = 'success';
	}else if(action == 6){
		title = 'Are you really want to reject all selected order status ?'
		icon = 'warning';
	}	
	let swals = {
	  title:title,
	  text:'',
	  icon:icon,
	  buttons: true,
	  showCancelButton: true,
	  dangerMode: (icon == 'warning') ? true : false ,
	  confirmButtonText : confirmButtonText,
	  cancelButtonText : cancelButtonText
	};
	Swal.fire(swals)
	.then((done) => {
		if(done.isConfirmed){
			let f = new FormData();
			f.set('order_ids',allChekedOrderID);
			f.set('status', action);
			xhr(f, url ).done((data) => {
				//data = JSON.parse(data);
				if (data.status == 1) {
					// $('.sc_bulkpopup').addClass('d-none');
					//$('#checkallbox').trigger('click');

					showNotifications("success", data.message);
					dataTableObj.forEach(function(k,v){
						k.ajax.reload();
						
						console.log(k.ajax.json().recordsTotal)
					});
					//dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
				}
			})
		} 
	});
});

function validEmail(email) {
    var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(email);
};

function store(name, val) {
	if (typeof (Storage) !== 'undefined') {
		localStorage.setItem(name, val)
	} else {
		window.alert('Please use a modern browser to properly view this template!')
	}
}
function get(name) {
	if (typeof (Storage) !== 'undefined') {
		return localStorage.getItem(name)
	} else {
		window.alert('Please use a modern browser to properly view this template!')
	}
}


var Checkedbox = 0;
function checkAll(ele,clas) {
	var checkboxes = $('.'+clas);
	if (ele.checked) {
		for (var i = 0; i < checkboxes.length; i++){
			if (checkboxes[i].type == 'checkbox'){
				checkboxes.eq(i).prop("checked",true).trigger("change");
				Checkedbox++;
			}
		}
	}else{
		for (var i = 0; i < checkboxes.length; i++){
			if (checkboxes[i].type == 'checkbox'){
				checkboxes.eq(i).prop("checked",false).trigger("change");
			}
		}
	}
	$(ele.dataset.counttarget).text(Checkedbox);
	Checkedbox=0;
}

function confirmBoxAlert(_this){
	Swal.fire({
		title: 'Are you sure?',
		text: "You won't be able to revert this!",
		icon: 'warning',
		showCancelButton: true,
		confirmButtonColor: '#3085d6',
		cancelButtonColor: '#d33',
		confirmButtonText: 'Yes, delete it!'
	}).then((result) => {
		if (result.isConfirmed) {
			let f 		= 	new FormData();
			let url 	=	_this.attr('data-url');
			let id 		=	_this.attr('data-delete-id');
			f.append('id', id);
			xhr(f, url, 'delete').done(function (data) {
				//data = JSON.parse(data);
				if (data.status == 1) {
					//showNotifications("success", data.message);
					Swal.fire(
						'Deleted!',
						'Record has been deleted.',
						'success'
					)
					_this.parents('.imgArea').remove();
					if($('table').length)
					dataTableObj[0].ajax.url(base_url+$('table').data('action-url')).clear().draw();	
				}else{
					//showNotifications('error', data.message);
					Swal.fire(
						'Can\'t Delete!',
						 data.message,
						'error'
					)
				}
			})	
		}
	})
}

if($('.myEditor').length){
	CKEDITOR.replaceAll('myEditor');
}


// Reusable helper functions
function calculateSalePrice(listPrice, discount){
	listPrice = parseFloat(listPrice);
	discount  = parseFloat(discount);
	return (listPrice - ( listPrice * discount / 100 )).toFixed(2); // Sale price
}

function calculateDiscount(listPrice, salePrice){
	listPrice = parseFloat(listPrice);
	salePrice = parseFloat(salePrice);
	return 100 - (salePrice * 100 / listPrice); // Discount percentage
}


/* Ads Rate Plan Setting*/
$('.js-data-ajax').each((i)=>{
    $('.js-data-ajax').eq(i).select2({
		tokenSeparators: [","],
		ajax: {
			url: base_url + $('.js-data-ajax').eq(i).attr('data-ajax--url'),
			dataType: 'json',
			method: 'POST',
			delay: 250,
			placeholder:$('.js-data-ajax').eq(i).attr('data-placeholder'),
			data: function (params) {
				var query = {
				  search: params.term,
				}
				return query;
			  },
			processResults: function (res) {
				let result = [];
				//result.push({id: 'all' ,text: 'Select All'});
				$.each(res.data.list, function (key, item) {
					if(item.name.length)
					result.push({id: item.id ,text: item.name});
				});
				return {
					results: result 
				};
			},
			initSelection: function (element, callback) {
				callback($.map(element.val().split(','), function (id) {
					return { id: id, text: id };
				}));
			}
		}
	});
});


$(document).on('click' , '#sendBulkMail' , function(e){
	e.preventDefault();		
	let _this = $(e.target);
	let btntxt = _this.html();
	_this.html('');
	_this.html('<span class="sc_wait_pro">Wait...</span>').prop('disabled', true);
	let form = _this.closest("form");
	checkValidation(form).then(()=>{
		if (typeof CKEDITOR  !== "undefined") { 
			for (instance in CKEDITOR.instances) 
			{
				CKEDITOR.instances[instance].updateElement();
			}
		}
		let confirmButtonText = 'Confirm';
		let cancelButtonText  = 'Reject';
		let title = 'Are you sure you want to send this ?'
		let icon = 'success';
		let swals = {
		title:title,
		text:'',
		icon:icon,
		buttons: true,
		showCancelButton: true,
		dangerMode: (icon == 'warning') ? true : false ,
		confirmButtonText : confirmButtonText,
		cancelButtonText : cancelButtonText
		};
		Swal.fire(swals)
		.then((done) => {
			if(done.isConfirmed){
				let f = new FormData(form[0]);
				xhr(f, form.attr('action') ).done((data) => {
					//data = JSON.parse(data);
					if (data.status == 1) {
						form[0].reset();
						showNotifications("success", data.message);
					}else{
						showNotifications("error", data.message);
					}
					_this.html(btntxt).prop('disabled', false);
				});
			}else{
				_this.html(btntxt).prop('disabled', false);
			} 
		});

	}).catch((mess)=>{
		_this.html(btntxt).prop('disabled', false);
		showNotifications('error',mess);
	});
});


