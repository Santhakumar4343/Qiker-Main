$(document).ready(function () {
  $(document).on("click", ".editCate", function () {
    let _this = $(this);
    $("#addNewCateBtn").trigger("click");
    $("#exampleModalLabel02").text("Edit Category");
    $("#cate_id").val(_this.attr("data-cate-id"));
    $("#cate_name").val(_this.attr("data-cate-name"));
    $("#cate_tax").val(_this.attr("data-cate-tax"));
    $("#cate_commission").val(_this.attr("data-commi-tax"));
    $("#category_image").removeClass("require");
  });

  $(document).on("click", ".deleteVariant", function (e) {
    e.preventDefault();
    let variantId = $(this).data("id");
    if (confirm("Are you sure you want to delete this variant?")) {
      $.ajax({
        url: `/delete_variant/${variantId}`,
        type: "DELETE",
        success: function (response) {
          alert(response.message);

          location.reload();
        },
        error: function (xhr, status, error) {
          alert("An error occurred while deleting the variant.");
        },
      });
    }
  });

  $(document).on("click", ".deleteProduct", function (e) {
    e.preventDefault();
    let productId = $(this).data("id");
    $("#confirmDeleteProduct").data("id", productId);
    $("#deleteProductModal").modal("show");
  });

  $("#confirmDeleteProduct").on("click", function () {
    let productId = $(this).data("id");

    $.ajax({
      url: `/delete_product`, // Backend route to handle deletion
      type: "DELETE",
      contentType: "application/json",
      data: JSON.stringify({ productId: productId }), // Send productId as JSON in the request body
      success: function (response) {
        alert("Product deleted successfully");
        $("#deleteProductModal").modal("hide");
        location.reload();
      },
      error: function (xhr, status, error) {
        alert("Product cannot be deleted because it has Variants");
        location.reload();
      },
    });
  });

  $(document).on("click", ".deleteAttribute", function () {
    var attributeId = $(this).data("attribute-id");
    $("#deleteAttributeModal").modal("show");
    $("#confirmDelete")
      .off("click")
      .on("click", function () {
        $.ajax({
          url: "/delete_attribute",
          method: "POST",
          data: { id: attributeId },
          success: function (response) {
            if (response.status) {
              alert("Attribute deleted successfully!");
              location.reload(); // Refresh the table
            } else {
              alert("Failed to delete attribute.");
            }
          },
          error: function () {
            alert("An error occurred while deleting the attribute.");
          },
        });
        $("#deleteAttributeModal").modal("hide");
      });
  });

  $(document).on("click", ".deleteCate", function () {
    const cateId = $(this).data("cate-id");

    // Store the category ID in a hidden field or directly in the button for confirmation
    $("#confirmDeleteCategory").data("cate-id", cateId);

    // Show the modal
    $("#deleteCategoryModal").modal("show");
  });

  // When the delete is confirmed
  $("#confirmDeleteCategory").on("click", function () {
    const cateId = $(this).data("cate-id");

    $.ajax({
      url: `/category/delete`, // Backend route to handle deletion
      type: "DELETE",
      contentType: "application/json",
      data: JSON.stringify({ cateId: cateId }), // Send cateId as JSON in the request body
      success: function (response) {
        if (response.status === 1) {
          alert("Category deleted successfully");
          // Refresh the table or reload the page
          location.reload();
        } else {
          alert(response.message);
        }
      },
      error: function () {
        alert("Category cannot be deleted because it has subcategories");
        location.reload();
      },
    });

    // Hide the modal after confirmation
    $("#deleteCategoryModal").modal("hide");
  });

  $(document).on("click", ".deleteSubCate", function () {
    const subCateId = $(this).data("cate-id");

    // Show the delete confirmation modal
    $("#deleteSubcategoryModal").modal("show");

    // Attach the subcategory ID to the delete button in the modal
    $("#confirmDeleteSubcategory")
      .off("click")
      .on("click", function () {
        // Perform the DELETE request
        $.ajax({
          url: `/subcategory/delete`, // Backend route to handle deletion
          type: "DELETE",
          contentType: "application/json",
          data: JSON.stringify({ subCategoryId: subCateId }), // Send subCategoryId as JSON in the request body
          success: function (response) {
            if (response.status === 1) {
              alert("Subcategory deleted successfully");
              $("#deleteSubcategoryModal").modal("hide");
              // Optionally, refresh the table or reload the page
              setTimeout(function () {
                location.reload();
              }, 1500); // Delay to let the user see the success message
            } else {
              alert(response.message);
            }
          },
          error: function () {
            alert("Subcategory cannot be deleted because it has products");
            location.reload();
          },
        });
      });
  });

  var brandIdToDelete;
  // When delete icon is clicked, store brand ID and show confirmation modal
  $(document).on("click", ".deleteBrand", function () {
    brandIdToDelete = $(this).data("brand-id");
    $("#deleteBrandModal").modal("show");
  });

  // On confirmation, send request to delete the brand
  $("#confirmDeleteBrand").on("click", function () {
    $.ajax({
      url: "/deleteBrand", // Backend route to handle deletion
      type: "DELETE",
      contentType: "application/json",
      data: JSON.stringify({ id: brandIdToDelete }), // Send brandIdToDelete as JSON in the request body
      success: function (response) {
        if (response.status === 1) {
          alert("Brand deleted successfully.");
          // Reload the DataTable after deletion
          $(".dataTableAjax").DataTable().ajax.reload();
        } else {
          alert("Error deleting brand: " + response.message);
        }
        $("#deleteBrandModal").modal("hide");
      },
      error: function (error) {
        alert("Brand cannot be deleted because it is associated with products");
        $("#deleteBrandModal").modal("hide");
      },
    });
  });

  $(document).on("click", ".editSubCate", function () {
    let _this = $(this);
    //  $('#addNewSubCateBtn').trigger('click');
    $("#createSubCategoryModal").modal();
    $("#exampleModalLabel02").text("Edit Sub Category");
    $("#subcate_id").val(_this.attr("data-cate-id"));
    $("#cate_name").val(_this.attr("data-cate-name"));
    $("#main_cateid").val(_this.attr("data-maincate-id")).trigger("change");
    //$('#main_cateid').removeClass('require');
    $("#subcategory_image").removeClass("require");

    //$('#mainCatselect').hide();
  });

  $(document).on("click", "#addNewSubCateBtn", function () {
    $("#mainCatselect").show();
  });

  $(document).on("click", ".editBrand", function () {
    let _this = $(this);
    $("#addNewBrandBtn").trigger("click");
    $("#exampleModalLabel02").text("Edit Brand");
    $("#brand_id").val(_this.attr("data-brand-id"));
    $("#brand_name").val(_this.attr("data-brand-name"));
    $("#brand_image").removeClass("require");
  });

  $(document).on("click", ".editAttribute", function () {
    let _this = $(this);

    let f = new FormData();
    let url = _this.attr("data-url");
    let id = _this.attr("data-attribute-id");
    f.append("id", id);
    xhr(f, url).done(function (resp) {
      //data = JSON.parse(data);
      if (resp.status == 1) {
        let attriData = resp.data;
        $("#addNewAttributeBtn").trigger("click");
        $("#exampleModalLabel02").text("Edit Attribute");
        $("#attribute_id").val(attriData._id);
        $("#attribute_name").val(attriData.attribute_name);
        $(".tagging").tagging("removeAll");
        $(".tagging").tagging("add", JSON.parse(attriData.attribute_value));
        $("#attributes_cate").val(attriData.attribute_cate).trigger("change");
      }
    });
  });

  $(document).on("click", ".editCurrency", function () {
    let _this = $(this);

    let f = new FormData();
    let url = _this.attr("data-url");
    let id = _this.attr("data-currency-id");
    f.append("id", id);
    xhr(f, url).done(function (resp) {
      //data = JSON.parse(data);
      if (resp.status == 1) {
        let currencyData = resp.data;
        $("#addNewCurrencyBtn").trigger("click");
        $("#exampleModalLabel02").text("Edit Currency");
        $("#currency_id").val(currencyData._id);
        $("#currency_code").val(currencyData.currency_code);
        $("#currency_symbol").val(currencyData.currency_symbol);
      }
    });
  });

  $(document).on("click", ".editFaq", function () {
    let _this = $(this);

    let f = new FormData();
    let url = _this.attr("data-url");
    let id = _this.attr("data-faq-id");
    f.append("id", id);
    xhr(f, url).done(function (resp) {
      //data = JSON.parse(data);
      if (resp.status == 1) {
        let resData = resp.data;
        $("#addNewFaqBtn").trigger("click");
        $("#exampleModalLabel02").text("Edit FAQ");
        $("#faq_id").val(resData._id);
        $("#faq_question").val(resData.faq_question);
        $("#faq_answer").val(resData.faq_answer);
      }
    });
  });

  $(document).on("click", ".replyQuestions", function () {
    let _this = $(this);

    let f = new FormData();
    let url = _this.attr("data-url");
    let id = _this.attr("data-question-id");
    f.append("id", id);
    xhr(f, url).done(function (resp) {
      //data = JSON.parse(data);
      if (resp.status == 1) {
        let resData = resp.data;
        $("#questionReplyModal").modal();
        $("#exampleModalLabel02").text("Question Reply");
        $("#que_id").val(resData._id);
        $("#cust_question").val(resData.question);
        $("#cust_answer").val(resData.answer);
      }
    });
  });

  $(document).on("click", ".resetModalForm", function () {
    //let _this = $(this);
    //let modalId =_this.attr('data-target');
    //console.log(modalId)
    //   let form = $(modalId).find('form');
    //   form.find("input[type=hidden]").val('');
    //   form[0].reset();
  });

  $("#createSubCategoryModal").on("shown.bs.modal", function () {
    ///alert()
  });

  $(".modal").on("hidden.bs.modal", function () {
    let _this = $(this);
    $("#exampleModalLabel02").text(
      $("#exampleModalLabel02").attr("data-title")
    );
    let form = _this.find("form");
    form.find("input[type=hidden]").val("");
    if (form.length) form[0].reset();
    $("#category_image").addClass("require");
    $("#subcategory_image").addClass("require");
    $("#brand_image").addClass("require");
    $(".tagging").tagging("removeAll");
    $('input[type="file"]').next("label").text("Browse Image");
  });

  $(document).on("click", ".deleteRecords", function () {
    let _this = $(this);
    confirmBoxAlert(_this);
  });

  $(document).on("change", "#pro_cate", function () {
    $("#pro_subcate").html("");
    let f = new FormData();
    f.append("cate_id", $(this).val());
    xhr(f, "getSubcateAjax", "post").done(function (resp) {
      //data = JSON.parse(data);

      if (resp.status == 1) {
        var object = {};
        HTML = `<option value="" selected="" disabled="">---Select---</option>`;
        resp.data.forEach(function (value, key) {
          HTML += ` <option value="${value._id}">${value.cate_name}</option>`;
        });
        $("#pro_subcate").append(HTML);
      } else {
        HTML = `<option value="" selected="" disabled="">---Sub Category Not Found---</option>`;
        $("#pro_subcate").append(HTML);
      }
    });
  });

  $(document).on("click", ".checkedOrder", function () {
    /* if ($(this).prop("checked")){
              $(this).closest('.table_content tbody tr').addClass('active');
          }else{
              $(this).closest('.table_content tbody tr').removeClass('active');
          }*/

    if ($(".checkedOrder:checked").length) {
      $(".updateAllStatus").attr("disabled", false);
    } else {
      $(".updateAllStatus").attr("disabled", true);
    }

    /*if ($('.checkedOrder:checked').length == $('.checkedOrder').length){
              $('#checkall').prop('checked',true);
              $('#checkall').closest('.table_content tr').addClass('active');
          }else {
              $('#checkall').prop('checked',false);
              $('#checkall').closest('.table_content tr').removeClass('active');
          }*/
  });

  $(document).on("click", ".orderTab", function () {
    $(".updateAllStatus").attr("disabled", true);
    $(".checkedOrder").prop("checked", false);
  });

  $(document).on("click", ".AddTrackingDetail123", async function () {
    let courier = JSON.parse($("#courierServices").val());
    //console.log(courier)
    let HTML = `<select id="swal-input1" class="swal2-input">`;
    HTML += `<option value="" selected="" disabled="">---Select---</option>`;
    courier.forEach(function (value, key) {
      HTML += ` <option value="${value._id}">${value.service_name}</option>`;
    });
    HTML += `</select>
              <input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">`;

    const { value: fruit } = await Swal.fire({
      title: "Select Courier Service",
      showCancelButton: true,
      html: HTML,
      focusConfirm: false,
      preConfirm: () => {
        return [
          document.getElementById("swal-input1").value,
          document.getElementById("swal-input2").value,
        ];
      },
    });

    if (fruit) {
      Swal.fire(`You selected: ${fruit}`);
    }
  });
  $(".AddTrackingDetail").trigger("click");
});

$(document).on("click", ".generateLable", async function (e) {
  e.preventDefault();
  let _this = $(this);
  let action = _this.attr("action");
  let url = _this.attr("url");
  let ids = _this.attr("data-order-id");

  if (ids) {
    let allChekedOrderID = [];
    allChekedOrderID.push(ids);
    let f = new FormData();
    f.set("order_ids", allChekedOrderID);
    xhr(f, url).done((data) => {
      if (data.status == 1) {
        $("#exampleModalLabel02").text("Order Label");
        $("#appendLabelHtml").html(data.data);
        $("#generateLabelModal").modal();
        showNotifications("success", data.message);
      }
    });
  } else {
    showNotifications("error", "Order id is missing");
  }
});

$(document).on("click", ".viewInvoice", async function (e) {
  e.preventDefault();
  let _this = $(this);
  let action = _this.attr("action");
  let url = _this.attr("url");
  let ids = _this.attr("data-invoice-id");

  if (ids) {
    let allChekedOrderID = [];
    allChekedOrderID.push(ids);
    let f = new FormData();
    f.set("invoice_id", allChekedOrderID);
    xhr(f, url).done((data) => {
      if (data.status == 1) {
        $("#exampleModalLabel02").text("Invoice");
        $("#appendLabelHtml").html(data.data);
        $("#generateLabelModal").modal();
        //showNotifications("success", data.message);
      }
    });
  } else {
    showNotifications("error", "Order id is missing");
  }
});

// $(document).on('click', '.AddTrackingDetail' ,async function(e) {
//     e.preventDefault();
//     let _this 	= 	$(this);
// 	let action = _this.attr('action');
// 	let url = _this.attr('url');
//     let ids = _this.attr('data-order-id');

//     if(ids){
//         let allChekedOrderID = [];
//         allChekedOrderID.push(ids);

//         let courier =  JSON.parse($('#courierServices').val());

//         let HTML =`<select id="swal-input1" class="swal2-input">`;
//         HTML +=`<option value="" selected="" disabled="">---Select---</option>`;
//                 courier.forEach(function(value, key){
//                 HTML +=` <option value="${value._id}">${value.service_name}</option>`;
//             });
//         HTML +=`</select>
//             <input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">`;

//         Swal.fire({
//             title: 'Select Courier Service',
//             showCancelButton: true,
//             html: HTML,
//             focusConfirm: false,
//             preConfirm: () => {
//             const courier = document.getElementById('swal-input1').value
//             const trackingid = document.getElementById('swal-input2').value

//             if (!courier) {
//                 Swal.showValidationMessage(`Please select courier sevice`)
//             }else
//             if (!trackingid) {
//                 Swal.showValidationMessage(`Please enter tracking id`)
//             }

//             return { courier: courier, trackingid: trackingid }
//             }
//         }).then((result) => {
//             if(result.isConfirmed){
//                 let f = new FormData();
//                 f.set('order_ids',allChekedOrderID);
//                 f.set('status', action);
//                 f.set('courier_service', result.value.courier);
//                 f.set('tracking_id', result.value.trackingid);
//                 xhr(f, url ).done((data) => {
//                     if (data.status == 1) {
//                         showNotifications("success", data.message);
//                         dataTableObj.forEach(function(k,v){
//                             k.ajax.reload();
//                         });
//                     }
//                 })

//             /* Swal.fire(`
//                 Login: ${result.value.courier}
//                 Password: ${result.value.trackingid}
//                 `.trim())*/
//             }
//         });
//     }else{
//         showNotifications("error", 'Order id is missing');
//     }
// });

// $(document).on('click', '.AddTrackingDetail', async function(e) {
//     e.preventDefault();
//     let _this = $(this);
//     let action = _this.attr('action');
//     let url = _this.attr('url');
//     let ids = _this.attr('data-order-id'); // Get the order ID from the button

//     if (ids) {
//         let allCheckedOrderID = [];
//         allCheckedOrderID.push(ids); // Add the order ID to the array

//         let courier = JSON.parse($('#courierServices').val());

//         let HTML = `<select id="swal-input1" class="swal2-input">`;
//         HTML += `<option value="" selected disabled>---Select---</option>`;
//         courier.forEach(function(value) {
//             HTML += `<option value="${value._id}" data-email="${value.email}">${value.service_name}</option>`;
//         });
//         HTML += `</select>
//                  <input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">`;

//         Swal.fire({
//             title: 'Select Courier Service',
//             showCancelButton: true,
//             html: HTML,
//             focusConfirm: false,
//             preConfirm: () => {
//                 const courierId = document.getElementById('swal-input1').value;
//                 const trackingid = document.getElementById('swal-input2').value;

//                 if (!courierId) {
//                     Swal.showValidationMessage(`Please select a courier service`);
//                 } else if (!trackingid) {
//                     Swal.showValidationMessage(`Please enter tracking ID`);
//                 }

//                 return { courierId: courierId, trackingid: trackingid };
//             }
//         }).then(async (result) => {
//             if (result.isConfirmed) {
//                 let courierEmail = $(`#swal-input1 option[value="${result.value.courierId}"]`).data('email');
//                 let courierServiceName = $(`#swal-input1 option[value="${result.value.courierId}"]`).text();

//                 // Prepare the FormData for the AJAX call
//                 let f = new FormData();
//                 f.set('order_ids', allCheckedOrderID);
//                 f.set('status', action);
//                 f.set('courier_service', result.value.courierId);
//                 f.set('tracking_id', result.value.trackingid);

//                 // Send data to your server and update the UI
//                 try {
//                     const dataResponse = await xhr(f, url);
//                     if (dataResponse.status === 1) {
//                         showNotifications("success", dataResponse.message);
//                         dataTableObj.forEach(function(k) {
//                             k.ajax.reload();
//                         });

//                         // Now send the email with tracking details
//                         await sendEmailToCourier(courierEmail, result.value.trackingid, ids, courierServiceName);
//                     } else {
//                         showNotifications("error", dataResponse.message);
//                     }
//                 } catch (error) {
//                     console.error("Error in sending order details: ", error);
//                     showNotifications("error", 'An error occurred while processing the request.');
//                 }
//             }
//         });
//     } else {
//         showNotifications("error", 'Order ID is missing');
//     }
// });

// // Function to send email to the courier service
// async function sendEmailToCourier(email, trackingId, orderIds, courierServiceName) {
//     const emailData = {
//         to: email,
//         subject: `Product to Deliver`,
//         html: `
//             <p>Hello Deliver Partner (${courierServiceName}),</p>
//             <p>The tracking ID for your service is: <strong>${trackingId}</strong></p>
//             <p>Order ID(s): ${orderIds.join(', ')}</p>
//             <p>Thank you for your service!</p>
//             <p><a href="http://yourwebsite.com/mark-delivered?trackingId=${trackingId}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Delivered</a></p>
//             <p>Best regards,<br>PixaCart</p>
//         `,
//     };

//     try {
//         const response = await $.ajax({
//             type: "POST",
//             url: "/api/send-email",
//             data: JSON.stringify(emailData),
//             contentType: "application/json",
//             dataType: "json",
//         });

//         if (response.status === 1) {
//             showNotifications("success", "Email sent successfully!");
//         } else {
//             showNotifications("error", "Failed to send email.");
//         }
//     } catch (error) {
//         console.error("Email sending error: ", error);
//         showNotifications("error", 'An error occurred while sending the email.');
//     }
// }

// $(document).on("click", ".AddTrackingDetail", async function (e) {
//   e.preventDefault();
//   let _this = $(this);
//   let action = _this.attr("action");
//   let url = _this.attr("url");
//   let ids = _this.attr("data-order-id");

//   if (ids) {
//     let allCheckedOrderID = [];
//     allCheckedOrderID.push(ids);

//     let courier = JSON.parse($("#courierServices").val());

//     let HTML = '<select id="swal-input1" class="swal2-input">';
//     HTML += '<option value="" selected disabled>---Select---</option>';
//     courier.forEach(function (value) {
//       HTML += `<option value="${value._id}" data-email="${value.email}">${value.service_name}</option>`;
//     });
//     HTML +=
//       '</select><input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">';

//     Swal.fire({
//       title: "Select Courier Service",
//       showCancelButton: true,
//       html: HTML,
//       focusConfirm: false,
//       preConfirm: () => {
//         const courierId = document.getElementById("swal-input1").value;
//         const trackingid = document.getElementById("swal-input2").value;

//         if (!courierId) {
//           Swal.showValidationMessage("Please select a courier service");
//         } else if (!trackingid) {
//           Swal.showValidationMessage("Please enter tracking ID");
//         }

//         return { courierId: courierId, trackingid: trackingid };
//       },
//     }).then(async (result) => {
//       if (result.isConfirmed) {
//         let courierEmail = $(
//           `#swal-input1 option[value="${result.value.courierId}"]`
//         ).data("email");
//         let courierServiceName = $(
//           `#swal-input1 option[value="${result.value.courierId}"]`
//         ).text();

//         let f = new FormData();
//         f.set("order_ids", allCheckedOrderID);
//         f.set("status", action);
//         f.set("courier_service", result.value.courierId);
//         f.set("tracking_id", result.value.trackingid);

//         try {
//           const dataResponse = await xhr(f, url);
//           if (dataResponse.status === 1) {
//             showNotifications("success", dataResponse.message);
//             dataTableObj.forEach(function (k) {
//               k.ajax.reload();
//             });
//             const orderDetails = await getOrderDetails(allCheckedOrderID[0]);
//             const orderData = await getOrderData(orderDetails.order_id);
//             const userData = await getUserDetails(orderData.order_userid);

//             // Fetch courier boys by postal code match
//             const matchedCourierBoys = await fetch(
//               `/api/courierService/${result.value.courierId}/${userData.postal_code}`
//             );
//             const matchedBoysData = await matchedCourierBoys.json();

//             if (matchedBoysData && matchedBoysData.length > 0) {
//               const matchedCourierBoy = matchedBoysData[0];

//               await sendEmailToCourier(
//                 matchedCourierBoy.email,
//                 result.value.trackingid,
//                 allCheckedOrderID,
//                 courierServiceName,
//                 orderDetails.order_id,
//                 orderData.order_userid,
//                 userData.email,
//                 userData.postal_code
//               );
//             }
//           } else {
//             showNotifications("error", dataResponse.message);
//           }
//         } catch (error) {
//           console.error("Error in sending order details: ", error);
//           showNotifications(
//             "error",
//             "An error occurred while processing the request."
//           );
//         }
//       }
//     });
//   } else {
//     showNotifications("error", "Order ID is missing");
//   }
// });

$(document).on("click", ".AddTrackingDetail", async function (e) {
  e.preventDefault();
  let _this = $(this);
  let action = _this.attr("action");
  let url = _this.attr("url");
  let ids = _this.attr("data-order-id");

  if (ids) {
    let allCheckedOrderID = [];
    allCheckedOrderID.push(ids);

    // Get order details
    const orderDetails = await getOrderDetails(allCheckedOrderID[0]);
    const orderData = await getOrderData(orderDetails.order_id);
    const userData = await getUserDetails(orderData.order_userid);

    // Fetch courier services
    let courier = JSON.parse($("#courierServices").val());

    let HTML = '<select id="swal-input1" class="swal2-input">';
    HTML += '<option value="" selected disabled>---Select---</option>';

    // Filter courier services based on postal code matching courier boys
    for (const value of courier) {
      const matchedCourierBoys = await fetch(
        `/api/courierService/${value._id}/${userData.postal_code}`
      );
      const matchedBoysData = await matchedCourierBoys.json();

      if (matchedBoysData && matchedBoysData.length > 0) {
        HTML += `<option value="${value._id}" data-email="${value.email}">${value.service_name}</option>`;
      }
    }

    HTML +=
      '</select><input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">';

    Swal.fire({
      title: "Select Courier Service",
      showCancelButton: true,
      html: HTML,
      focusConfirm: false,
      preConfirm: () => {
        const courierId = document.getElementById("swal-input1").value;
        const trackingid = document.getElementById("swal-input2").value;

        if (!courierId) {
          Swal.showValidationMessage("Please select a courier service");
        } else if (!trackingid) {
          Swal.showValidationMessage("Please enter tracking ID");
        }

        return { courierId: courierId, trackingid: trackingid };
      },
    }).then(async (result) => {
      if (result.isConfirmed) {
        let courierEmail = $(
          `#swal-input1 option[value="${result.value.courierId}"]`
        ).data("email");
        let courierServiceName = $(
          `#swal-input1 option[value="${result.value.courierId}"]`
        ).text();

        let f = new FormData();
        f.set("order_ids", allCheckedOrderID);
        f.set("status", action);
        f.set("courier_service", result.value.courierId);
        f.set("tracking_id", result.value.trackingid);

        try {
          const dataResponse = await xhr(f, url);
          if (dataResponse.status === 1) {
            showNotifications("success", dataResponse.message);
            dataTableObj.forEach(function (k) {
              k.ajax.reload();
            });

            const matchedCourierBoys = await fetch(
              `/api/courierService/${result.value.courierId}/${userData.postal_code}`
            );
            const matchedBoysData = await matchedCourierBoys.json();

            if (matchedBoysData && matchedBoysData.length > 0) {
              const matchedCourierBoy = matchedBoysData[0];

              await sendEmailToCourier(
                matchedCourierBoy.email,
                result.value.trackingid,
                allCheckedOrderID,
                courierServiceName,
                orderDetails.order_id,
                orderData.order_userid,
                userData.email,
                userData.postal_code
              );
            }
          } else {
            showNotifications("error", dataResponse.message);
          }
        } catch (error) {
          console.error("Error in sending order details: ", error);
          showNotifications(
            "error",
            "An error occurred while processing the request."
          );
        }
      }
    });
  } else {
    showNotifications("error", "Order ID is missing");
  }
});

async function getOrderDetails(orderId) {
  try {
    const response = await fetch(
      `http://98.130.54.134:3000/api/orders/${orderId}`
    );
    console.log("order id is");

    if (!response.ok) {
      const text = await response.text();
      console.error(`Error fetching order details: ${text}`);
      throw new Error("Error fetching order details.");
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      const orderDetails = await response.json();
      return orderDetails;
    } else {
      throw new Error("Response is not JSON.");
    }
  } catch (error) {
    console.error("Error fetching order details:", error);
    throw error;
  }
}

async function getOrderData(orderUniqueId) {
  try {
    const response = await fetch(
      `http://98.130.54.134:3000/api/ordersId/${orderUniqueId}`
    );
    const orderData = await response.json();
    return orderData;
  } catch (error) {
    console.error("Error fetching order data:", error);
    throw error;
  }
}

async function getUserDetails(userId) {
  try {
    const response = await fetch(
      `http://98.130.54.134:3000/api/users/${userId}`
    );
    const userData = await response.json();
    return userData;
  } catch (error) {
    console.error("Error fetching user details:", error);
    throw error;
  }
}
async function sendEmailToCourier(
  email,
  trackingId,
  orderIds,
  courierServiceName,
  orderId,
  orderUserId,
  userEmail,
  postal_code
) {
  const emailData = {
    to: email,
    subject: "Product to Deliver",
    html: `    
      <p>Hello Deliver Partner (${courierServiceName}),</p>
      <p>The tracking ID for your service is: <strong>${trackingId}</strong></p>
      <p>OrderProduct ID: ${orderIds.join(", ")}</p>
      <p>Order ID: ${orderId}</p>
      <p>Order User ID: ${orderUserId}</p>
      <p>Order User Email: ${userEmail}</p>
      <p>Order User Pin Code: ${postal_code}</p>
      <p>Thank you for your service!</p>
      <p><a href="http://98.130.54.134:3000/orders/markDelivered?orderId=${
        orderIds[0]
      }" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Delivered</a></p>
      <p><a href="http://98.130.54.134:3000/enter-otp?orderId=${
        orderIds[0]
      }" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Enter OTP</a></p>
      <p><a href="http://98.130.54.134:3000/send-otp? =${userEmail}" style="background-color: #008CBA; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Send OTP</a></p>
      <p><a href="http://98.130.54.134:3000/verify-otp?userEmail=${userEmail}" style="background-color: #4CAF50; color: white; padding: 10px 20px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Verify OTP</a></p>
      <p>Best regards,<br>PixaCart</p>
    `,
  };

  try {
    const response = await $.ajax({
      type: "POST",
      url: "/api/send-email",
      data: JSON.stringify(emailData),
      contentType: "application/json",
      dataType: "json",
    });

    if (response.status === 1) {
      showNotifications("success", "Email sent successfully!");
    } else {
      showNotifications("error", "Failed to send email.");
    }
  } catch (error) {
    console.error("Email sending error: ", error);
    showNotifications("error", "An error occurred while sending the email.");
  }
}

function requestOtp(userEmail) {
  $.ajax({
    type: "POST",
    url: "/api/send-otp",
    data: JSON.stringify({ userEmail: userEmail }),
    contentType: "application/json",
    dataType: "json",
    success: function (response) {
      if (response.status === 1) {
        alert("OTP sent successfully!");
      } else {
        alert("Failed to send OTP.");
      }
    },
    error: function (error) {
      console.error("OTP request error: ", error);
      alert("An error occurred while sending the OTP.");
    },
  });
}

$(document).on("click", ".editSpCate", function () {
  let _this = $(this);
  $("#addNewCateBtn").trigger("click");
  $("#exampleModalLabel02").text("Edit Category");
  $("#cate_id").val(_this.attr("data-cate-id"));
  $("#cate_name").val(_this.attr("data-cate-name"));
});

$(document).on("keypress", "#reply_msg", function (event) {
  var keyCode = event.which || event.keyCode;
  if (keyCode == 13) {
    $("#sendReplyBtn").click();
    return false;
  }
});

if ($(".msg-history").length) {
  let showChatHistory = $(".msg-history");
  showChatHistory
    .stop()
    .animate({ scrollTop: showChatHistory[0].scrollHeight }, 1000);
}

$(document).on("click", "#sendReplyBtn", (e) => {
  e.preventDefault();
  let _this = $(e.target);
  let btntxt = _this.html();
  _this.html('<span class="sc_wait_pro">Wait...</span>').prop("disabled", true);
  let form = _this.closest("form");
  checkValidation(form)
    .then(() => {
      let f = new FormData(form[0]);
      f.set("offset", tzoffset());
      xhr(f, form.attr("action"))
        .done((data) => {
          if (data.status == 1) {
            showNotifications("success", data.message);
            if (typeof data.chatHtml != "undefined") {
              $(".msg-history").append(data.chatHtml);
              let showChatHistory = $(".msg-history");
              showChatHistory
                .stop()
                .animate({ scrollTop: showChatHistory[0].scrollHeight }, 1000);
              $("#reply_msg").val("").focus();
            }
          } else if (data.status == 0) {
            showNotifications("error", data.message);
          }
          _this.html(btntxt).prop("disabled", false);
        })
        .fail(() => {
          _this.html(btntxt).prop("disabled", false);
        });
    })
    .catch((mess) => {
      _this.html(btntxt).prop("disabled", false);
      showNotifications("error", mess);
    });
});

$(document).on("click", ".AcceptReturn", async function (e) {
  e.preventDefault();
  let _this = $(this);
  let action = _this.attr("action");
  let url = _this.attr("url");
  let ids = _this.attr("data-order-id");

  if (ids) {
    let allChekedOrderID = [];
    allChekedOrderID.push(ids);

    let courier = JSON.parse($("#courierServices").val());

    let HTML = `<select id="swal-input1" class="swal2-input">`;
    HTML += `<option value="" selected="" disabled="">---Select---</option>`;
    courier.forEach(function (value, key) {
      HTML += ` <option value="${value._id}">${value.courier_name}</option>`;
    });
    HTML += `</select>
              <input id="swal-input2" class="swal2-input" placeholder="Enter Tracking Id">`;

    Swal.fire({
      title: "Enter Return Tracking id",
      showCancelButton: true,
      html: HTML,
      focusConfirm: false,
      preConfirm: () => {
        const courier = document.getElementById("swal-input1").value;
        const trackingid = document.getElementById("swal-input2").value;

        if (!courier) {
          Swal.showValidationMessage(`Please select courier sevice`);
        } else if (!trackingid) {
          Swal.showValidationMessage(`Please enter tracking id`);
        }

        return { courier: courier, trackingid: trackingid };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let f = new FormData();
        f.set("order_ids", allChekedOrderID);
        f.set("status", action);
        f.set("courier_service", result.value.courier);
        f.set("tracking_id", result.value.trackingid);
        xhr(f, url).done((data) => {
          if (data.status == 1) {
            showNotifications("success", data.message);
            dataTableObj.forEach(function (k, v) {
              k.ajax.reload();
            });
          }
        });

        /* Swal.fire(`
                  Login: ${result.value.courier}
                  Password: ${result.value.trackingid}
                  `.trim())*/
      }
    });
  } else {
    showNotifications("error", "Order id is missing");
  }
});

$(document).on("click", ".generateRefund", async function (e) {
  e.preventDefault();
  let _this = $(this);
  let action = _this.attr("action");
  let url = _this.attr("url");
  let ids = _this.attr("data-order-id");

  if (ids) {
    let allChekedOrderID = [];
    allChekedOrderID.push(ids);

    let courier = JSON.parse($("#courierServices").val());

    let HTML = ``;

    HTML += `<input id="swal-input2" class="swal2-input" placeholder="Enter Transaction Id">`;

    Swal.fire({
      title: "Enter Refund Transaction id",
      showCancelButton: true,
      html: HTML,
      focusConfirm: false,
      preConfirm: () => {
        const trackingid = document.getElementById("swal-input2").value;

        if (!trackingid) {
          Swal.showValidationMessage(`Please enter ttransaction id`);
        }

        return { trackingid: trackingid };
      },
    }).then((result) => {
      if (result.isConfirmed) {
        let f = new FormData();
        f.set("order_ids", allChekedOrderID);
        f.set("status", action);
        f.set("tracking_id", result.value.trackingid);
        xhr(f, url).done((data) => {
          if (data.status == 1) {
            showNotifications("success", data.message);
            dataTableObj.forEach(function (k, v) {
              k.ajax.reload();
            });
          }
        });

        /* Swal.fire(`
                  Login: ${result.value.courier}
                  Password: ${result.value.trackingid}
                  `.trim())*/
      }
    });
  } else {
    showNotifications("error", "Order id is missing");
  }
});

$(document).on("click", ".withdrawProcced", function () {
  let _this = $(this);

  let f = new FormData();
  let url = _this.attr("data-url");
  let sellerid = _this.attr("data-seller-id");

  let req_id = _this.attr("data-req-id");
  if (req_id !== undefined) {
    f.append("req_id", req_id);
  }

  f.append("seller_id", sellerid);
  xhr(f, url).done(function (resp) {
    //data = JSON.parse(data);
    if (resp.status == 1) {
      let resData = resp.data;
      $("#withdrawRequestModal").modal();
      $("#outstandig_amt").val(resData.outstanding);
      if (resData.withdrawReq) {
        $("#withdraw_amt").val(resData.withdrawReq.amount);
        $("#withdraw_id").val(resData.withdrawReq._id);
      }
    }
  });
});

$(document).on("click", ".currencyStatus", function () {
  let _this = $(this);

  let f = new FormData();
  let url = _this.attr("data-url");
  let currency_id = _this.attr("data-currency-id");

  f.append("currency_id", currency_id);
  xhr(f, url).done(function (resp) {
    //data = JSON.parse(data);
    if (resp.status == 1) {
      showNotifications("success", resp.message);
      dataTableObj[0].ajax
        .url(base_url + $("table").data("action-url"))
        .clear()
        .draw();
    }
  });
});

function printDiv() {
  var divElements = $("#appendLabelHtml").html();

  //Get the HTML of whole page
  var oldPage = document.body.innerHTML;
  //Reset the page's HTML with div's HTML only
  document.body.innerHTML =
    '<html><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8"><title></title></head><body>' +
    divElements +
    "</body>";
  //Print Page
  window.print();

  //Restore orignal HTML
  document.body.innerHTML = oldPage;
  setTimeout(function () {
    location.reload();
  }, 500);
}

function preview(event) {
  if (event.target.files[0]) {
    previewImg.src = URL.createObjectURL(event.target.files[0]);
    $(".imgArea").show();
  } else {
    previewImg.src = "";
    $(".imgArea").hide();
  }
}

$(document).on("mouseover", ".changeNotiStatus", function () {
  let notiCount = $(this).attr("data-noticount");
  if (notiCount > 0) {
    let url = "dashboard/changeNotiStatus";
    let f = {};
    xhr(f, url, "GET").done(function (resp) {
      if (resp.status == 1) {
        let resData = resp.data;
        $(".changeNotiStatus").attr("data-noticount", resData.notiCount);
        $("#notiCount").text(
          "You have " + resData.notiCount + " new notifications"
        );
        $("#notiBell").removeClass("notification-info");
      }
    });
  }
});

function getNotifications() {
  let url = "dashboard/notifications";
  let f = {};
  xhr(f, url, "GET").done(function (resp) {
    if (resp.status == 1) {
      let resData = resp.data;
      $(".changeNotiStatus").attr("data-noticount", resData.notiCount);
      $("#notiCount").text(
        "You have " + resData.notiCount + " new notifications"
      );
      $("#notiMsg").html(resData.notiList);
      if (resData.notiCount > 0) {
        $("#notiBell").addClass("notification-info");
      }
    }
  });
}
if ($("#notiCount").length) {
  getNotifications();
}

$(document).on("click", ".auto_fill_emailpwd", function () {
  $("#uemail").val($(this).attr("data-email"));
  $("#upwd").val($(this).attr("data-pwd"));
});

$(document).on("change", 'input[type="file"]', function () {
  if ($(this)[0].files.length) {
    var file = $(this)[0].files[0].name;
    if (file !== "") {
      var fileExtension = ["jpeg", "jpg", "png"];
      if (
        $.inArray(
          $(this).val().split(".").pop().toLowerCase(),
          fileExtension
        ) == -1
      ) {
        showNotifications(
          "error",
          "Only '.jpeg','.jpg','.png' formats are allowed."
        );
        this.value = ""; // Clean field
        return false;
      }

      if ($(this)[0].files.length > 5) {
        showNotifications(
          "error",
          "You can upload up to five files at a time."
        );
        this.value = ""; // Clean field
        return false;
      }

      if ($(this).next("label").find(".numberOfFiles").length) {
        $(this)
          .next("label")
          .find(".numberOfFiles")
          .text($(this)[0].files.length + " Files Selected");
      } else {
        $(this).next("label").text(file);
      }
    }
  } else {
    if ($(this).next("label").find(".numberOfFiles").length) {
      $(this).next("label").find(".numberOfFiles").text("");
    } else {
      $(this).next("label").text("Browse Image");
    }
  }
});

$(document).on("focusout change", ".calunitprice", function () {
  calculateUnitPrice();
});

function calculateUnitPrice() {
  let strikePrice = $("#pro_strikeout_price").val();
  let unitPrice = $("#pro_unitprice");
  let discoount = $("#pro_discount").val();
  let type = $("#pro_discount_type").val();
  var uprice = "";

  if (type == "flat") {
    uprice = strikePrice - discoount;
  } else if (type == "percent") {
    uprice = (strikePrice * discoount) / 100;
    uprice = strikePrice - uprice;
  }

  unitPrice.val(uprice);
}

/************Order Table reinitilize on tab button click*************/
$(document).on("click", "li.orderTab", function () {
  let index = $(this).index();
  dataTableObj[index].ajax.reload();
});
/************Order Table reinitilize on tab button click*************/

setTimeout(() => {
  $(".verify_alert").hide();
}, 3000);
