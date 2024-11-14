const mongoose   = require('mongoose');
const UserModel       = mongoose.model('users');
const webSettingsModel  = mongoose.model('website_settings');
const currenciesModel   = mongoose.model('currencies');
const CourierServiceModel=mongoose.model('courier_services')
const courierBoyModel=mongoose.model('courier_boys')
const faqModel   = mongoose.model('help_questions_answers');
const firbaseNotificationModel = mongoose.model('firebaseNotification')
const helper     = require('../helpers/my_helper');
const config     = require('../config/config');
const md5        = require('md5');
const fs         = require('fs');
const { Console } = require('console');
const e = require('express');
const SETTINGS = {};

SETTINGS.termsConditions = async (req, res) => {
    const termsConditions = await webSettingsModel.findOne({'key_name' : 'terms_conditions_page'}).exec();
    res.render('compliance_page/terms_conditions', {
            viewTitle : 'Terms And Conditions',
            pageTitle : 'terms_conditions',
            termsConditions : termsConditions,
    });
};

SETTINGS.privacyPolicy = async (req, res) => {
    const privacyPolicyPage = await webSettingsModel.findOne({'key_name' : 'privacy_policy_page'}).exec();
    res.render('compliance_page/privacy_policy', {
            viewTitle : 'Privacy Policy',
            pageTitle : 'privacy_policy',
            privacyPolicyPage : privacyPolicyPage
    });
};

SETTINGS.aboutUs = async (req, res) => {
    const aboutusPage = await webSettingsModel.findOne({'key_name' : 'aboutus_page'}).exec();
    res.render('compliance_page/about_us', {
            viewTitle : 'About Us',
            pageTitle : 'about_us',
            aboutusPage : aboutusPage
    });
};

SETTINGS.faqPage = async (req, res) => {
    res.render('compliance_page/faq', {
            viewTitle : 'FAQ',
            pageTitle : 'faq',
            
    });
};

SETTINGS.webConfig = async (req, res) => {
    let webSetting = {};
    const setting = await webSettingsModel.findOne({'key_name' : 'webSetting'}).exec();
    if(setting !== null){
        webSetting = JSON.parse(setting.value);
    }
    let commission = {}; 
    const sales_commission = await webSettingsModel.findOne({'key_name' : 'sales_commission'}).exec();
    if(sales_commission !== null){
        commission.salesCommission = JSON.parse(sales_commission.value);

    }

    const cancellation_charges = await webSettingsModel.findOne({'key_name' : 'cancellation_charges'}).exec();
    if(cancellation_charges !== null){
        commission.cancellationCharges = JSON.parse(cancellation_charges.value);

    }
    let webImages = await helper.getWebSetting('web_images');
    


    res.render('backend/web_settings', {
            viewTitle : 'Web Config',
            pageTitle : 'Web Config',
            webSetting : webSetting,
            commission : commission,
            webImages : webImages

    });
};

SETTINGS.paymentMethods = async (req, res) => {
    let cod = '';
    const codGatways = await webSettingsModel.findOne({'key_name' :'cash_on_delivery'}).exec();
    if(codGatways !== null){
        cod = JSON.parse(codGatways.value);
    }
    let razorepay ='';
    const razorepayGatways = await webSettingsModel.findOne({'key_name' :'RAZORPAY_DETAILS'}).exec();
    if(razorepayGatways !== null){
        razorepay = JSON.parse(razorepayGatways.value);
    }
    let paystack  ='';
    const paystackGatways = await webSettingsModel.findOne({'key_name' :'PAYSTACK_DETAILS'}).exec();
    if(paystackGatways !== null){
        paystack = JSON.parse(paystackGatways.value);
    }

    let stripe ='';
    const stripeGatways = await webSettingsModel.findOne({'key_name' :'STRIPE_DETAILS'}).exec();
    if(stripeGatways !== null){
        stripe = JSON.parse(stripeGatways.value);
    }

    let paypal ='';
    const paypalGatways = await webSettingsModel.findOne({'key_name' :'PAYPAL_DETAILS'}).exec();
    if(paypalGatways !== null){
        paypal = JSON.parse(paypalGatways.value);
    }
    
    res.render('backend/payment_method', {
            viewTitle : 'Payment Method',
            pageTitle : 'payment_method',
            cod : cod,
            razorepay : razorepay,
            paystack  : paystack,
            stripe    : stripe,
            paypal    : paypal
    });
};


SETTINGS.currency = async (req, res) => {
    res.render('backend/currency_list', {
            viewTitle : 'Currencies',
            pageTitle : 'currencies',
    });
};

SETTINGS.mailSettings = async (req, res) => {
    let smtpDetails = '';
    const smtpMail = await webSettingsModel.findOne({'key_name' : 'smtp_mail'}).exec();
    if(smtpMail !== null){
        smtpDetails = JSON.parse(smtpMail.value);
    }
    res.render('backend/mail_settings', {
            viewTitle : 'Mail Config',
            pageTitle : 'mail config',
            smtpDetails  : smtpDetails,
    });
};

SETTINGS.smsSettings = async (req, res) => {
    let twilioDetails = '';
    const twilioSms = await webSettingsModel.findOne({'key_name' : 'twilio_sms'}).exec();
    if(twilioSms !== null){
        twilioDetails = JSON.parse(twilioSms.value);
    }
    res.render('backend/sms_settings', {
            viewTitle : 'Sms Gateway Setup',
            pageTitle : 'sms gateway setup',
            twilioDetails : twilioDetails
    });
};

SETTINGS.firebase_notifications = async (req, res) => {
    let firebaseDetails = '';
    const notification = await webSettingsModel.findOne({'key_name' : 'FIREBASE'}).exec();
    if(notification !== null){
        firebaseDetails = JSON.parse(notification.value);
    }
    res.render('backend/notification_settings', {
            viewTitle : 'Firebase Config',
            pageTitle : 'Firebase Config',
            firebaseDetails : firebaseDetails
    });
};


SETTINGS.saveWebSettings = async (req, res) => {
   
    let i = 0;
    for(const [key, valData] of Object.entries(req.body)){
        if(i ==0){
      
            await webSettingsModel.findOneAndUpdate({'key_name' : key} ,{ 'value' : JSON.stringify(valData) }, {upsert : true, new: true}).then(async result=>{
                //result = result.toObject();
                res.json({ status: 1 , message: 'Settings Updated Successfully!.', data : result });
            }).catch(err=>{
                res.json({ status:0 , message: 'Something went wrong in update settings. '+err.message, data : {} });                    
            });
            i++;
        }
    }
    
};


SETTINGS.uploadWebImages = async (req, res) => {
    let inssert = {};
    if(req.body.type && req.file){
        let type = req.body.type;
        let images = {}; // in percent
        images = await helper.getWebSetting('web_images');
        if(images){
            let filePath = './public/uploads/webimages/';
            let previousImage =  images[type];
            if(previousImage !==null ){
                let mainImage = filePath+previousImage;
                if (fs.existsSync(mainImage)) {
                    fs.unlinkSync(mainImage); //file removed
                }
            }
        }
        images[type] = req.file.filename;
        inssert =  { web_images : images};
        if(inssert){
            let i = 0;
            for(const [key, valData] of Object.entries(inssert)){
                if(i ==0){
                
                    await webSettingsModel.findOneAndUpdate({'key_name' : key} ,{ 'value' : JSON.stringify(valData) }, {upsert : true, new: true}).then(async result=>{
                        //result = result.toObject();
                        res.json({ status: 1 , message: 'Image uploaded Successfully!', data : result });
                    }).catch(err=>{
                        res.json({ status:0 , message: 'Something went wrong in upload image. '+err.message, data : {} });                    
                    });
                    i++;
                }
            }
        }

    }else{
        res.json({ status:0 , message: 'Please select an image to upload.', data : {} });  

    }
   
    
};



SETTINGS.create_currency = async (req, res)  => {
   
     postData ={};
     if(!req.body.currency_code){
        res.json({
            status : 0,
            message: `Currency code field required.`,
            data:[]
          });
        return;
     }else if(!req.body.currency_symbol){
        res.json({
            status : 0,
            message: `Currency symbol field required.`,
            data:[]
          });
        return;
    }
     postData.currency_code  = req.body.currency_code;
     postData.currency_symbol = req.body.currency_symbol;
     if(req.body.id && req.body.id != 0) {
         await currenciesModel.findOne({'currency_code':req.body.currency_code,'_id': {$ne: req.body.id}}).then(async checkExist=>{
            if (checkExist) {
                res.status(401).json({status:0 , message:'Currency code already exists, Please try another one.',data:''})
            } else {                    
            postData.updatedAt = Date.now();
            await currenciesModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                res.status(200).json({ status: 1 , message: 'Currency Updated Successfully!', 'data': req.body.id });
            }).catch(err=>{
                res.status(500).json({ status:0 , message: 'Something went wrong in update currency.', data: err.message });                    
            });
            }
         }).catch(err=>{
             res.status(500).json({ status: 0, message: 'Something went wrong in update currency.', data: err.message });
         })
     } else {
         await currenciesModel.findOne({'currency_code':req.body.currency_code}).then(check=>{
             if (check) {
                 res.status(401).json({status: 0 ,message:'Currency code already exists, Please try another one.',data:check})
             } else {
                currenciesModel.create(postData).then(creatRes=>{
                     res.status(200).json({ status: 1 , message: 'Currency Added Successfully!', 'data': creatRes });
                 }).catch(err=>{
                     res.status(500).json({ status: 0 , message: 'Something went wrong in insert currency.', data: err.message });
                 })
             }
         })
     }
 
}


SETTINGS.create_faq = async (req, res)  => {
    
     postData ={};
     if(!req.body.faq_question){
        res.json({
            status : 0,
            message: `Question field required.`,
            data:[]
          });
        return;
     }else if(!req.body.faq_answer){
        res.json({
            status : 0,
            message: `Answer field required.`,
            data:[]
          });
        return;
    }
     postData.faq_question  = req.body.faq_question;
     postData.faq_answer = req.body.faq_answer;
     if(req.body.id && req.body.id != 0) {
         await faqModel.findOne({'faq_question':req.body.faq_question,'_id': {$ne: req.body.id}}).then(async checkExist=>{
            if (checkExist) {
                res.status(401).json({status:0 , message:'Question already exists, Please try another one.',data:''})
            } else {                    
            postData.updatedAt = Date.now();
            await faqModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                res.status(200).json({ status: 1 , message: 'Question Updated Successfully!', 'data': req.body.id });
            }).catch(err=>{
                res.status(500).json({ status:0 , message: 'Something went wrong in update question.', data: err.message });                    
            });
            }
         }).catch(err=>{
             res.status(500).json({ status: 0, message: 'Something went wrong in update question.', data: err.message });
         })
     } else {
         await faqModel.findOne({'faq_question':req.body.faq_question}).then(check=>{
             if (check) {
                 res.status(401).json({status: 0 ,message:'Question already exists, Please try another one.',data:check})
             } else {
                faqModel.create(postData).then(creatRes=>{
                     res.status(200).json({ status: 1 , message: 'Question Added Successfully!', 'data': creatRes });
                 }).catch(err=>{
                     res.status(500).json({ status: 0 , message: 'Something went wrong in insert question.', data: err.message });
                 })
             }
         })
     }
 
}

SETTINGS.faqList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['faq_question'];
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
        await faqModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await faqModel.countDocuments();
            mytable.recordsFiltered = await faqModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
            
                    mytable.data[key] = [ ++start,
                                          element.faq_question,
                                          element.faq_answer,
                                          helper.statusLable[element.status],
                                          `<a href="javascript:void(0);" title="Edit" class="editFaq" data-url="edit_faq" data-faq-id="${element._id}"><i class="fas fa-edit"></i></a>
                                          <a href="javascript:void(0);" title="Delete" class="deleteRecords" data-delete-id="${element._id}" data-url="settings/delete_faq"><i class="fas fa-trash-alt"></i></a>`
                                        ];
                }); 

                res.status(200).json(mytable);
                  
            } else {
                res.status(200).json(mytable);
            }
        });
      } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
      }
  };



SETTINGS.currencyList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['currency_code'];
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
        await currenciesModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await currenciesModel.countDocuments();
            mytable.recordsFiltered = await currenciesModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
                        let radio_checked = '';
                        if(element.status == 1){
                            radio_checked = 'checked';
                        }
                    mytable.data[key] = [ ++start,
                                          element.currency_code,
                                          element.currency_symbol,
                                          `<div class="ad-radio-button">
                                                <input id="radio-${element._id}" type="radio" class="currencyStatus" data-url="settings/updateCurrencyStatus" data-currency-id="${element._id}" name="status" value="1" ${radio_checked}>
                                                <label for="radio-${element._id}" class="radio-label">Active</label>
                                            </div>`,
                                          `<a href="javascript:void(0);" title="Edit" class="editCurrency" data-url="edit_currency" data-currency-id="${element._id}"><i class="fas fa-edit"></i></a>
                                          <a href="javascript:void(0);" title="Delete" class="deleteRecords" data-delete-id="${element._id}" data-url="settings/delete_currency"><i class="fas fa-trash-alt"></i></a>`
                                        ];
                }); 

                res.status(200).json(mytable);
                  
            } else {
                res.status(200).json(mytable);
            }
        });
      } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
      }
  };

  SETTINGS.editCurrency = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'Currency id is missing.',
            data: ''
        });
        return;
    }

    let currency_id = req.body.id;
    currenciesModel.findOne({'_id':currency_id}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''});
        } else {
            // console.log(result)
            res.send({ status: 1,'message':'Currency found.','data':result});
        }
    });
    
};

SETTINGS.editFaq = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'FAQ id is missing.',
            data: ''
        });
        return;
    }

    let faq_id = req.body.id;
    faqModel.findOne({'_id':faq_id}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''});
        } else {
            
            res.send({ status: 1,'message':'FAQ found.','data':result});
        }
    });
};

SETTINGS.deleteCurrency = async (req, res) => {
    if (!req.body.id) {
            res.json({
            status:0,
            message: 'Currency id is missing.',
            data: ''
        });
        return;
    }
    let currency_id = req.body.id;
    currenciesModel.findOneAndDelete({'_id':currency_id}, (err, previous) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''})
        } else {
            res.send({ status: 1,'message':'Currency Deleted Successfully','data':''})
        }
    });
};

SETTINGS.deleteFaq = async (req, res) => {
    if (!req.body.id) {
            res.json({
            status:0,
            message: 'FAQ id is missing.',
            data: ''
        });
        return;
    }
    let faq_id = req.body.id;
    faqModel.findOneAndDelete({'_id':faq_id}, (err, previous) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''});
        } else {
            res.send({ status: 1,'message':'FAQ Deleted Successfully','data':''});
        }
    });
};


SETTINGS.updateServiceProfile = async (req, res) => {
    try {
        let userData = {};
        
        if(!req.body.user_id){
            res.json({status : 0 , message: 'The user id field required.'});
            return;
        }else if(!req.body.service_name) {
            res.json({status : 0 , message: 'The user name is required.'});
            return;
        }else if(!req.body.phone_number){
            res.json({status : 0 , message: 'Mobile number is required.'});
            return;
        }else if(req.body.phone_number && !await helper.validatePhone(req.body.phone_number)){
            res.json({status : 0 , message: 'Please enter valid mobile number.'});
            return;
        }else if(req.body.email && !await helper.validateEmail(req.body.email)){
            res.json({status : 0 , message: 'Please enter valid  email address.'});
            return;
        }
        else if(req.body.password && req.body.password.length<4){
            res.json({status : 0 , message: 'Please enter minimum four digit password.'});
            return;
        }
        if (req.body.email) {
            userData.email = req.body.email;
        }

        if (req.body.phone_number) {
            userData.phone_number = req.body.phone_number;
        }
        if(req.body.service_name){
            userData.service_name   = req.body.service_name;
        }

        if(req.body.password){
            userData.password = req.body.password;
        }
        
        // if(req.file){
        //     userData.profile_image = req.file.service_name;
        // }

        // userData.address      = (req.body.address) ? req.body.address : null ;
        // userData.city         = (req.body.city) ? req.body.city : null ;
        // userData.postal_code  = (req.body.postal_code) ? req.body.postal_code : null ;
        // userData.country      = (req.body.country) ? req.body.country : null ;
        // userData.gst_no       = (req.body.gst_no) ? req.body.gst_no : null ;
        userData.updatedAt    = Date.now();
                

        // if(req.file){
        //     let  previousImage = await UserModel.findOne({_id: req.body.user_id}).select("profile_image").exec();
        //     if(previousImage){
        //             filePath = './public/uploads/users/'+previousImage.profile_image;
        //             if (fs.existsSync(filePath)) {
        //                 fs.unlinkSync(filePath); //file removed
        //             }
        //     }
        // }
        await CourierServiceModel.findOneAndUpdate({'_id':req.body.user_id},userData, {new: true}).then(async result=>{
        result = result.toObject();
        res.json({ status: 1 , message: 'Profile Updated Successfully!.', data : [] });
        }).catch(err=>{
            res.json({ status:0 , message: 'Something went wrong in update user profile. '+err.message, data : {} });                    
        });
     
  
      } catch (err) {
        res.json({status : 0, 'message':err.message, data : {} });
      }
  };

  SETTINGS.updateBoyProfile = async (req, res) => {
    try {
        let userData = {};
        
        if(!req.body.user_id){
            res.json({status : 0 , message: 'The user id field required.'});
            return;
        }else if(!req.body.service_name) {
            res.json({status : 0 , message: 'The user name is required.'});
            return;
        }else if(!req.body.phone_number){
            res.json({status : 0 , message: 'Mobile number is required.'});
            return;
        }else if(req.body.phone_number && !await helper.validatePhone(req.body.phone_number)){
            res.json({status : 0 , message: 'Please enter valid mobile number.'});
            return;
        }else if(req.body.email && !await helper.validateEmail(req.body.email)){
            res.json({status : 0 , message: 'Please enter valid email address.'});
            return;
        }
        else if(req.body.password && req.body.password.length<4){
            res.json({status : 0 , message: 'Please enter minimum four digit password.'});
            return;
        }

        if (req.body.email) {
            userData.email = req.body.email;
        }

        if (req.body.phone_number) {
            userData.phone_number = req.body.phone_number;
        }
        if(req.body.service_name){
            userData.service_name   = req.body.service_name;
        }

        if(req.body.password){
            userData.password = req.body.password;
        }
        
        if(req.file){
            userData.profile_image = req.file.service_name;
        }

        userData.address      = (req.body.address) ? req.body.address : null ;
        userData.city         = (req.body.city) ? req.body.city : null ;
        userData.postal_code  = (req.body.postal_code) ? req.body.postal_code : null ;
        userData.country      = (req.body.country) ? req.body.country : null ;
        // userData.gst_no       = (req.body.gst_no) ? req.body.gst_no : null ;
        userData.updatedAt    = Date.now();
                

        // if(req.file){
        //     let  previousImage = await UserModel.findOne({_id: req.body.user_id}).select("profile_image").exec();
        //     if(previousImage){
        //             filePath = './public/uploads/users/'+previousImage.profile_image;
        //             if (fs.existsSync(filePath)) {
        //                 fs.unlinkSync(filePath); //file removed
        //             }
        //     }
        // }
        await courierBoyModel.findOneAndUpdate({'_id':req.body.user_id},userData, {new: true}).then(async result=>{
        result = result.toObject();
        res.json({ status: 1 , message: 'Profile Updated Successfully!.', data : [] });
        }).catch(err=>{
            res.json({ status:0 , message: 'Something went wrong in update user profile. '+err.message, data : {} });                    
        });
     
  
      } catch (err) {
        res.json({status : 0, 'message':err.message, data : {} });
      }
  };
SETTINGS.updateProfile = async (req, res) => {
    try {
        let userData = {};
        
        if(!req.body.user_id){
            res.json({status : 0 , message: 'The user id field required.'});
            return;
        }else if(!req.body.uname) {
            res.json({status : 0 , message: 'The user name is required.'});
            return;
        }else if(!req.body.umobile){
            res.json({status : 0 , message: 'Mobile number is required.'});
            return;
        }else if(req.body.umobile && !await helper.validatePhone(req.body.umobile)){
            res.json({status : 0 , message: 'Please enter valid mobile number.'});
            return;
        }else if(req.body.pwd && req.body.pwd.length<4){
            res.json({status : 0 , message: 'Please enter minimum four digit password.'});
            return;
        }
        if(req.body.uname){
            userData.fullname   = req.body.uname;
        }

        if(req.body.pwd){
            userData.password = md5(req.body.pwd);
        }
        
        if(req.file){
            userData.profile_image = req.file.filename;
        }

        userData.address      = (req.body.address) ? req.body.address : null ;
        userData.city         = (req.body.city) ? req.body.city : null ;
        userData.postal_code  = (req.body.postal_code) ? req.body.postal_code : null ;
        userData.country      = (req.body.country) ? req.body.country : null ;
        userData.gst_no       = (req.body.gst_no) ? req.body.gst_no : null ;
        userData.updatedAt    = Date.now();
                

        if(req.file){
            let  previousImage = await UserModel.findOne({_id: req.body.user_id}).select("profile_image").exec();
            if(previousImage){
                    filePath = './public/uploads/users/'+previousImage.profile_image;
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath); //file removed
                    }
            }
        }
        await UserModel.findOneAndUpdate({'_id':req.body.user_id},userData, {new: true}).then(async result=>{
        result = result.toObject();
        res.json({ status: 1 , message: 'Profile Updated Successfully!.', data : [] });
        }).catch(err=>{
            res.json({ status:0 , message: 'Something went wrong in update user profile. '+err.message, data : {} });                    
        });
     
  
      } catch (err) {
        res.json({status : 0, 'message':err.message, data : {} });
      }
  };

  SETTINGS.updateCurrencyStatus = async (req, res) => {
    if(!req.body.currency_id){
        res.json({
            status:0,
            message: 'Currency id is missing.',
            data: ''
        });
        return;
    }
    await currenciesModel.updateMany({} , {status : 0});
    currenciesModel.findOneAndUpdate({'_id':req.body.currency_id},{status : 1}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''})
        } else {
            res.send({ status: 1,'message':'Default currency set Successfully.','data':result});
        }
    });
};



SETTINGS.getActiveUserList = async (req, res) => {
    try {
        
        var query = {};

        query['role'] = 3;
        query['email'] = { $ne: null };
        // array of columns that you want to show in table
        columns = ['fullname'];

        
        var start = 0;
        var dataLimit = 10;
        
        if (typeof req.body.search !== 'undefined' && req.body.search != '') {
           let  text = req.body.search;
            query['fullname'] = { $regex: '.*'+ text +'.*', $options:'i' };
        }
        
        await UserModel.find(query).select('_id fullname email').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                list:[],
            }
            if(result.length > 0){
                for(const [key,element] of Object.entries(result)) {
                    mytable.list[key] = { 'id'  : element._id+'|'+element.email,
                                          'name' : element.fullname,
                                        };
                }; 

                res.status(200).json({ status : 1, data : mytable  });
                  
            } else {
                res.status(200).json({ status : 1, data : mytable  });
            }
        });
      } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
      }
  };


    SETTINGS.sendBulkMail = async (req, res) => {
        try {

            if(!req.body.user_ids){
                res.json({status : 0 , message: 'Please select users..'});
                return;
            }else if(!req.body.mail_subject) {
                res.json({status : 0 , message: 'The subject field is required.'});
                return;
            }else if(!req.body.mail_body){
                res.json({status : 0 , message: 'The mail body field is required.'});
                return;
            }

            let userIds =   req.body.user_ids;
            let emaiList = [];
            for(let i=0; i <userIds.length; i++){
                const idsArr = userIds[i].split('|');
                if(idsArr.length && typeof idsArr[1] !== 'undefined' && idsArr[1] !== 'null') {
                    emaiList.push(idsArr[1]);
                }
            }

           // let verifytoken = "dnvhjgfhjdsghfjd7s6f7dhjsgfs";
          //  let verify_link = `${config.APP_URL}auth/verify-email/${verifytoken}`;
            //let htmlToSend = await helper.emailTemplate({name:req.body.uname, verify_link: verify_link} ,'sellerWelcome');
                    let htmlToSend = req.body.mail_body;
                    helper.sendMail({
                        to		: 'no-reply@pixacart.com',
                        bcc		: emaiList.toString(),
                        subject	: `${req.body.mail_subject}`,
                        message	: htmlToSend,
                        hasHTML : true,
                })
                .then(info => {
                    res.json({status : 1, message:'Mail sent successfully.', data: info });
                })
                .catch(error => {
                    res.json({
                        status:0,
                        message: 'Unable to send mail, Please try again. '+error.message,
                        data: error,
                    });
                });
            
        } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
        }
    }

    SETTINGS.sendNotification = async (req, res) => {
        try {
            let notiData = {};
            if(!req.body.user_ids){
                res.json({status : 0 , message: 'Please select users..'});
                return;
            }else if(!req.body.noti_title) {
                res.json({status : 0 , message: 'The title field is required.'});
                return;
            }else if(!req.body.noti_msg){
                res.json({status : 0 , message: 'The message field is required.'});
                return;
            }else if(!req.body.noti_link){
                res.json({status : 0 , message: 'The link field is required.'});
                return;
            }
            
            let firebaseDetails = ''; 
            const firebase = await webSettingsModel.findOne({'key_name' : 'FIREBASE'});
            if(firebase !== null){
                firebaseDetails = JSON.parse(firebase.value);
            }

            if(firebaseDetails && firebaseDetails.status == 1){

                if(req.file){
                    notiData.noti_image = req.file.filename;
                }
        
                let userIds =   req.body.user_ids;
                let IDList = [];
                for(let i=0; i <userIds.length; i++){
                    const idsArr = userIds[i].split('|');
                    if(idsArr.length && typeof idsArr[0] !== 'undefined' && idsArr[0] !== 'null') {
                        IDList.push(idsArr[0]);
                    }
                }

                notiData.user_ids     = (IDList) ? JSON.stringify(IDList)  : null ;
                notiData.noti_title   = (req.body.noti_title) ? req.body.noti_title  : null ;
                notiData.noti_message = (req.body.noti_msg) ? req.body.noti_msg  : null ;
                notiData.target_link  = (req.body.noti_link) ? req.body.noti_link : null ; 
            
                let insertNoti = new firbaseNotificationModel(notiData); 
                insertNoti.save();

                var query = {};
                var start = 0;
                var dataLimit = 10;
                query['role'] = 3;
                query['status'] = 1;
                query['firebase_token'] = { $ne: null };
                query['_id'] = { "$in": IDList };

                await UserModel.find(query).select('firebase_token').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
                tokenList = [];
                    if(result.length > 0){
                        for(const [key,element] of Object.entries(result)) {
                            tokenList.push(element.firebase_token); 
                        }; 
                        
                        if(tokenList.length){
                            let notiMsg = { title : notiData.noti_title,  
                                            image : config.APP_URL+'uploads/notification/'+notiData.noti_image,
                                            body  : notiData.noti_message
                                        };
                                        
                            await helper.sendNotification(notiMsg, tokenList);
                            res.json({status : 1, message:'Notification sent successfully.' });
                        }else{
                            res.json({status : 0, message:'User token not found.' });
                        }
                    } else {
                        res.json({status : 0, message:'User token not found.' });
                    }
                });

            }else{
                res.json({status : 0, message:'Please activate notification service.' });
            }

        } catch (err) {
            res.status(401).json({ status : 0, message : 'error '+ err });
        }
    }



module.exports = SETTINGS;