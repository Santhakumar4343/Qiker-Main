const { Router } = require("express");
const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const moment = require("moment");
const UserModel = mongoose.model("users");
const productsVariantsModel = mongoose.model("products_variants");
const categoryModel = mongoose.model("category");
const subCategoryModel = mongoose.model("sub_category");
const brandModel = mongoose.model("brands");
const productsModel = mongoose.model("products");
const ordersModel = mongoose.model("orders");
const orderProducts = mongoose.model("orders_products");
const courierServicesModel = mongoose.model("courier_services");
const courierBoysModel = mongoose.model("courier_boys");
const { validationResult } = require("express-validator");
const notificationsModel = mongoose.model("notifications");
const ordersInvoiceModel = mongoose.model("orders_invoice");
const outstandingsModel = mongoose.model("outstandings");
const currenciesModel = mongoose.model("currencies");
//const API        = require('../controllers/Api');
const helper = require("../helpers/my_helper");
const config = require("../config/config");
const API = require("./Api");

const payModeArr = helper.paymentMode;
const ORDERS = {};

ORDERS.courierServicesOrders = async (req, res) => {
  let targetVisible = 9;
  if (await helper.isAdmin(req)) {
    targetVisible = "";
  }
  let courierServices = await courierServicesModel.find({ status: 1 }).exec();
  res.render("backend/courierServicesOrders", {
    viewTitle: "Orders",
    pageTitle: "Orders",
    courierServices: courierServices,
    targetVisible: targetVisible,
  });
};

ORDERS.courierboyServicesOrders = async (req, res) => {
  let targetVisible = 9;
  if (await helper.isAdmin(req)) {
    targetVisible = "";
  }
  let courierServices = await courierServicesModel.find({ status: 1 }).exec();
  res.render("backend/courierboyServicesOrders", {
    viewTitle: "Orders",
    pageTitle: "Orders",
    courierServices: courierServices,
    targetVisible: targetVisible,
  });
};

ORDERS.orders = async (req, res) => {
  let targetVisible = 9;
  if (await helper.isAdmin(req)) {
    targetVisible = "";
  }
  let courierServices = await courierServicesModel.find({ status: 1 }).exec();
  res.render("backend/orders_list", {
    viewTitle: "Orders",
    pageTitle: "Orders",
    courierServices: courierServices,
    targetVisible: targetVisible,
  });
};
ORDERS.getOrderDetails = async (req, res) => {
  const orderId = req.params.orderId;

  try {
    const order = await ordersModel.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

ORDERS.courier_ServicesOrders = async (req, res) => {
  try {
    let orderStatus = req.params.status;
    const courierServiceId = req.session.user.user_id;

    let query = {
      courier_service: courierServiceId,
      order_status: orderStatus,
    };

    // Array of columns that you want to show in the table
    const columns = ["fullname"];
    const start = parseInt(req.query.start) || 0;
    const dataLimit = parseInt(req.query.length) || 10;

    // Check if global search is enabled and its value is defined
    if (req.query.search && req.query.search.value) {
      const text = req.query.search.value;

      // Apply search on specified columns
      for (let i = 0; i < columns.length; i++) {
        const requestColumn = req.query.columns[i];
        const column = columns[requestColumn.data];

        if (requestColumn.searchable === "true") {
          query[column] = {
            $regex: ".*" + text + ".*",
            $options: "i",
          };
        }
      }
    }

    // Fetch orders based on the query
    const result = await orderProducts
      .find(query)
      .populate("seller_id", "fullname")
      .populate("order_id", "order_uniqueid payment_status payment_mode")
      .populate("order_vid", "pro_subtitle pro_sku")
      .populate({ path: "order_uid", select: "fullname postal_code" })
      .sort({ _id: "desc" })
      .skip(start)
      .limit(dataLimit);

    const totalRecords = await orderProducts.countDocuments(query);
    const filteredRecords = totalRecords; // Total filtered records

    const mytable = {
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: [],
    };

    // Prepare data for response
    if (result.length > 0) {
      let currency_symbol = "$";
      const currencies = await currenciesModel.findOne({ status: 1 });
      if (currencies) {
        currency_symbol = currencies.currency_symbol;
      }

      for (let index = 0; index < result.length; index++) {
        const element = result[index];

        let label = "";
        let track = "";
        let returnBtn = "";
        let refundBtn = "";

        if (element.order_status === 8) {
          returnBtn = `<a href="javascript:;" title="Accept Return" class="AcceptReturn" action="6" url="orders/returnRequestAccept" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
        }

        if (element.order_status === 7) {
          refundBtn = `<a href="javascript:;" title="Generate Refund" class="generateRefund" action="6" url="orders/generateRefund" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
        }

        const invoice = `<a href="javascript:;" title="View Invoice" class="viewInvoice" url="orders/view-invoice" data-invoice-id="${element.invoice_id}"><i class="fas fa-file-invoice"></i></a>`;

        let checkBox = `<input class="checkedOrder" value="${element._id}" id="${element._id}" type="checkbox"> `;
        if (element.order_status === 4) {
          label = `<a href="javascript:;" title="Generate Label" class="generateLabel" url="orders/generateLabel" data-order-id="${element._id}"><i class="fas fa fa-tag"></i></a>`;
          track = `<a href="javascript:;" title="Add Tracking Id" class="AddTrackingDetail" action="5" url="orders/updateOrderStatus" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
          checkBox = "";
        }

        const inArr = [1, 6, 7, 8];
        if (inArr.includes(element.order_status)) {
          checkBox = "";
        }

        let payStatus = "Unpaid";
        if (element.order_id && element.order_id.payment_status === 1) {
          payStatus = "Paid";
        }

        // Fetch courier boy's name based on postal code
        let courierBoyName = "Not Assigned"; // Default value

        // Use 'await' to fetch courier boy details properly
        const courierBoy = await courierBoysModel.findOne({
          courierService: courierServiceId,
          postal_code: element.order_uid.postal_code, // Match user's postal code
        });

        if (courierBoy && courierBoy.fullname) {
          courierBoyName = courierBoy.fullname;
        }

        mytable.data.push([
          checkBox + "" + (start + index + 1), // Row number adjusted here
          element.order_id ? element.order_id.order_uniqueid : "",
          element.order_vid ? element.order_vid.pro_subtitle : "",
          element.order_vid ? element.order_vid.pro_sku : "",
          element.prod_size,
          element.prod_quantity,
          currency_symbol + "" + element.prod_price,
          currency_symbol + "" + element.prod_subtotal,
          element.order_uid ? element.order_uid.fullname : "",
          moment(element.createdAt).format("DD-MMM-YYYY HH:MM"),
          element.seller_id ? element.seller_id.fullname : "",
          `<label class="mb-0 badge badge-${
            helper.lableClass[element.order_status]
          }" title="" data-original-title="Pending">${
            helper.orderStatusLable[element.order_status]
          }</label>`,
          payStatus,
          element.order_id ? element.order_id.payment_mode : "",
          courierBoyName,
          invoice +
            " " +
            label +
            " " +
            track +
            " " +
            returnBtn +
            " " +
            refundBtn,
        ]);
      }

      res.status(200).json(mytable);
    } else {
      res.status(200).json(mytable);
    }
  } catch (err) {
    res.status(401).json({ status: 0, message: "Error: " + err.message });
  }
};

ORDERS.courierboy_ServicesOrders = async (req, res) => {
  try {
    let orderStatus = req.params.status;
    const courierServiceId = req.session.user.courierService;
    const courierBoyPostalCode = req.session.user.postal_code;

    let query = {
      courier_service: courierServiceId,
      order_status: orderStatus,
    };

    // Array of columns that you want to show in the table
    const columns = ["fullname"];
    const start = parseInt(req.query.start) || 0;
    const dataLimit = parseInt(req.query.length) || 10;

    // Check if global search is enabled and its value is defined
    if (req.query.search && req.query.search.value) {
      const text = req.query.search.value;

      // Apply search on specified columns
      for (let i = 0; i < columns.length; i++) {
        const requestColumn = req.query.columns[i];
        const column = columns[requestColumn.data];

        if (requestColumn.searchable === "true") {
          query[column] = {
            $regex: ".*" + text + ".*",
            $options: "i",
          };
        }
      }
    }

    // Fetch orders based on the query and postal code matching
    const result = await orderProducts
      .find(query)
      .populate("seller_id", "fullname")
      .populate("order_id", "order_uniqueid payment_status payment_mode")
      .populate("order_vid", "pro_subtitle pro_sku")
      .populate({ path: "order_uid", select: "fullname postal_code email" }) // Include postal_code from order_uid
      .sort({ _id: "desc" })
      .skip(start)
      .limit(dataLimit);

    // Filter results by matching the courier boy's postal code with the customer's postal code
    const filteredResult = result.filter(
      (order) =>
        order.order_uid && order.order_uid.postal_code === courierBoyPostalCode
    );

    const totalRecords = await orderProducts.countDocuments(query);
    const filteredRecords = filteredResult.length; // Total filtered records

    const mytable = {
      draw: parseInt(req.query.draw) || 1,
      recordsTotal: totalRecords,
      recordsFiltered: filteredRecords,
      data: [],
    };

    // Prepare data for response
    if (filteredResult.length > 0) {
      let currency_symbol = "$";
      const currencies = await currenciesModel.findOne({ status: 1 });
      if (currencies) {
        currency_symbol = currencies.currency_symbol;
      }

      filteredResult.forEach((element, index) => {
        let label = "";
        let track = "";
        let returnBtn = "";
        let refundBtn = "";

        if (element.order_status === 8) {
          returnBtn = `<a href="javascript:;" title="Accept Return" class="AcceptReturn" action="6" url="orders/returnRequestAccept" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
        }

        if (element.order_status === 7) {
          refundBtn = `<a href="javascript:;" title="Generate Refund" class="generateRefund" action="6" url="orders/generateRefund" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
        }

        const invoice = `<a href="javascript:;" title="View Invoice" class="viewInvoice" url="orders/view-invoice" data-invoice-id="${element.invoice_id}"><i class="fas fa-file-invoice"></i></a>`;

        let checkBox = `<input class="checkedOrder" value="${element._id}" id="${element._id}" type="checkbox">`;
        if (element.order_status === 4) {
          label = `<a href="javascript:;" title="Generate Label" class="generateLabel" url="orders/generateLabel" data-order-id="${element._id}"><i class="fas fa fa-tag"></i></a>`;
          track = `<a href="javascript:;" title="Add Tracking Id" class="AddTrackingDetail" action="5" url="orders/updateOrderStatus" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
          checkBox = "";
        }

        const inArr = [1, 6, 7, 8];
        if (inArr.includes(element.order_status)) {
          checkBox = "";
        }

        let payStatus = "Unpaid";
        if (element.order_id && element.order_id.payment_status === 1) {
          payStatus = "Paid";
        }
        // const sendOtpBtn = `<button class="btn btn-secondary send-otp-btn" data-email="${element.order_uid ? element.order_uid.email : ''}" data-toggle="modal" data-target="#otpModal">Send OTP</button>`;
        const sendOtpBtn = `<button class="btn btn-secondary send-otp-btn" data-email="${
          element.order_uid ? element.order_uid.email : ""
        }" data-order-id="${
          element._id
        }" data-toggle="modal" data-target="#otpModal">Send OTP</button>`;

        mytable.data.push([
          checkBox + "" + (start + index + 1), // Row number adjusted here
          element.order_id ? element.order_id.order_uniqueid : "",
          element.order_vid ? element.order_vid.pro_subtitle : "",
          element.order_vid ? element.order_vid.pro_sku : "",
          element.prod_size,
          element.prod_quantity,
          currency_symbol + "" + element.prod_price,
          currency_symbol + "" + element.prod_subtotal,
          element.order_uid ? element.order_uid.fullname : "",
          element.order_uid ? element.order_uid.email : "",

          moment(element.createdAt).format("DD-MMM-YYYY HH:MM"),
          element.seller_id ? element.seller_id.fullname : "",
          `<label class="mb-0 badge badge-${
            helper.lableClass[element.order_status]
          }" title="" data-original-title="Pending">${
            helper.orderStatusLable[element.order_status]
          }</label>`,
          payStatus,
          element.order_id ? element.order_id.payment_mode : "",
          invoice +
            " " +
            label +
            " " +
            track +
            " " +
            returnBtn +
            " " +
            refundBtn,
          sendOtpBtn,
        ]);
      });

      res.status(200).json(mytable);
    } else {
      res.status(200).json(mytable);
    }
  } catch (err) {
    res.status(401).json({ status: 0, message: "Error: " + err.message });
  }
};

// ORDERS.courierboy_ServicesOrders = async (req, res) => {
//   try {
//     const courierBoyId = req.session.user.user_id; // Fetch courier boy ID from session

//     // Fetch orders assigned to this courier boy where order_id is available in the orderProduct schema
//     let query = {
//       order_courier_boy: courierBoyId, // Match orders by courier boy ID
//       order_id: { $exists: true }, // Ensure the order_id field exists
//     };

//     const columns = ["fullname"];
//     const start = parseInt(req.query.start) || 0;
//     const dataLimit = parseInt(req.query.length) || 10;

//     // Fetch orders based on the query
//     const result = await orderProducts
//       .find(query)
//       .populate("seller_id", "fullname")
//       .populate("order_id", "order_uniqueid payment_status payment_mode")
//       .populate("order_vid", "pro_subtitle pro_sku")
//       .populate({ path: "order_uid", select: "fullname postal_code email" })
//       .sort({ _id: "desc" })
//       .skip(start)
//       .limit(dataLimit);

//     const totalRecords = await orderProducts.countDocuments(query);
//     const filteredRecords = result.length;

//     const mytable = {
//       draw: parseInt(req.query.draw) || 1,
//       recordsTotal: totalRecords,
//       recordsFiltered: filteredRecords,
//       data: [],
//     };

//     if (result.length > 0) {
//       let currency_symbol = "$";
//       const currencies = await currenciesModel.findOne({ status: 1 });
//       if (currencies) {
//         currency_symbol = currencies.currency_symbol;
//       }

//       result.forEach((element, index) => {
//         let label = "";
//         let track = "";
//         let returnBtn = "";
//         let refundBtn = "";

//         if (element.order_status === 8) {
//           returnBtn = `<a href="javascript:;" title="Accept Return" class="AcceptReturn" action="6" url="orders/returnRequestAccept" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
//         }

//         if (element.order_status === 7) {
//           refundBtn = `<a href="javascript:;" title="Generate Refund" class="generateRefund" action="6" url="orders/generateRefund" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
//         }

//         const invoice = `<a href="javascript:;" title="View Invoice" class="viewInvoice" url="orders/view-invoice" data-invoice-id="${element.invoice_id}"><i class="fas fa-file-invoice"></i></a>`;

//         let checkBox = `<input class="checkedOrder" value="${element._id}" id="${element._id}" type="checkbox">`;
//         if (element.order_status === 4) {
//           label = `<a href="javascript:;" title="Generate Label" class="generateLabel" url="orders/generateLabel" data-order-id="${element._id}"><i class="fas fa fa-tag"></i></a>`;
//           track = `<a href="javascript:;" title="Add Tracking Id" class="AddTrackingDetail" action="5" url="orders/updateOrderStatus" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
//           checkBox = "";
//         }

//         const inArr = [1, 6, 7, 8];
//         if (inArr.includes(element.order_status)) {
//           checkBox = "";
//         }

//         let payStatus = "Unpaid";
//         if (element.order_id && element.order_id.payment_status === 1) {
//           payStatus = "Paid";
//         }

//         const sendOtpBtn = `<button class="btn btn-secondary send-otp-btn" data-email="${
//           element.order_uid ? element.order_uid.email : ""
//         }" data-order-id="${
//           element._id
//         }" data-toggle="modal" data-target="#otpModal">Send OTP</button>`;

//         mytable.data.push([
//           checkBox + "" + (start + index + 1),
//           element.order_id ? element.order_id.order_uniqueid : "",
//           element.order_vid ? element.order_vid.pro_subtitle : "",
//           element.order_vid ? element.order_vid.pro_sku : "",
//           element.prod_size,
//           element.prod_quantity,
//           currency_symbol + "" + element.prod_price,
//           currency_symbol + "" + element.prod_subtotal,
//           element.order_uid ? element.order_uid.fullname : "",
//           element.order_uid ? element.order_uid.email : "",
//           moment(element.createdAt).format("DD-MMM-YYYY HH:mm"),
//           element.seller_id ? element.seller_id.fullname : "",
//           `<label class="mb-0 badge badge-${
//             helper.lableClass[element.order_status]
//           }" title="" data-original-title="Pending">${
//             helper.orderStatusLable[element.order_status]
//           }</label>`,
//           payStatus,
//           element.order_id ? element.order_id.payment_mode : "",
//           invoice +
//             " " +
//             label +
//             " " +
//             track +
//             " " +
//             returnBtn +
//             " " +
//             refundBtn,
//           sendOtpBtn,
//         ]);
//       });

//       res.status(200).json(mytable);
//     } else {
//       res.status(200).json(mytable);
//     }
//   } catch (err) {
//     res.status(401).json({ status: 0, message: "Error: " + err.message });
//   }
// };

ORDERS.getOrderProductDetails = async (req, res) => {
  const orderId = req.params.orderId; // Extract order ID from request params

  try {
    const order = await orderProducts.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Optionally, you may want to populate related fields like customer_name if it's a reference
    // await order.populate('order_userid', 'customer_name').execPopulate();

    res.status(200).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

ORDERS.orderTransactions = async (req, res) => {
  let seller_id = "";
  if (req.params.seller_id) {
    seller_id = req.params.seller_id;
  }
  res.render("backend/order_transaction", {
    viewTitle: "Orders Transactions",
    pageTitle: "Orders Transactions",
    seller_id: seller_id,
  });
};

ORDERS.sellerOrdersList = async (req, res) => {
  try {
    let orderStatus = req.params.status;
    let query = { seller_id: await helper.uid(req) };
    if (await helper.isAdmin(req)) {
      query = {};
    }

    query.order_status = orderStatus;

    // array of columns that you want to show in table
    columns = ["fullname"];
    var start = req.query.start;
    var dataLimit = req.query.length;
    // check if global search is enabled and it's value is defined
    if (
      typeof req.query.search !== "undefined" &&
      req.query.search.value != ""
    ) {
      // get global search value
      var text = req.query.search.value;

      for (var i = 0; i < columns.length; i++) {
        //req.query.columns
        requestColumn = req.query.columns[i];

        column = columns[requestColumn.data];

        // if search is enabled for that particular field then create query
        if (requestColumn.searchable == "true") {
          query[column] = {
            $regex: ".*" + text + ".*",
            $options: "i",
          };
        }
      }
    }
    await orderProducts
      .find(query)
      .populate("seller_id", "fullname")
      .populate("order_id", "order_uniqueid payment_status payment_mode")
      .populate("order_vid", "pro_subtitle pro_sku")
      .populate({ path: "order_uid", match: query, select: "fullname " })
      .populate("courier_service", "service_name")
      .sort({ "group.nome": "asc" })
      .skip(start)
      .limit(dataLimit)
      .sort({ _id: "desc" })
      .then(async (result) => {
        var mytable = {
          draw: req.query.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        };

        mytable.recordsTotal = await orderProducts.countDocuments(query);
        mytable.recordsFiltered = await orderProducts.countDocuments(query);

        if (result.length > 0) {
          //  console.log(result);
          let currency_symbol = "$";
          let currencies = await currenciesModel.findOne({ status: 1 });
          if (currencies) {
            currency_symbol = currencies.currency_symbol;
          }
          result.forEach(function (element, key) {
            //if(element.order_uid){
            let lable = "";
            let track = "";
            let returnBtn = "";
            let refundBtn = "";
            if (element.order_status == 8) {
              returnBtn = `<a href="javascript:;" title="Accept Return" class="AcceptReturn" action="6"  url="orders/returnRequestAccept" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
            }

            if (element.order_status == 7) {
              refundBtn = `<a  href="javascript:;" title="Generete Refund" class="generateRefund" action="6"  url="orders/generateRefund" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
            }

            let invoice = `<a href="javascript:;" title="View Invoice" class="viewInvoice" url="orders/view-invoice" data-invoice-id="${element.invoice_id}"><i class="fas fa-file-invoice"></i></a>`;

            let checkBox = `<input class="checkedOrder" value="${element._id}" id="${element._id}" type="checkbox"> `;
            if (element.order_status == 4) {
              lable = `<a href="javascript:;" title="Generate Lable" class="generateLable" url="orders/generateLabel" data-order-id="${element._id}"><i class="fas fa fa-tag"></i></a>`;
              track = `<a href="javascript:;" title="Add Tracking Id" class="AddTrackingDetail" action="5"  url="orders/updateOrderStatus" data-order-id="${element._id}"><i class="fas fa-map-marker"></i></a>`;
              checkBox = "";
            }
            const inArr = [1, 6, 7, 8];
            if (inArr.includes(element.order_status)) {
              checkBox = "";
            }
            let payStatus = "Unpaid";
            if (element.order_id && element.order_id.payment_status == 1) {
              payStatus = "Paid";
            }

            mytable.data[key] = [
              checkBox + "" + ++start,
              element.order_id ? element.order_id.order_uniqueid : "",
              element.order_vid ? element.order_vid.pro_subtitle : "",
              element.order_vid ? element.order_vid.pro_sku : "",
              element.prod_size,
              element.prod_quantity,
              currency_symbol + "" + element.prod_price,
              currency_symbol + "" + element.prod_subtotal,
              element.order_uid ? element.order_uid.fullname : "",
              moment(element.createdAt).format("DD-MMM-YYYY HH:MM"),
              element.seller_id ? element.seller_id.fullname : "",
              `<label class="mb-0 badge badge-${
                helper.lableClass[element.order_status]
              }" title="" data-original-title="Pending">${
                helper.orderStatusLable[element.order_status]
              }</label>`,
              payStatus,
              element.order_id ? element.order_id.payment_mode : "",
              element.order_status == 1 || element.order_status == 5
                ? element.courier_service
                  ? element.courier_service.service_name
                  : "N/A"
                : invoice +
                  " " +
                  lable +
                  " " +
                  track +
                  " " +
                  returnBtn +
                  " " +
                  refundBtn,
              invoice +
                " " +
                lable +
                " " +
                track +
                " " +
                returnBtn +
                " " +
                refundBtn,
            ];
            //}
          });

          res.status(200).json(mytable);
        } else {
          res.status(200).json(mytable);
        }
      });
  } catch (err) {
    res.status(401).json({ status: 0, message: "error " + err });
  }
};

ORDERS.ordersList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["customer_name"];
    var start = req.query.start;
    var dataLimit = req.query.length;
    // check if global search is enabled and it's value is defined
    if (
      typeof req.query.search !== "undefined" &&
      req.query.search.value != ""
    ) {
      // get global search value
      var text = req.query.search.value;

      for (var i = 0; i < req.query.columns.length; i++) {
        requestColumn = req.query.columns[i];
        column = columns[requestColumn.data];

        // if search is enabled for that particular field then create query
        if (requestColumn.searchable == "true") {
          query[column] = {
            $regex: text,
          };
        }
      }
    }
    await ordersModel
      .find(query)
      .skip(start)
      .limit(dataLimit)
      .sort({ _id: "desc" })
      .then(async (result) => {
        var mytable = {
          draw: req.query.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        };

        mytable.recordsTotal = await ordersModel.countDocuments();
        mytable.recordsFiltered = await ordersModel.countDocuments(query);

        if (result.length > 0) {
          result.forEach(function (element, key) {
            mytable.data[key] = [
              ++start,
              element._id,
              element.order_date,
              element.customer_name,
              element.order_amount,
              element.paymet_status,
              element.order_status,
              `<a href="/orders/edit-order/${element._id}" title="Edit" class="editOrder"><i class="fas fa-edit"></i></a>`,
            ];
          });

          res.status(200).json(mytable);
        } else {
          res.status(200).json(mytable);
        }
      });
  } catch (err) {
    res.status(401).json({ status: 0, message: "error " + err });
  }
};

ORDERS.markOrderAsDelivered = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    if (!orderId) {
      res.status(400).json({ status: 0, message: "Order ID is missing." });
      return;
    }

    const order = await orderProducts.findOne({ _id: orderId });
    if (!order) {
      res.status(404).json({ status: 0, message: "Order not found." });
      return;
    }

    // Update order status to delivered
    order.trackingDetails.delivered = new Date();
    order.order_status = 1; // Assuming 1 is the status code for delivered
    await order.save();

    res.json({ status: 1, message: "Order marked as delivered successfully." });
  } catch (err) {
    res.status(500).json({ status: 0, message: "Error: " + err.message });
  }
};
ORDERS.updateOrderStatus = async (req, res) => {
  try {
    if (!req.body.order_ids) {
      res.json({
        status: 0,
        message: "Order id is missing.",
      });
      return;
    } else if (!req.body.status) {
      res.json({
        status: 0,
        message: "status value is missing.",
      });
      return;
    }

    let ids = req.body.order_ids;
    const idsArr = ids.split(",");
    let orderStatus = req.body.status;
    let updateData = {};
    updateData.order_status = orderStatus;
    updateData.cancel_reason = null; // 6 = cancel

    if (req.body.tracking_id) {
      updateData.order_tracking_id = req.body.tracking_id;
    }

    if (req.body.courier_service) {
      updateData.courier_service = req.body.courier_service;
    }
    let cancelingCharge = 0; // in percent
    let cancelCharge = await helper.getWebSetting("cancellation_charges");
    if (cancelCharge) {
      cancelingCharge = cancelCharge;
    }

    let salesCommision = 0;
    let saleCommi = await helper.getWebSetting("sales_commission");
    if (saleCommi) {
      salesCommision = saleCommi;
    }

    for (const id of idsArr) {
      let orderDetails = await orderProducts
        .findOne({ _id: id })
        .populate("order_id", "payment_mode")
        .populate("order_vid", "pro_subtitle");
      if (orderDetails) {
        updateData.trackingDetails = orderDetails.trackingDetails;

        if (orderStatus == 1) {
          //orderStatus = 1 for delivered

          updateData.trackingDetails.delivered = new Date();
          console.log(orderDetails.order_id.payment_mode);
          if (orderDetails.order_id.payment_mode == "COD") {
            let totalAmt = orderDetails.prod_subtotal;
            let debitCommission = (
              (parseFloat(totalAmt) * parseFloat(salesCommision)) /
              100
            ).toFixed(2);

            let commission = {
              maine_orderid: orderDetails.order_id._id,
              invoice_id: orderDetails.invoice_id,
              sub_orderid: orderDetails._id,
              seller_id: orderDetails.seller_id,
              debit: debitCommission,
              credit: 0,
              entry_againts: 4, // 4 = Sales Commision
              remark: "Sales Commision",
              status: 1,
            };
            await helper.insertOutstanding(commission);

            let subTotalAmt =
              parseFloat(totalAmt) - parseFloat(debitCommission);

            let outstanding = {
              maine_orderid: orderDetails.order_id._id,
              invoice_id: orderDetails.invoice_id,
              sub_orderid: orderDetails._id,
              seller_id: orderDetails.seller_id,
              debit: 0,
              credit: subTotalAmt,
              entry_againts: 1, // 1 = new order
              remark: "New Order",
              status: 1,
            };
            await helper.insertOutstanding(outstanding);
            updateData.payment_status = 1;
          }
        } else if (orderStatus == 3) {
          //orderStatus = 3 for confirmed

          updateData.trackingDetails.confirmed = new Date();
        } else if (orderStatus == 4) {
          // orderStatus = 4 for RTD
          updateData.trackingDetails.readytoDispatch = new Date();

          // Retrieve the courier service ID and customer's postal code from the order details
          const user = await UserModel.findById(orderDetails.order_uid);

          try {
            // Fetch the list of courier boys for the customer's postal code
            const response = await fetch(
              `http://98.130.54.134:3000/api/courierBoy/${user.postal_code}`
            );
            const courierData = await response.json();

            if (courierData.status === 1 && courierData.data.length > 0) {
              const matchedCourierBoy = courierData.data[0]; // Get the first matched courier boy
              const courierEmail = matchedCourierBoy.email;
              updateData.order_courier_boy = matchedCourierBoy._id;

              await helper.sendEmailToCourierBoy({
                email: courierEmail,
                orderId: orderDetails.order_id._id,
                trackingId: req.body.tracking_id,
                orderDetails: {
                  product: orderDetails.order_vid.pro_subtitle,
                  size: orderDetails.prod_size,
                  quantity: orderDetails.prod_quantity,
                },
              });
              // updateData.order_status = 5; // Set status to dispatched
              // updateData.trackingDetails.dispatched = new Date();
              console.log(`Email sent to courier boy at ${courierEmail}`);
            } else {
              console.log(
                "No courier boys found for the customer's postal code."
              );
            }
          } catch (error) {
            console.error("Error sending email to courier boy:", error);
          }
        } else if (orderStatus == 5) {
          updateData.trackingDetails.dispatched = new Date();
        } else if (
          orderStatus == 6 &&
          orderDetails.order_id.payment_mode == "COD"
        ) {
          //payment_mode = 1 for COD & orderStatus = 6 for canceled

          updateData.trackingDetails.canceled = new Date();
          updateData.cancel_reason = "Canceled By Seller";

          await helper.deductInventory(
            orderDetails.order_vid,
            orderDetails.prod_quantity
          );

          await helper.deductSizeInventory(
            orderDetails.order_vid,
            orderDetails.prod_size,
            orderDetails.prod_quantity
          );

          let totalAmt = orderDetails.prod_subtotal;
          let debitCharge = (
            (parseFloat(totalAmt) * parseFloat(cancelingCharge)) /
            100
          ).toFixed(2);

          let outstanding = {
            maine_orderid: orderDetails.order_id._id,
            invoice_id: orderDetails.invoice_id,
            sub_orderid: orderDetails._id,
            seller_id: orderDetails.seller_id,
            debit: debitCharge,
            credit: 0,
            entry_againts: 3, // 3 = Cancellation Charges
            remark: "Canceling Charge",
            status: 1,
          };
          await helper.insertOutstanding(outstanding);
        } else if (
          orderStatus == 6 &&
          payModeArr.includes(orderDetails.order_id.payment_mode)
        ) {
          //payment_mode = 2 for RAZORPAY & orderStatus = 6 for canceled

          updateData.trackingDetails.refund_requested = new Date();
          updateData.order_status = 7;
          updateData.cancel_reason = "Canceled By Seller";

          await helper.deductInventory(
            orderDetails.order_vid,
            orderDetails.prod_quantity
          );
          await helper.deductSizeInventory(
            orderDetails.order_vid,
            orderDetails.prod_size,
            orderDetails.prod_quantity
          );

          let totalAmt = orderDetails.prod_subtotal;
          let debitCharge = (
            (parseFloat(totalAmt) * parseFloat(cancelingCharge)) /
            100
          ).toFixed(2);

          let outstanding = {
            maine_orderid: orderDetails.order_id._id,
            invoice_id: orderDetails.invoice_id,
            sub_orderid: orderDetails._id,
            seller_id: orderDetails.seller_id,
            debit: debitCharge,
            credit: 0,
            entry_againts: 3, // 3 = Cancellation Charges
            remark: "Canceling Charge",
            status: 1,
          };
          await helper.insertOutstanding(outstanding);
        }
        try {
          await orderProducts
            .updateOne({ _id: id }, updateData, { new: true })
            .then(async (result) => {
              let insertNoti = new notificationsModel({
                noti_status: orderStatus,
                noti_type: 1,
                from_user: orderDetails.seller_id,
                to_user: orderDetails.order_uid,
                reference_id: orderDetails._id,
              });

              insertNoti.save();
              let token = await helper.getUserDetails(
                orderDetails.order_uid,
                "firebase_token"
              );

              let notiMsg = {
                title: orderDetails.order_vid.pro_subtitle, //'Order '+ helper.orderStatusLable[orderStatus],
                image: await helper.getVariantSingleImage(
                  orderDetails.order_vid
                ),
                body: await helper.getNotiMsg(orderStatus, (type = 1)), // type 1 for order
              };
              await helper.sendNotification(notiMsg, token);
              try {
                const user = await UserModel.findById(orderDetails.order_uid);
                const seller = await UserModel.findById(orderDetails.seller_id);
                let variant = await productsVariantsModel.findOne({
                  _id: orderDetails.order_vid,
                });

                if (!variant) {
                  throw new Error("Variant not found");
                }

                const findArrey = variant.prod_sizes;
                const findStrikeOutPrice = findArrey.find(
                  (e) => e.size === orderDetails.prod_size
                );

                if (!findStrikeOutPrice) {
                  throw new Error(
                    "Strike out price not found for the given size"
                  );
                }
                const ordersid = orderDetails.order_id._id.toString(); // Extract the ID and convert to string

                const updatedTrackingDetail = Object.entries(
                  orderDetails.trackingDetails
                )
                  .filter(
                    ([key, value]) =>
                      value &&
                      new Date(value) > new Date(orderDetails.createdAt)
                  )
                  .reduce((acc, [key, value]) => ({ [key]: value }), {});

                // Extract the key name (e.g., 'readytoDispatch')
                const updatedStatus = Object.keys(updatedTrackingDetail)[0];

                await helper.sendEmailForConfirmation(
                  user.email,
                  user.fullname,
                  ordersid,
                  orderDetails.order_pid,
                  variant.pro_subtitle,
                  notiMsg.image,
                  orderDetails.prod_size,
                  orderDetails.prod_quantity,
                  findStrikeOutPrice.strikePrice,
                  findStrikeOutPrice.discount,
                  orderDetails.prod_price,
                  orderDetails.prod_subtotal,
                  updatedStatus // Pass tracking details here
                );

                await helper.sendEmailForConfirmation(
                  seller.email,
                  seller.fullname,
                  ordersid,
                  orderDetails.order_pid,
                  variant.pro_subtitle,
                  notiMsg.image,
                  orderDetails.prod_size,
                  orderDetails.prod_quantity,
                  findStrikeOutPrice.strikePrice,
                  findStrikeOutPrice.discount,
                  orderDetails.prod_price,
                  orderDetails.prod_subtotal,
                  updatedStatus // Pass tracking details here
                );
              } catch (err) {
                console.error("Error during email sending:", err.message);
                // You can also send an error response or handle the error in any other way you'd like
                res.json({
                  status: 0,
                  message: "Error during email sending: " + err.message,
                });
              }
            })
            .catch((err) => {
              res.json({
                status: 0,
                message: "Something went wrong. " + err.message,
                data: [],
              });
            });
        } catch (err) {
          res.json({ status: 0, message: "error " + err.message });
        }
      }
    }
    res.send({
      status: 1,
      message: "Order status updated Successfully.",
      data: [],
    });
  } catch (err) {
    res.json({ status: 0, message: "error " + err.message });
  }
};

ORDERS.returnRequestAccept = async (req, res) => {
  try {
    if (!req.body.order_ids) {
      res.json({
        status: 0,
        message: "Order id is missing.",
      });
      return;
    } else if (!req.body.status) {
      res.json({
        status: 0,
        message: "status value is missing.",
      });
      return;
    }

    let ids = req.body.order_ids;
    const idsArr = ids.split(",");
    let orderStatus = req.body.status;
    let updateData = {};
    updateData.order_status = orderStatus;
    let returnDetails = {};
    if (req.body.tracking_id) {
      returnDetails.return_tracking_id = req.body.tracking_id;
    }

    if (req.body.courier_service) {
      returnDetails.courier_service = req.body.courier_service;
    }

    updateData.returnDetails = returnDetails;

    for (const id of idsArr) {
      let orderDetails = await orderProducts
        .findOne({ _id: id })
        .populate("order_id", "payment_mode payment_status")
        .populate("order_vid", "pro_subtitle");
      if (orderDetails) {
        updateData.trackingDetails = orderDetails.trackingDetails;

        if (
          orderStatus == 6 &&
          orderDetails.order_id.payment_mode == "COD" &&
          orderDetails.order_id.payment_status == 2
        ) {
          //payment_mode = 1 for COD and payment_status = 2 unpaid
          updateData.trackingDetails.canceled = new Date();
        } else if (
          orderStatus == 6 &&
          orderDetails.order_id.payment_mode == "COD" &&
          orderDetails.order_id.payment_status == 1
        ) {
          //payment_mode = 1 for COD and payment_status = 1 paid
          updateData.trackingDetails.refund_requested = new Date();
          updateData.order_status = 7;
        } else if (
          orderStatus == 6 &&
          payModeArr.includes(orderDetails.order_id.payment_mode)
        ) {
          //payment_mode = 2 for RAZORPAY
          updateData.trackingDetails.refund_requested = new Date();
          updateData.order_status = 7;
        }

        await helper.deductInventory(
          orderDetails.order_vid,
          orderDetails.prod_quantity
        );
        await helper.deductSizeInventory(
          orderDetails.order_vid,
          orderDetails.prod_size,
          orderDetails.prod_quantity
        );

        await orderProducts
          .findOneAndUpdate({ _id: id }, updateData, { new: true })
          .then(async (result) => {
            let insertNoti = new notificationsModel({
              noti_status: orderStatus,
              noti_type: 1,
              from_user: orderDetails.seller_id,
              to_user: orderDetails.order_uid,
              reference_id: orderDetails._id,
            });

            insertNoti.save();
            let token = await helper.getUserDetails(
              orderDetails.order_uid,
              "firebase_token"
            );
            let notiMsg = {
              title: orderDetails.order_vid.pro_subtitle, //'Order '+ helper.orderStatusLable[orderStatus],
              image: await helper.getVariantSingleImage(orderDetails.order_vid),
              body: await helper.getNotiMsg(orderStatus, (type = 1)), // type 1 for order
            };

            await helper.sendNotification(notiMsg, token);
          })
          .catch((err) => {
            res.json({
              status: 0,
              message:
                "Something went wrong order cancel requested. " + err.message,
              data: [],
            });
          });
      }
    }
    res.send({
      status: 1,
      message: "Order status updated Successfully.",
      data: [],
    });
  } catch (err) {
    res.status(401).json({ status: 0, message: "error " + err.message });
  }
};

ORDERS.generateRefund = async (req, res) => {
  try {
    if (!req.body.order_ids) {
      res.json({
        status: 0,
        message: "Order id is missing.",
      });
      return;
    } else if (!req.body.status) {
      res.json({
        status: 0,
        message: "status value is missing.",
      });
      return;
    }

    let ids = req.body.order_ids;
    const idsArr = ids.split(",");
    let orderStatus = req.body.status;
    let updateData = {};
    updateData.order_status = orderStatus;
    for (const id of idsArr) {
      let orderDetails = await orderProducts
        .findOne({ _id: id })
        .populate("order_id", "payment_mode payment_status")
        .populate("order_vid", "pro_subtitle");
      if (orderDetails) {
        updateData.trackingDetails = orderDetails.trackingDetails;
        if (orderStatus == 6) {
          //orderStatus = 6 for refund success
          updateData.trackingDetails.canceled = new Date();
          updateData.trackingDetails.refund_success = new Date();

          let outstanding = {
            maine_orderid: orderDetails.order_id._id,
            invoice_id: orderDetails.invoice_id,
            sub_orderid: orderDetails._id,
            seller_id: orderDetails.seller_id,
            debit: orderDetails.prod_subtotal,
            credit: 0,
            entry_againts: 2, // 2 = refund
            remark: orderDetails.cancel_reason,
            status: 1,
          };
          await helper.insertOutstanding(outstanding);
        }

        await orderProducts
          .findOneAndUpdate({ _id: id }, updateData, { new: true })
          .then(async (result) => {
            let insertNoti = new notificationsModel({
              noti_status: orderStatus,
              noti_type: 1,
              from_user: orderDetails.seller_id,
              to_user: orderDetails.order_uid,
              reference_id: orderDetails._id,
            });

            insertNoti.save();
            let token = await helper.getUserDetails(
              orderDetails.order_uid,
              "firebase_token"
            );
            let notiMsg = {
              title: orderDetails.order_vid.pro_subtitle, //'Order '+ helper.orderStatusLable[orderStatus],
              image: await helper.getVariantSingleImage(orderDetails.order_vid),
              body: await helper.getNotiMsg(orderStatus, (type = 1)), // type 1 for order
            };

            await helper.sendNotification(notiMsg, token);
          })
          .catch((err) => {
            res.json({
              status: 0,
              message:
                "Something went wrong order cancel requested. " + err.message,
              data: [],
            });
          });
      }
    }
    res.send({
      status: 1,
      message: "Order status updated Successfully.",
      data: [],
    });
  } catch (err) {
    res.status(401).json({ status: 0, message: "error " + err.message });
  }
};

ORDERS.generateLabel = async (req, res) => {
  if (!req.body.order_ids) {
    res.json({
      status: 0,
      message: "Order id is missing.",
    });
    return;
  }
  let ids = req.body.order_ids;
  const idsArr = ids.split(",");
  let label = "";
  let webImages = await helper.getWebSetting("web_images");
  let label_logo = config.DEFAULT_LOGO;
  if (webImages && webImages.logo) {
    label_logo = `/uploads/webimages/${webImages.logo}`;
  }

  let currency_symbol = "$";
  let currencies = await currenciesModel.findOne({ status: 1 });
  if (currencies) {
    currency_symbol = currencies.currency_symbol;
  }

  for (const id of idsArr) {
    await orderProducts
      .findOne({ _id: id })
      .populate("seller_id", "fullname address city country postal_code gst_no")
      .populate("order_uid", "fullname address city country state postal_code")
      .populate("order_id", "order_uniqueid shipping_address billing_address")
      .populate("order_vid", "pro_subtitle")
      .then(async (result) => {
        if (result) {
          let country = result.order_uid.country
            ? result.order_uid.country
            : "";
          let state = result.order_uid.state ? result.order_uid.state : "";
          let city = result.order_uid.city ? result.order_uid.city : "";
          let postal_code = result.order_uid.postal_code
            ? result.order_uid.postal_code
            : "";

          label += `<div class="ecom_lp_wrap">
                    <div class="ecom_lp_inner">
                        <div class="ecom_lp_logoW">
                            <div class="text-center">
                                <img src="${label_logo}" alt="logo">
                            </div>                            
                        </div>
                        <div class="ecom_lp_addresWrap">
                            <div class="ecom_lp_addresL">
                                <div class="ecom_lp_addresHW">
                                    <div class="ecom_lp_addresHWL">
                                        <h2 class="ecom_lp_heading primary-color">Seller Address:</h2>
                                    </div>                                    
                                    <div class="ecom_lp_addresHWR">
                                        <h2 class="ecom_lp_ttl">${result.seller_id.fullname}</h2>
                                        <p class="ecom_lp_p">${result.seller_id.address}</p>
                                        <p class="ecom_lp_p">${result.seller_id.postal_code}, ${result.seller_id.city}, ${result.seller_id.country}</p>
                                    </div>
                                </div>
                            </div>
                            <div class="ecom_lp_addresR">
                                <div class="ecom_lp_addresHW">
                                    <div class="ecom_lp_addresHWL">
                                        <h2 class="ecom_lp_heading primary-color">Buyer Address:</h2>
                                    </div>                                    
                                    <div class="ecom_lp_addresHWR">
                                        <h2 class="ecom_lp_ttl">${result.order_uid.fullname}</h2>
                                        <p class="ecom_lp_p">${result.order_id.shipping_address}</p>
                                        <p>${country} ${state} ${city} ${postal_code}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="ecom_lp_orderWrap">                            
                            <div class="ecom_lp_addresHW">
                                <div class="ecom_lp_addresHWL">
                                    <h2 class="ecom_lp_heading primary-color">Order Number:</h2>
                                </div>                                    
                                <div class="ecom_lp_addresHWR">
                                    <p class="ecom_lp_p">${result.order_id.order_uniqueid}</p>
                                </div>
                            </div>
                            <div class="ecom_lp_addresHW">
                                <div class="ecom_lp_addresHWL">
                                    <h2 class="ecom_lp_heading primary-color">Invoice Number:</h2>
                                </div>                                    
                                <div class="ecom_lp_addresHWR">
                                    <p class="ecom_lp_p">${result.prod_unique_id}</p>
                                </div>
                            </div>`;
          if (result.seller_id.gst_no) {
            label += `<div class="ecom_lp_addresHW">
                                            <div class="ecom_lp_addresHWL">
                                                <h2 class="ecom_lp_heading primary-color">GST Number:</h2>
                                            </div>                                    
                                            <div class="ecom_lp_addresHWR">
                                                <p class="ecom_lp_p">${result.seller_id.gst_no}</p>
                                            </div>
                                        </div>`;
          }
          label += `</div>
                        <div class="ecom_lp_tbleWrap">                            
                            <table class="table" cellspacing="0" cellpadding="10">
                                <tbody>
                                <tr>
                                  <th class="first">Products</th>
                                  <th class="first">Quantity</th>
                                  <th class="first">Price</th>
                                </tr>
                                <tr>
                                  <td>${result.order_vid.pro_subtitle}</td>
                                  <td>${result.prod_quantity}</td>
                                  <td>${currency_symbol}${result.prod_price}</td>
                                </tr>
                                </tbody>
                            </table>
                        </div>
                        <div class="ecom_lp_bottmWrap">                            
                            <div class="text-right">
                                <p class="ecom_lp_p">Ordered Through</p>
                                <img src="${label_logo}" alt="logo" width="100px">
                            </div> 
                        </div>
                    </div>              
                </div>`;
        }
      });
  }
  res.send({
    status: 1,
    message: "Label generated Successfully. Please print label.",
    data: label,
  });
};

ORDERS.getInvoice = async (req, res) => {
  if (!req.body.invoice_id) {
    res.json({
      status: 0,
      message: "Invoice id is missing.",
    });
    return;
  }
  let html = "";
  await ordersInvoiceModel
    .findOne({ _id: req.body.invoice_id })
    .populate("seller_id", "fullname address city country postal_code gst_no")
    .populate("order_uid", "fullname address city country state postal_code")
    .populate(
      "main_order_id",
      "order_uniqueid shipping_address billing_address payment_mode"
    )
    .then(async (invoice) => {
      if (invoice) {
        await orderProducts
          .find({ invoice_id: invoice._id })
          .populate("order_vid", "pro_subtitle")
          .then(async (result) => {
            if (result) {
              let currency_symbol = "$";
              let currencies = await currenciesModel.findOne({ status: 1 });
              if (currencies) {
                currency_symbol = currencies.currency_symbol;
              }
              let payMode = invoice.main_order_id.payment_mode;

              let country = invoice.order_uid.country
                ? invoice.order_uid.country
                : "";
              let state = invoice.order_uid.state
                ? invoice.order_uid.state
                : "";
              let city = invoice.order_uid.city ? invoice.order_uid.city : "";
              let postal_code = invoice.order_uid.postal_code
                ? invoice.order_uid.postal_code
                : "";

              html = ` <div class="row">
                                <div class="col-lg-12">
                                    <div class="card">
                                        <div class="card-body">
                                            <div class="ad-invoice-title">
                                                <h4>Order ID - ${
                                                  invoice.main_order_id
                                                    .order_uniqueid
                                                }</h4>
                                            </div>
                                            <hr>
                                            <div class="row">
                                                <div class="col-sm-6 col-lg-6">
                                                    <h5 class="mb-2">Billed To:</h5>
                                                    <p>${
                                                      invoice.order_uid.fullname
                                                    }</p>
                                                    <p>${
                                                      invoice.main_order_id
                                                        .billing_address
                                                    }</p>
                                                    <p>${country} ${state} ${city} ${postal_code}</p>
                                                </div>
                                                <div class="col-sm-6 col-lg-6 text-sm-end">
                                                    <h5 class="mb-2">Shipped To:</h5>
                                                    <p>${
                                                      invoice.order_uid.fullname
                                                    }</p>
                                                    <p>${
                                                      invoice.main_order_id
                                                        .shipping_address
                                                    }</p>
                                                    <p>${country} ${state} ${city} ${postal_code}</p>
                                                </div>
                                            </div>
                                            <div class="row">
                                                <div class="col-sm-6 mt-3">
                                                    <h5 class="mb-2">Payment Method:</h5>
                                                    <p>${payMode}</p>
                                                </div>
                                                <div class="col-sm-6 mt-3 text-sm-end">
                                                    <h5 class="mb-2">Order Date:</h5>
                                                    <p>${moment(
                                                      invoice.createdAt
                                                    ).format(
                                                      "DD-MMM-YYYY HH:MM"
                                                    )}</p>
                                                </div>
                                            </div>
                                            <div class="py-2 mt-3 mb-2">
                                                <h4 class="font-size-15">Order Summary</h4>
                                            </div>
                                            <div class="table-responsive">
                                                <table class="table table-styled mb-0">
                                                    <thead>
                                                        <tr>
                                                            <th style="width: 70px;">No.</th>
                                                            <th>Item</th>
                                                            <th class="text-end">Price</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>`;
              let i = 1;
              let subTotal = 0;
              for (const prod of result) {
                subTotal += parseFloat(prod.prod_price);
                html += `<tr>
                                                    <td>${i++}</td>
                                                    <td>${
                                                      prod.order_vid
                                                        .pro_subtitle
                                                    }</td>
                                                    <td class="text-end">${currency_symbol}${
                  prod.prod_price
                }</td>
                                                </tr>`;
              }
              subTotal = subTotal.toFixed(2);
              html += `<tr>
                                                <td colspan="2" class="text-end">Sub Total</td>
                                                <td class="text-end">${currency_symbol}${subTotal}</td>
                                            </tr>
                                            <!--tr>
                                                <td colspan="2" class="text-end">
                                                    <strong>Shipping</strong></td>
                                                <td class=" text-end">$14.00</td>
                                            </tr-->
                                            <tr>
                                                <td colspan="2" class="text-end">
                                                    <strong>Total</strong></td>
                                                <td class=" text-end"><h4 class="m-0">${currency_symbol}${subTotal}</h4></td>
                                            </tr>
                                            </tbody>
                                            </table>
                                            </div>
                                            <!--div class="d-print-none mt-2">
                                                <div class="float-end">
                                                    <a href="javascript:window.print()" class="btn btn-success waves-effect waves-light me-1"><i class="fa fa-print"></i></a>
                                                    <a href="javascript:;" class="btn btn-primary w-md waves-effect waves-light">Send</a>
                                                </div>
                                            </div-->
                                        </div>
                                    </div>
                                </div>
                        </div> `;
            }
          });
      }
    });

  res.send({
    status: 1,
    message: "Invoice generated Successfully.",
    data: html,
  });
};

ORDERS.transactionsList = async (req, res) => {
  try {
    let seller_id = await helper.uid(req);
    if (req.query.seller_id && req.query.seller_id) {
      seller_id = req.query.seller_id;
    }
    var query = { seller_id: seller_id };

    query.entry_againts = { $in: [1, 2, 3, 4] };
    // array of columns that you want to show in table
    columns = ["remark"];
    var start = req.query.start;
    var dataLimit = req.query.length;
    // check if global search is enabled and it's value is defined
    if (
      typeof req.query.search !== "undefined" &&
      req.query.search.value != ""
    ) {
      // get global search value
      var text = req.query.search.value;

      for (var i = 0; i < req.query.columns.length; i++) {
        requestColumn = req.query.columns[i];
        column = columns[requestColumn.data];

        // if search is enabled for that particular field then create query
        if (requestColumn.searchable == "true") {
          query[column] = {
            $regex: text,
          };
        }
      }
    }
    await outstandingsModel
      .find(query)
      .populate("sub_orderid", "prod_unique_id order_uid")
      .skip(start)
      .limit(dataLimit)
      .sort({ _id: "asc" })
      .then(async (result) => {
        var mytable = {
          draw: req.query.draw,
          recordsTotal: 0,
          recordsFiltered: 0,
          data: [],
        };

        mytable.recordsTotal = await outstandingsModel.countDocuments(query);
        mytable.recordsFiltered = await outstandingsModel.countDocuments(query);

        if (result.length > 0) {
          for (const [key, element] of Object.entries(result)) {
            if (element.sub_orderid) {
              let customerName = await helper.getUserDetails(
                element.sub_orderid.order_uid,
                "fullname"
              );
              mytable.data[key] = [
                ++start,
                element.sub_orderid.prod_unique_id,
                customerName,
                element.debit,
                element.credit,
                element.balance,
                helper.entryAgaints[element.entry_againts],
                element.remark,
                moment(element.createdAt).format("DD-MMM-YYYY HH:MM"),
              ];
            }
          }

          res.status(200).json(mytable);
        } else {
          res.status(200).json(mytable);
        }
      });
  } catch (err) {
    res.status(401).json({ status: 0, message: "error " + err });
  }
};

module.exports = ORDERS;
