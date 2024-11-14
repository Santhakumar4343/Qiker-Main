const mongoose   = require('mongoose');
const UserModel  = mongoose.model('users');
const withdrawRequestModel  = mongoose.model('withdraw_request');
const outstandingsModel  = mongoose.model('outstandings');
const moment            = require('moment'); 
const helper          = require('../helpers/my_helper');
const { orderProducts } = require('../models/DatabaseModel');
const SELLER ={};

SELLER.sellers = async (req, res) => {
    res.render('backend/seller_list', {
            viewTitle : 'Sellers',
            pageTitle : 'Sellers List'
    });
};

SELLER.withdraws = async (req, res) => {
    res.render('backend/seller_withdraw_request', {
            viewTitle : 'Withdraw Request',
            pageTitle : 'Withdraw Request List'
    });
};

SELLER.createWithdrawRequest = async (req, res)  => {
    // console.log(req.file);
    if(!req.body.withdraw_amt){
        res.json({
            status:0,
            message: 'Please enter amount.',
            data: ''
        });
        return;
    }

    if(req.body.outstandig_amt < req.body.withdraw_amt){
        res.json({
            status:0,
            message: 'You can not withdraw more than outstandig amount.',
            data: ''
        });
        return;
    }

    if(req.body.withdraw_amt <= 0){
        res.json({
            status:0,
            message: 'Amount should be grater than zero.',
            data: ''
        });
        return;
    }

    postData ={};
    postData.seller_id =  req.session.user.user_id;
    postData.amount    =  req.body.withdraw_amt;
    await withdrawRequestModel.create(postData).then(creatRes=>{
        res.status(200).json({ status: 1 , message: 'Withdraw requested Successfully!', 'data': creatRes });
    }).catch(err=>{
        res.status(500).json({ status: 0 , message: 'Something went wrong in withdraw requested.', data: err.message });
    });
 }


SELLER.sellersList = async (req, res) => {
    try {
        
        var query = {};

        query['role'] = 2;

        // array of columns that you want to show in table
        columns = ['fullname'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

           
            for (var i=0; i<req.query.columns.length; i++) {
                requestColumn = req.query.columns[i];
                column = columns[requestColumn.data];

                // if search is enabled for that particular field then create query
                if (requestColumn.searchable == 'true') {
                    query[column] = {
                        $regex: text,
                    };
                }
            }
        }
        await UserModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await UserModel.countDocuments(query);
            mytable.recordsFiltered = await UserModel.countDocuments(query);

           if(result.length > 0){
                for(const [key,element] of Object.entries(result)) {

                    let totalOrder = await orderProducts.countDocuments({seller_id : element._id });
                    let checked =  (element.status) ? 'checked' : '';
                    mytable.data[key] = [ ++start,
                                          element.fullname,
                                          element.email,
                                          element.mobile,
                                          totalOrder,
                                          `<div class="toggle-wrap">
                                          <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="seller/updateSellerStatus">
                                          <label class="toggle-label" for="${element._id}"></label>
                                          </div>`,
                                          `<a href="order_transactions/${element._id}" title="View Transactions" class="viewTransactions" ><i class="fas fa-eye"></i></a>`
                                        ];
                }; 

                res.status(200).json(mytable);
                  
            } else {
                res.status(200).json(mytable);
            }
        });
      } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
      }
  };
  

  SELLER.withdrawRequestList = async (req, res) => {
    try {
        
        var query = { 'seller_id' : await helper.uid(req)  };;
       
        query['role'] = 2;
        // array of columns that you want to show in table
        columns = ['fullname'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

          
            for (var i=0; i<req.query.columns.length; i++) {
                requestColumn = req.query.columns[i];
                column = columns[requestColumn.data];

                // if search is enabled for that particular field then create query
                if (requestColumn.searchable == 'true') {
                    query[column] = {
                        $regex: text,
                    };
                }
            }
        }
        await withdrawRequestModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await withdrawRequestModel.countDocuments(query);
            mytable.recordsFiltered = await withdrawRequestModel.countDocuments(query);

           if(result.length > 0){
                for(const [key,element] of Object.entries(result)) {
                    let labelClass = 'primary';
                    let labelTxt   = 'Pending';
                    if(element.status ==1){
                        labelClass = 'success';
                        labelTxt   = 'Success';
                    }else if(element.status ==2){
                        labelClass = 'danger';
                        labelTxt   = 'Rejected';
                    }
                    mytable.data[key] = [ ++start,
                                          element.amount,
                                          moment(element.createdAt).format('DD-MMM-YYYY HH:MM'),
                                          `<label class="mb-0 badge badge-${labelClass}" title="" data-original-title="Pending">${labelTxt}</label>`
                                        ];
                }; 

                res.status(200).json(mytable);
                  
            } else {
                res.status(200).json(mytable);
            }
        });
      } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
      }
  };

  SELLER.getSellerOutstandingAmt = async (req, res) => {
    if (!req.body.seller_id) {
        res.json({
            status:0,
            message: 'Seller id is missing.',
            data: ''
        });
        return;
    }
    let oldBalance = 0;
    let query = {seller_id : mongoose.Types.ObjectId(req.body.seller_id) };
    await outstandingsModel.aggregate([
        { 
            $match:  query
        },
        {
            $group: {
                _id: {
                seller_id: "$seller_id"
                },
                totalDebit: {
                $sum: "$debit"
                }
                ,totalCredit: {
                    $sum: "$credit"
                }
            }
        }
        
    ]).then(async (result)=>{
        if(result.length > 0){
            let tr = result[0];
            oldBalance = parseFloat(tr.totalCredit) - parseFloat(tr.totalDebit);
        }
    });

    let returnData = {outstanding : oldBalance.toFixed(2)};
    if(req.body.req_id){
        await withdrawRequestModel.findOne({_id : req.body.req_id}).then(async (result)=>{
            returnData.withdrawReq = result;
        });
    }
    
    
    res.json({ status :1, message : 'Seller outstanding amount.', data : returnData });

}

SELLER.updateSellerStatus = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'Seller id is missing.',
            data: ''
        });
        return;
    }

    UserModel.findOneAndUpdate({'_id':req.body.id},{status : req.body.status}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''})
        } else {
            res.send({ status: 1,'message':'Status updated Successfully.','data':result});
        }
    });
};

  SELLER.deleteCustomer = async (req, res) => {
    if (!req.body.id) {
        res.json({
            status:0,
            message: 'Customer id is missing.',
            data: ''
        });
        return;
    }
    let cust_id = req.body.id;

        UserModel.findOneAndDelete({'_id':cust_id}, (err, cust) => {
            if(err) {
                res.send({ status:0,'message':err,'data':''})
            } else {
               // console.log(cust)
                res.send({ status: 1,'message':'Customer Deleted Successfully','data':''})
            }
        })
    };


    module.exports = SELLER;