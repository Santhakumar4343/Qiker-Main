const mongoose   = require('mongoose');
const UserModel  = mongoose.model('users');
const CourierServiceModel=mongoose.model('courier_services')
const courierBoyModel=mongoose.model('courier_boys')
const withdrawRequestModel  = mongoose.model('withdraw_request');
const moment            = require('moment'); 
const config          = require('../config/config');
const helper          = require('../helpers/my_helper');
const ADMIN = {};

ADMIN.profile = async (req, res) => {
    let userProfile = await UserModel.findOne({_id: req.session.user.user_id}).exec();
    if(userProfile){
        req.session.user.fullname    = userProfile.fullname;
        if(userProfile.profile_image != null){
            userProfile.profile_image = config.APP_URL+'uploads/users/'+userProfile.profile_image;
            req.session.user.profile_image    = userProfile.profile_image;
        }else{
            userProfile.profile_image = config.USER_DEFAULT_IMAGE;
            req.session.user.profile_image    = userProfile.profile_image;
        }
    }
    let notiCount = 0;
    res.render('backend/profile', {
            viewTitle : 'User Profile',
            pageTitle : 'User Profile',
            userProfile : userProfile,
            notiCount : notiCount
    });
};

ADMIN.courierServiceProfile = async (req, res) => {
    let userProfile = await CourierServiceModel.findOne({_id: req.session.user.user_id}).exec();
    if(userProfile){
        req.session.user.service_name    = userProfile.service_name;
        if(userProfile.profile_image != null){
            userProfile.profile_image = config.APP_URL+'uploads/users/'+userProfile.profile_image;
            req.session.user.profile_image    = userProfile.profile_image;
        }else{
            userProfile.profile_image = config.USER_DEFAULT_IMAGE;
            req.session.user.profile_image    = userProfile.profile_image;
        }
    }
    let notiCount = 0;
    res.render('backend/courierServiceProfile', {
            viewTitle : 'User Profile',
            pageTitle : 'User Profile',
            userProfile : userProfile,
            notiCount : notiCount
    });
};

ADMIN.courierBoyProfile = async (req, res) => {
    let userProfile = await courierBoyModel.findOne({_id: req.session.user.user_id}).exec();
    if(userProfile){
        req.session.user.service_name    = userProfile.service_name;
        // if(userProfile.profile_image != null){
        //     userProfile.profile_image = config.APP_URL+'uploads/users/'+userProfile.profile_image;
        //     req.session.user.profile_image    = userProfile.profile_image;
        // }else{
        //     userProfile.profile_image = config.USER_DEFAULT_IMAGE;
        //     req.session.user.profile_image    = userProfile.profile_image;
        // }
    }
    let notiCount = 0;
    res.render('backend/courierBoyProfile', {
            viewTitle : 'User Profile',
            pageTitle : 'User Profile',
            userProfile : userProfile,
            notiCount : notiCount
    });
};

ADMIN.sellerWithdrawsRequest = async (req, res) => {
    res.render('backend/admin_withdraw_request', {
            viewTitle : 'Withdraw Request',
            pageTitle : 'Withdraw Request List'
    });
};

ADMIN.withdrawRequestList = async (req, res) => {
    try {
        
        var query = {};
       // query['seller_id'] = 2;
        query['role'] = 2;


        // array of columns that you want to show in table
        columns = ['fullname'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

            // iterate over each field definition to check whether search is enabled
            // for that particular column or not. You can set search enable/disable
            // in datatable initialization.
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
        await withdrawRequestModel.find(query).populate('seller_id','fullname').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
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
                    let actionBtn = `<a href="javascript:void(0);" title="View" class="withdrawProcced" data-seller-id="${(element.seller_id) ? element.seller_id._id : ''}" data-req-id="${element._id}" data-url="seller/getSellerOutstanding"><i class="fas fa-eye"></i></a>`;

                    if(element.status ==1){
                        labelClass = 'success';
                        labelTxt   = 'Success';
                        actionBtn  = '-';
                    }else if(element.status ==2){
                        labelClass = 'danger';
                        labelTxt   = 'Rejected';
                        actionBtn  = '-';
                    }


                    mytable.data[key] = [ ++start,
                                          element.amount,
                                          (element.seller_id) ? element.seller_id.fullname : '',
                                          moment(element.createdAt).format('DD-MMM-YYYY HH:MM'),
                                          `<label class="mb-0 badge badge-${labelClass}" title="" data-original-title="Pending">${labelTxt}</label>`,
                                          actionBtn
                                          
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





ADMIN.processWithdrawRequest = async (req, res)  => {
    // console.log(req.file);
    if(!req.body.withdraw_id){
        res.json({
            status:0,
            message: 'withdraw id missing.',
            data: ''
        });
        return;
    }

    if(!req.body.transaction_id){
        res.json({
            status:0,
            message: 'Transaction id missing.',
            data: ''
        });
        return;
    }

    if(!req.body.withdraw_status){
        res.json({
            status:0,
            message: 'Please select status.',
            data: ''
        });
        return;
    }
    
    

    postData ={};
    postData.status = req.body.withdraw_status;
    postData.transaction_id    =  req.body.transaction_id;
    postData.updatedAt  = Date.now();
    await withdrawRequestModel.findOneAndUpdate({_id : req.body.withdraw_id}, postData).then(creatRes=>{
        if(postData.status==1){
            let outstanding = {maine_orderid : null,
                invoice_id     : null, 
                sub_orderid    : null, 
                seller_id      : creatRes.seller_id,
                debit          : creatRes.amount, 
                credit         : 0,
                entry_againts  : 5 ,   // 5 = Withdraw Amount
                reference_id   : req.body.withdraw_id,
                remark         : "Withdrawl Amount",
                status         : 1
            };
            helper.insertOutstanding(outstanding);
        }
        res.status(200).json({ status: 1 , message: 'Withdraw process Successfully!', 'data': creatRes });
    }).catch(err=>{
        res.status(500).json({ status: 0 , message: 'Something went wrong in withdraw process.', data: err.message });
    });
 }

module.exports = ADMIN;