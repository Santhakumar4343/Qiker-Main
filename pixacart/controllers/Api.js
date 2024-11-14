const mongoose        = require('mongoose');
const moment            = require('moment'); 
const UserModel       = mongoose.model('users');
const categoryModel   = mongoose.model('category');
const subCategoryModel= mongoose.model('sub_category');
const brandModel      = mongoose.model('brands');
const orderProducts   = mongoose.model('orders_products');
const productsModel   = mongoose.model('products');
const productsVariantsModel  = mongoose.model('products_variants');
const ordersModel     = mongoose.model('orders');
const ordersInvoiceModel     = mongoose.model('orders_invoice');
const likesModel      = mongoose.model('likes');
const ratingReviewModel = mongoose.model('products_ratings');
const productsThumbModel  = mongoose.model('products_thumb');
const promotionalBannerModel  = mongoose.model('promotional_banner');
const webSettingsModel  = mongoose.model('website_settings');
const viewCountModel  = mongoose.model('product_view_count');
const notificationsModel  = mongoose.model('notifications');
const currenciesModel   = mongoose.model('currencies');
const customerQueriesModel   = mongoose.model('customer_queries');
const courierServicesModel  = mongoose.model('courier_services');
const supportTicketModel  = mongoose.model('support_tickets');
const supportReplyModel  = mongoose.model('support_replies');
const supportCategoryModel  = mongoose.model('support_categories');
const outstandingsModel  = mongoose.model('outstandings');

const config          = require('../config/config');
const helper          = require('../helpers/my_helper');
const jwt 		        = require('jsonwebtoken');
const md5             = require('md5');
const { v4 : uuid }   = require('uuid');
const fs = require('fs');
const payModeArr = helper.paymentMode;
const API = {};
API.getUserDetails = async (req, res) => {
  const userId = req.params.userId; // Extract user ID from request params

  try {
      const user = await UserModel.findById(userId);

      if (!user) {
          return res.status(404).json({ error: 'User not found' });
      }

      res.status(200).json(user);
  } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
  }
};


API.login = async (req, res) => {
  try {
    let  where = {};
    let uemail = req.body.uemail;
    if(await helper.validateEmail(uemail)){
        where.email = uemail;
    }else if(await helper.validatePhone(uemail)){
        where.mobile = uemail;
    }else{
        res.json({ status	: 0, message:'Please enter valid Email Or Mobile number.'});
        return;
    }
    if(!req.body.pwd || req.body.pwd==''){
      res.json({ status	: 0, message:'The password field required.'});
      return;
    }

    where.role = 3;
     UserModel.findOne(where, async function(err,result){
      if(result) {
         if(md5(req.body.pwd) == result.password){

            if(result.status==1){
              if(req.body.remember_me){
                res.cookie('email',req.body.uemail);
                res.cookie('password',req.body.pwd); 
              }else{
                res.clearCookie('email');
                res.clearCookie('password');
              }

              if(req.body.firebase_token){
                  await UserModel.findOneAndUpdate({'_id':result._id},{firebase_token : req.body.firebase_token}, {new: true});
              }
             
              const userData = createJwt(result);
             
              res.json({
                status	: 1,
                message	: "Login Successfully.",
                data:userData,
                //accessToken:token
              });
            }else if(result.status==2){
                res.json({ status	: 0, message:'Account is inactive.'});
            }else if(result.status==3){
                res.json({ status	: 0, message:'The account is not verified please verify the account.'});
            }
          }else{
            res.json({ status	: 0, message:'Invalid login credentials.'});
          }
        }else{
          res.json({status	: 0, message:'We couldn\'t find the account with this email address OR mobile number.'});
        }
      })
    } catch (err) {
      res.json({ status	: 0, message : 'error '+err.message})
    }
};


API.register = async (req, res) => {
  try {
    let userData = {};
    let where ={};
    let msg ='';
    let verify_otp ='';
    let is_email = false;
    let is_mobile = false;
    if(req.body.uemail){
      where = { email: req.body.uemail };
      //verify_otp = uuid();
      msg = 'Email is already used.';
      is_email = true;
    }else{
      where = { mobile: req.body.mobile };
      msg = 'Mobile number is already used.';
      is_mobile = true;
    }
      verify_otp = Math.floor(1000 + Math.random() * 9000);
      UserModel.findOne(where, function(err,result){
      if(result) {
        res.json({status : 0 , message: msg, data : userData})
      }else{
          let newUser = new UserModel ({
            'fullname'     : req.body.uname,
            'email'        : (req.body.uemail)? req.body.uemail : null ,
            'mobile'       : (req.body.mobile) ? req.body.mobile : null ,
            'password'     : md5(req.body.pwd),
            'role'         : 3,
            'profile_image': null,
            'verify_otp'   : verify_otp,
            'firebase_token' : (req.body.firebase_token)? req.body.firebase_token : null,
        });

        newUser.save( async function(err, Person){
            if(!err){

              if(is_email){
                let htmlToSend = await helper.emailTemplate({name:req.body.uname, verify_otp: verify_otp} ,'welcome');
                helper.sendMail({
                    to		  : req.body.uemail,
                    subject	: `Verify your email - ${config.APP_NAME}`,
                    message	: htmlToSend,
                    hasHTML : true,
                });
              }

              if(is_mobile){
                  helper.sendSms(req.body.mobile, 'Your verification OTP is '+verify_otp);
              }

              let userObject = Person.toObject();
              delete userObject.password;
              delete userObject.resetPasswordToken;
            //  delete userObject.verify_otp;
              res.json({status : 1, message:'Registered successfully.', data : userObject });
            }else{
              res.json({status : 0, message:'User not registered. '+err.message,  data : userData});
            }
            
        });

      }
    });

    } catch (err) {
      res.json({status : 0, 'message':err.message});
    }
};

API.updateUserProfile = async (req, res) => {
  try {
        let userData = {};
        let where = [];
        if(!req.body.user_id){
            res.json({status : 0 , message: 'The user id field required.'});
            return;
        }else if(!req.body.uname) {
            res.json({status : 0 , message: 'The user name field required.'});
            return;
        }else if(!req.body.mobile && !req.body.uemail){
            res.json({status : 0 , message: 'Mobile number OR Email address field required.'});
            return;
        }else if(req.body.mobile && !await helper.validatePhone(req.body.mobile)){
            res.json({status : 0 , message: 'Please enter valid mobile number.'});
            return;
        }else if(req.body.uemail && ! await helper.validateEmail(req.body.uemail)){
            res.json({status : 0 , message: 'Please enter valid email address.'});
            return;
        }else if(req.body.pwd && req.body.pwd.length<4){
            res.json({status : 0 , message: 'Please enter minimum four digit password.'});
            return;
        }
        if(req.body.uname){
            userData.fullname   = req.body.uname;
        }

        if(req.body.uemail){
            userData.email   = req.body.uemail;
            where.push({email : req.body.uemail});
        }

        if(req.body.mobile){
            userData.mobile  = req.body.mobile;
            where.push({mobile : req.body.mobile});
        }
        
        if(req.body.pwd){
            userData.password = md5(req.body.pwd);
        }

        if(req.body.country){
            userData.country = req.body.country;
        }

        if(req.body.state){
            userData.state = req.body.state;
        }

        if(req.body.city){
            userData.city = req.body.city;
        }

        if(req.body.postal_code){
            userData.postal_code = req.body.postal_code;
        }
       
        if(req.file){
            userData.profile_image = req.file.filename;
        }

        userData.address = (req.body.address) ? req.body.address : null ;
        userData.updatedAt = Date.now();

        await UserModel.findOne({ $or : where , $and : [{'_id': {$ne: req.body.user_id}}]}).then(async checkEmailExist=>{
            if (checkEmailExist) {
                res.json({status:0 , message:'This email address OR mobile number already exists, Please try another one.', data : {} })
            } else {                    

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
                    
                    const userData = createJwt(result);
                    res.json({ status: 1 , message: 'Profile Updated Successfully!.', data : userData });
                }).catch(err=>{
                    res.json({ status:0 , message: 'Something went wrong in update user profile. '+err.message, data : {} });                    
                });
            }
        }).catch(err=>{
            res.json({ status: 0, message: 'Something went wrong in update user profile. '+err.message, data : {} });
        })

    } catch (err) {
      res.json({status : 0, 'message':err.message, data : {} });
    }
};

API.verifyPhoneOtp = async (req, res, next) => {
  try {
    const { user_id , otp} = req.body;
    const user = await UserModel.findById(user_id);
    if (!user) {
      res.json({ status: 0, message: 'User account not found.' });
      return;
    }

    if (user.verify_otp != otp) {
      res.json({ status: 0, message: 'The OTP entered is incorrect, please enter correct OTP.' });
      return;
    }
   
    user.verify_otp  = "";
    user.status = 1;
    await user.save();

    const userData = createJwt(user);

    res.json({
      status: 1,
      message: "OTP verified successfully",
      data: userData,
    });
  } catch (err) {
    res.json({ status: 0,'message':err.message})
  }
};


function createJwt(user){
    var userData = {
      id		: user._id,
      email	: (user.email)? user.email : null,
      mobile : (user.mobile)? user.mobile : null,
      role	: user.role,
      profile_image : user.profile_image,
      fullname : user.fullname,
      country  : (user.country)? user.country : null,
      state    : (user.state)? user.state : null,
      city     : (user.city)? user.city : null,
      postal_code : (user.postal_code)? user.postal_code : null,
      status : user.status,
      address : (user.address) ? user.address : null
    };

    if(user.profile_image != null){
        userData.profile_image = config.APP_URL+'uploads/users/'+user.profile_image;
    }else{
        userData.profile_image = config.USER_DEFAULT_IMAGE;
    }

   // userData.token = jwt.sign(userData,config.keys.secret, { expiresIn: '1d'});
    userData.token = jwt.sign(userData,config.keys.secret);
    return userData;
}

API.forgot_password = async (req, res)  => {
  try {
      let where ={};
      let uemailMobile = req.body.forgot_email_mobile;
      let is_email = false;
	    let is_mobile = false;

      if(await helper.validateEmail(uemailMobile)){
          where.email = uemailMobile;
          is_email = true; 
      }else if(await helper.validatePhone(uemailMobile)){
          where.mobile = uemailMobile;
          is_mobile =true;
      }else{
          res.json({ status	: 0, message:'Please enter valid Email Or Mobile number.'});
          return;
      }

      where.role = 3;
      if(uemailMobile && req.body.user_pwd && req.body.user_pwd !==''){
          await UserModel.find(where).then(async (user)=>{
              if(user.length > 0){
              let new_password = req.body.user_pwd;
              await UserModel.updateOne({'_id':user[0].id},{password: md5(new_password)}).then(async() => {
                  res.json({
                    status : 1,
                    message: 'Password reset successfully.',
                    //data:info
                  });
                  return;
              }).catch(error => {
                res.json({
                  status : 0,
                  message: error.message,
                });
                return;
              });
              
            } else {
              res.json({
                status : 0,
                message: `We couldn't find your account.`,
              });
              return;
          }
    });
    }else if(uemailMobile){
          await UserModel.find(where).then(async (user)=>{
            if(user.length > 0){
                  if(user[0].status == 2) {
                      res.json({
                        status: 0,
                        message: `Your account is not active.`,
                      // data:''
                      });
                      return;
                  }

                  if(user[0].status==3){
                      res.json({ status	: 0, message:'The account is not verified please verify the account.'});
                      return;
                  }

                  res.json({ status	: 1, message:'The account Found.'});

            } else {
                res.json({
                  status : 0,
                  message: `We couldn't find your account.`,
                });
                return;
            }
      });
    }else{
        res.json({
            status : 0,
            message: 'New password field required.',
        });
        return;
    }

  } catch(err) {
      res.json({status : 0 , message: err.message});
  }
};

API.forgot_password_old = async (req, res)  => {
  try {
      let where ={};
      let uemailMobile = req.body.forgot_email_mobile;
      let is_email = false;
	    let is_mobile = false;

      if(await helper.validateEmail(uemailMobile)){
          where.email = uemailMobile;
          is_email = true; 
      }else if(await helper.validatePhone(uemailMobile)){
          where.mobile = uemailMobile;
          is_mobile =true;
      }else{
          res.json({ status	: 0, message:'Please enter valid Email Or Mobile number.'});
          return;
      }

      where.role = 3;

      await UserModel.find(where).then(async (user)=>{
        if(user.length > 0){
            if(user[0].status == 2) {
                res.json({
                  status: 0,
                  message: `Your account is not active.`,
                 // data:''
                });
                return;
            }

            if(user[0].status==3){
                res.json({ status	: 0, message:'The account is not verified please verify the account.'});
                return;
            }
            let token = uuid();
            await UserModel.updateOne({'_id':user[0].id},{resetPasswordToken: token}).then(async() => {
              let reset_link = `${config.APP_URL}api/reset-password/${token}`;
              if(is_mobile){
                helper.sendSms(user[0].mobile, 'Password reset link is please click here to reset password '+reset_link).then(info => {
                  //console.log(info)
                  res.json({
                    status : 1,
                    message: 'Password reset link has been sent to your mobile please check your mobile.',
                    //data:info
                  });
                  return;
                }).catch(error => {
                  res.json({
                    status: 0,
                    message: 'Unable to send password reset link on your mobile, Please try again.',
                   //data: error.message,
                  });
                  return;
                });
                
              }else if(is_email){
                let htmlToSend = await helper.emailTemplate({name:user[0].fullname, resetLink: reset_link},'forgotPassword');
                 helper.sendMail({
                  to		  : user[0].email,
                  subject	: `Password Reset Link - ${config.APP_NAME}`,
                  message	: htmlToSend,
                  hasHTML : true,
                }).then(info => {
                  console.log(info)
                  res.json({
                    status : 1,
                    message: 'Password reset link has been sent to your email.',
                    //data:info
                  });
                  return;
                }).catch(error => {
                  res.json({
                    status: 0,
                    message: 'Unable to send password reset link on your email, Please try again.',
                   // data: error.message,
                  });
                  return;
                });
              }
            }).catch(error => {
              res.json({
                status : 0,
                message: error.message,
              });
              return;
            })
        } else {
            res.json({
              status : 0,
              message: `We couldn't find your account.`,
            });
            return;
        }
    });

  } catch(err) {
      res.json({status : 0 , message: err.message});
  }
};

API.reset_password = async (req, res)  => {
  try {
      await UserModel.find({resetPasswordToken : req.body.reset_token}).then(async (user)=>{
        if(user.length > 0){
              await UserModel.updateOne({'_id':user[0].id},{ password : md5(req.body.pwd), resetPasswordToken: null}).then(async() => {
                  res.json({
                    status : 1,
                    message: 'Your password has been updated successfully.',
                  });
                  return;
              }).catch(error => {
                  res.json({
                    status : 0,
                    message: error.message,
                  });
                  return;
              })
        } else {
            res.json({
              status: 0,
              message: `Invalid reset token or expired.`,
            });
            return;
        }
    });

  } catch(err) {
      res.json({status : 0 , message: err.message});
  }
};


API.categorList = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {status : 1};
        if(req.body.cate_id){
            where._id = req.body.cate_id;
        }
        if(req.body.cate_name){
          where.cate_name = req.body.cate_name;
        }
        await categoryModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
         // console.log(result)
          if(result.length > 0){

           let returnedCate = [];
           /*for (let i = 0; i < result.length; i++) {
              returnedCate.push(result[i].transform());
            }*/
           
            result.forEach(function(element,key) {
                let cateData = {
                                  _id : element._id,
                                  cate_name : element.cate_name,
                                  status : element.status,
                                };

                if(element.cate_image != null){
                    cateData.cate_image = config.APP_URL+'uploads/category/'+element.cate_image; 
                    let fileArr  = element.cate_image.split('.');
                    cateData.thumb_image  = config.APP_URL+'uploads/category/'+fileArr[0]+'_thumb.'+fileArr[1];
                }else{
                    cateData.cate_image   = config.DEFAULT_IMAGE; 
                    cateData.thumb_image  = config.DEFAULT_IMAGE;
                }

                returnedCate.push(cateData);
            });
            res.json({
                status : 1,
                message: 'Category list fetch successfully.',
                data: returnedCate
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch category list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message, data : []  });
      }
  };

  API.subCategorList = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {status : 1};
        if(req.body.sub_cate_id){
            where._id = req.body.sub_cate_id;
        }
        if(req.body.cate_id){
          where.parent_id = req.body.cate_id;
        }
        if(req.body.cate_name){
          where.cate_name = req.body.cate_name;
        }
        await subCategoryModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){
            let returnedCate = [];
            result.forEach(function(element,key) {
                let cateData = {
                                  _id : element._id,
                                  cate_name : element.cate_name,
                                  status : element.status,
                                };

                if(element.cate_image != null){
                    cateData.cate_image = config.APP_URL+'uploads/subcategory/'+element.cate_image; 
                    let fileArr  = element.cate_image.split('.');
                    cateData.thumb_image  = config.APP_URL+'uploads/subcategory/'+fileArr[0]+'_thumb.'+fileArr[1];
                }else{
                    cateData.cate_image   = config.DEFAULT_IMAGE; 
                    cateData.thumb_image  = config.DEFAULT_IMAGE;
                }

                returnedCate.push(cateData);
            });

            res.json({
                status : 1,
                message: 'Sub category list fetch successfully.',
                data:returnedCate
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch sub category list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };

  API.brandsList = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {status : 1};
        if(req.body.brand_id){
            where._id = req.body.brand_id;
        }
        if(req.body.brand_name){
          where.brand_name = req.body.brand_name;
        }
        await brandModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){

           let returnedBrands = [];
           // for (let i = 0; i < result.length; i++) {
            //  returnedBrands.push(result[i].transform());
            //}
            result.forEach(function(element,key) {
              let brandData = {
                                _id : element._id,
                                brand_name : element.brand_name,
                                status : element.status,
                              };

              if(element.brand_image != null){
                  brandData.brand_image = config.APP_URL+'uploads/brands/'+element.brand_image; 
                  let fileArr  = element.brand_image.split('.');
                  brandData.thumb_image  = config.APP_URL+'uploads/brands/'+fileArr[0]+'_thumb.'+fileArr[1];
              }else{
                  brandData.brand_image   = config.DEFAULT_IMAGE; 
                  brandData.thumb_image  = config.DEFAULT_IMAGE;
              }

              returnedBrands.push(brandData);
          });


            res.json({
                status : 1,
                message: 'Brands list fetch successfully.',
                data: returnedBrands
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch brands list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };

  API.getPromotionalBanners = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {status : 1};
        if(req.body.banner_id){
            where._id = req.body.banner_id;
        }

        where.status = 1;
       
        await promotionalBannerModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){

           let returnedBanner = [];
           result.forEach(function(element,key) {
              let bannerData = {
                                _id : element._id,
                                banner_image : element.banner_image,
                                banner_link : element.banner_link,
                                status : element.status,
                              };

              if(element.banner_image != null){
                  bannerData.banner_image = config.APP_URL+'uploads/banners/'+element.banner_image; 
                 // let fileArr  = element.banner_image.split('.');
                 // bannerData.thumb_image  = config.APP_URL+'uploads/banners/'+fileArr[0]+'_thumb.'+fileArr[1];
              }else{
                  bannerData.banner_image   = config.DEFAULT_IMAGE; 
                 // bannerData.thumb_image  = config.DEFAULT_IMAGE;
              }

              returnedBanner.push(bannerData);
          });


            res.json({
                status : 1,
                message: 'Banners list fetch successfully.',
                data: returnedBanner
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch banners list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };


  API.productsListOld = async (req, res) => {
    try {
     //console.log(req.verifyUser.id);
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
      let prod_type = (req.body.prod_type) ? req.body.prod_type : '' ;
        let where = {};
        if(req.body.product_id){
            where._id = req.body.product_id;
        }
        if(req.body.product_name){
          where.prod_name = req.body.product_name;
        }

        if(req.body.cate_id){
          where.prod_cate = req.body.cate_id;
        }

        if(req.body.subcate_id){
          where.prod_subcate = req.body.subcate_id;
        }

        let sort_by = { _id : 'desc' };

        if(prod_type== 'most_viewed') {
            sort_by = { count_views : 'desc' };
            //where = {count_views: { $gt  : 0}}; 
        }

        await productsModel.find(where).skip(start).limit(dataLimit).sort(sort_by).then(async (result)=>{
          if(result.length > 0){
             // let returnedProducts = [];
              try {
                let retunData = await getProductDetails(req, result);
                 
                      res.json({
                        status : 1,
                        message: 'Products list fetch successfully.',
                        data: retunData
                      });

              } catch(err) {
                  res.json({
                    status : 0,
                    message: 'Something went wrong please try again. '+ err.message,
                    data:[]
                  });
              };
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch products list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };

  API.productsList = async (req, res) => {
    try {
     //console.log(req.verifyUser.id);
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
      let prod_type = (req.body.prod_type) ? req.body.prod_type : '' ;
        let where = {status : 1};
        if(req.body.product_id){
            where._id = req.body.product_id;
        }
        if(req.body.product_name){
          where.prod_name = req.body.product_name;
        }

        if(req.body.cate_id){
          where.prod_cate = req.body.cate_id;
        }

        if(req.body.subcate_id){
          where.prod_subcate = req.body.subcate_id;
        }

        if(req.body.brand_id){
          where.prod_brand = req.body.brand_id;
        }

        let sort_by = { _id : 'desc' };

        where_variant ={};
        if(Object.keys(where).length !== 0 || prod_type== 'most_viewed'){
            sort_by = { count_views : 'desc' };
            //console.log(sort_by)
            let pids = [];
            await productsModel.find(where).skip(start).limit(dataLimit).sort(sort_by).then(async (result)=>{
                if(result.length > 0){
                  for(const p of result){
                      pids.push(p._id);
                  }
                } 
            });
            where_variant = { "prod_id": { "$in": pids }};
        }
        where_variant.status = 1;

       //mongoose.set('debug', true);  //this is for query print

        await productsVariantsModel.find(where_variant).populate('prod_id').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          
          // process.exit(); // use as a die(); function

          if(result.length > 0){
             // let returnedProducts = [];
              try {
                
                let retunData =  await getVariantsDetails(req, result);
                    res.json({
                        status : 1,
                        message: 'Products list fetch successfully.',
                        data: retunData
                    });

              } catch(err) {
                  res.json({
                    status : 0,
                    message: 'Something went wrong please try again. '+ err.message,
                    data:[]
                  });
              };
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch products list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };

  API.getMostSoldProducts = async (req, res) => {
    try {
     //console.log(req.verifyUser.id);
      var start     = (req.body.start) ? parseInt(req.body.start) : 0 ;
      var dataLimit = (req.body.limit) ? parseInt(req.body.limit) : 10 ;
        let where = {status : 1};
        if(req.body.product_id){
            where._id = req.body.product_id;
        }
        if(req.body.product_name){
          where.prod_name = req.body.product_name;
        }

        if(req.body.cate_id){
          where.prod_cate = req.body.cate_id;
        }

        if(req.body.subcate_id){
          where.prod_subcate = req.body.subcate_id;
        }

        await orderProducts.aggregate([
         /* {
            "$lookup": {
              "from": "products",
              "localField": "order_pid",
              "foreignField": "_id",
              "as": "products"
            }
          },*/
          {
            $group: {
              _id: {
                order_pid: "$order_pid"
              },
             /* prodDetails: {
                $first: "$$ROOT"
              },*/
              totalSold: {
                $sum: "$prod_quantity"
              }
            }
          }
          
        ]).skip(start).limit(dataLimit).sort({ totalSold : 'desc' }).then(async (result)=>{
          if(result.length > 0){
           //console.log(result);
             let returnedProducts = [];
              try {
                for (const element of result) { 

                  where._id = element._id.order_pid;
                  where.status = 1;
                  await productsModel.findOne(where).then(async (prod)=>{
                      if(prod){
                          let retunData = await getProductDetails(req, [prod]);
                          if(retunData.length > 0){
                              returnedProducts.push(retunData[0]);
                          }
                      }
                  });
                }
               
                res.json({
                        status : 1,
                        message: 'Most sold products list fetch successfully.',
                        data: returnedProducts
                      });

              } catch(err) {
                  res.json({
                    status : 0,
                    message: 'Something went wrong please try again. '+ err.message,
                    data:[]
                  });
              };
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch products list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };


  API.getSingleProductDetails = async (req, res) => {
    try {
        var start = (req.body.start) ? req.body.start : 0;
        var dataLimit = (req.body.limit) ? req.body.limit : 1;
        let where = {};
        
        if (!req.body.product_id) {
            res.json({
                status: 0,
                message: `Product id field required.`,
                data: []
            });
            return;
        }

        where._id = req.body.product_id;
        
        await productsModel.findOne(where).populate('prod_brand', 'brand_name').then(async (element) => {
            if (element) {
                let prodData = {
                    "_id": element._id,
                    "prod_sellerid": element.prod_sellerid,
                    "prod_name": element.prod_name,
                    "prod_description": element.prod_description,
                    "prod_cate": element.prod_cate,
                    "prod_brand": (element.prod_brand) ? element.prod_brand.brand_name : '',
                    "prod_discount": "0.00",
                    "prod_discount_type": 'flat',
                    "status": element.status,
                    "featured": element.featured,
                    "isLiked": await API.isLikedCheck(element._id, req.verifyUser.id),
                    "rating_average": (element.average_rating) ? element.average_rating : "0.0",
                    "rating_user_count": (element.rating_user_count) ? element.rating_user_count : null,
                    "count_views": element.count_views,
                };

                let variants = await productsVariantsModel.find({ status: 1, prod_id: element._id });
                let variantsArr = [];
                if (variants.length > 0) {
                    for (const v of variants) {
                        let variantObj = {
                            "variant_id": v._id,
                            "pro_subtitle": v.pro_subtitle,
                            "prod_attributes": v.prod_attributes,
                            "prod_unitprice": v.prod_unitprice,
                            "prod_purchase_price": v.prod_purchase_price,
                            "prod_strikeout_price": v.prod_strikeout_price,
                            "prod_quantity": v.prod_quantity,
                            "prod_discount": v.prod_discount.toFixed(2),
                            "prod_discount_type": v.prod_discount_type,
                            "prod_sizes": v.prod_sizes,  // Include prod_sizes here
                            "isLiked": await API.isLikedCheck(v._id, req.verifyUser.id),
                        };
                        let resultt = await productsThumbModel.find({ prod_variant_id: v._id, prod_id: element._id, user_id: element.prod_sellerid }).limit(5).select('image_name');
                        let prod_images = [];
                        let thumb_images = [];
                        if (resultt.length > 0) {
                            for (let i = 0; i < resultt.length; i++) {
                                if (resultt[i].image_name != null) {
                                    prod_images.push(config.APP_URL + 'uploads/products/' + resultt[i].image_name);
                                    let fileArr = resultt[i].image_name.split('.');
                                    thumb_images.push(config.APP_URL + 'uploads/products/' + fileArr[0] + '_thumb.' + fileArr[1]);
                                } else {
                                    prod_images.push(config.DEFAULT_IMAGE);
                                    thumb_images.push(config.DEFAULT_IMAGE);
                                }
                            }
                        } else {
                            prod_images.push(config.DEFAULT_IMAGE);
                            thumb_images.push(config.DEFAULT_IMAGE);
                        }
                        variantObj["prod_image"] = prod_images;
                        variantObj["thumb_image"] = thumb_images;

                        variantsArr.push(variantObj);
                    }
                }
                prodData["prod_variants"] = variantsArr;

                res.json({
                    status: 1,
                    message: 'Product details fetched successfully.',
                    data: prodData
                });
            } else {
                res.json({
                    status: 0,
                    message: `We couldn't fetch product details.`,
                    data: []
                });
            }
        });
    } catch (err) {
        res.json({ status: 0, message: err.message });
    }
};


  async function getProductDetails (req, result) {
   // console.log(result)
      returnedProducts = [];
        for (const element of result) { 
              let variant = await productsVariantsModel.findOne({status : 1, prod_id : element._id});
              if(variant){
                let variantPrice = variant.prod_unitprice; 
                let variantDiscountType="";
                let vStrikePrice=0;
                let vDiscount=0;
                if (variant.prod_sizes && variant.prod_sizes.length > 0) {
                  variantPrice = variant.prod_sizes[0].price; 
                  variantDiscountType=variant.prod_sizes[0].discountType;
                  vStrikePrice=variant.variant.prod_sizes[0].strikePrice;
                  vDiscount=variant.prod_sizes[0].discount;
                }
                let formattedVariantPrice = variantPrice.toFixed(2); 
                let discountType=variantDiscountType;
                let strikePrice=vStrikePrice.toFixed(2);
                let discount=vDiscount.toFixed(2);
                  let prodData = {"_id": element._id,
                                  "prod_name": element.prod_name,
                                  "prod_unit": element.prod_unit,
                                  "status": element.status,
                                  "featured": element.featured,
                                  "rating_average" : (element.average_rating) ? element.average_rating : "0.0",
                                  "rating_user_count" : (element.rating_user_count) ? element.rating_user_count : null,
                                  "count_views" : element.count_views,
                                  "isLiked": await API.isLikedCheck(variant._id,req.verifyUser.id),
                                  "variant_id" : variant._id,
                                  "pro_subtitle" : variant.pro_subtitle,
                                  "prod_sellerid": variant.prod_sellerid,
                                  "prod_unitprice": formattedVariantPrice,
                                  "prod_strikeout_price" :strikePrice ,
                                  "prod_discount": discount.toFixed(2),
                                  "prod_discount_type": discountType,
                                  "prod_quantity": variant.prod_quantity,
                                  "prod_attributes": variant.prod_attributes,
                                  "prod_image" : '',
                                  "thumb_image" : '',
                                  };

                  let resultt = await productsThumbModel.find({prod_variant_id :variant._id, prod_id :element._id, user_id : element.prod_sellerid  }).limit(1).select('image_name');
                  let prod_images = [];
                  let thumb_images = [];
                  if(resultt.length > 0){
                        for(let i = 0; i< resultt.length; i++){
                            if(resultt[i].image_name != null){
                                prod_images.push(config.APP_URL+'uploads/products/'+resultt[i].image_name); 
                                let fileArr  = resultt[i].image_name.split('.');
                                thumb_images.push(config.APP_URL+'uploads/products/'+fileArr[0]+'_thumb.'+fileArr[1]);
                            }else{
                                prod_images.push(config.DEFAULT_IMAGE); 
                                thumb_images.push(config.DEFAULT_IMAGE);
                            }
                        }
                      
                    }else{
                        prod_images.push(config.DEFAULT_IMAGE); 
                        thumb_images.push(config.DEFAULT_IMAGE);
                    }
                    prodData["prod_image"]  = prod_images;
                    prodData["thumb_image"] = thumb_images;
                    
                    returnedProducts.push(prodData);
              }
        }
        return returnedProducts;
  }

  async function getVariantsDetails(req, result){
    let  returnedVariants =  [];
     for(const element of result){
       let variantPrice = element.prod_unitprice; // Default to prod_unitprice
       let variantDiscountType=element.discountType;
       let vStrikePrice=element.strikePrice;
       let vDiscount=element.discount;
       if (element.prod_sizes && element.prod_sizes.length > 0) {
         variantPrice = element.prod_sizes[0].price;
          vStrikePrice=element.prod_sizes[0].strikePrice;
          variantDiscountType=element.prod_sizes[0].discountType;
          vDiscount=element.prod_sizes[0].discount;
       }
       let formattedVariantPrice = variantPrice.toFixed(2); 
       let strikePrice=vStrikePrice.toFixed(2);
       let discountType=variantDiscountType;
       let discoun=vDiscount.toFixed(2);
       let variant = { "variant_id": element._id,
                       "prod_sellerid": element.prod_sellerid,
                       "pro_subtitle": element.pro_subtitle,
                       "prod_attributes": element.prod_attributes,
                       "prod_unitprice":formattedVariantPrice,
                       "prod_strikeout_price":strikePrice,
                       "prod_quantity": element.prod_quantity,
                       "prod_discount":discoun,
                       "prod_discount_type": discountType,
                       "isLiked": await API.isLikedCheck(element._id,req.verifyUser.id),
                       "status": element.status,
                     };
                    
      let prodDetails = await getProductDetailsByVariant(req, [element.prod_id]);
      if(prodDetails.length > 0){
          variant = Object.assign(variant, prodDetails[0]);
      }

      let resultt = await productsThumbModel.find({prod_variant_id :element._id,prod_id :element.prod_id, user_id : element.prod_sellerid  }).limit(1).select('image_name');
      let prod_images = [];
      let thumb_images = [];
      if(resultt.length > 0){
          for(let i = 0; i< resultt.length; i++){
              if(resultt[i].image_name != null){
                  prod_images.push(config.APP_URL+'uploads/products/'+resultt[i].image_name); 
                  let fileArr  = resultt[i].image_name.split('.');
                  thumb_images.push(config.APP_URL+'uploads/products/'+fileArr[0]+'_thumb.'+fileArr[1]);
              }else{
                  prod_images.push(config.DEFAULT_IMAGE); 
                  thumb_images.push(config.DEFAULT_IMAGE);
              }
          }
          
        }else{
            prod_images.push(config.DEFAULT_IMAGE); 
            thumb_images.push(config.DEFAULT_IMAGE);
        }async function getProductDetails(req, result) {
          returnedProducts = [];
          for (const element of result) {
              let variant = await productsVariantsModel.findOne({ status: 1, prod_id: element._id });
              if (variant) {
                  let prodData = {
                      "_id": element._id,
                      "prod_name": element.prod_name,
                      "prod_unit": element.prod_unit,
                      "status": element.status,
                      "featured": element.featured,
                      "rating_average": (element.average_rating) ? element.average_rating : "0.0",
                      "rating_user_count": (element.rating_user_count) ? element.rating_user_count : null,
                      "count_views": element.count_views,
                      "isLiked": await API.isLikedCheck(variant._id, req.verifyUser.id),
                      "variant_id": variant._id,
                      "pro_subtitle": variant.pro_subtitle,
                      "prod_sellerid": variant.prod_sellerid,
                      "prod_unitprice": variant.prod_unitprice,
                      "prod_strikeout_price": variant.prod_strikeout_price,
                      "prod_discount": variant.prod_discount.toFixed(2),
                      "prod_discount_type": variant.prod_discount_type,
                      "prod_quantity": variant.prod_quantity,
                      "prod_attributes": variant.prod_attributes,
                      "prod_sizes": variant.prod_sizes, // Add this line to include sizes
                      "prod_image": '',
                      "thumb_image": '',
                  };
      
                  let resultt = await productsThumbModel.find({ prod_variant_id: variant._id, prod_id: element._id, user_id: element.prod_sellerid }).limit(1).select('image_name');
                  let prod_images = [];
                  let thumb_images = [];
                  if (resultt.length > 0) {
                      for (let i = 0; i < resultt.length; i++) {
                          if (resultt[i].image_name != null) {
                              prod_images.push(config.APP_URL + 'uploads/products/' + resultt[i].image_name);
                              let fileArr = resultt[i].image_name.split('.');
                              thumb_images.push(config.APP_URL + 'uploads/products/' + fileArr[0] + '_thumb.' + fileArr[1]);
                          } else {
                              prod_images.push(config.DEFAULT_IMAGE);
                              thumb_images.push(config.DEFAULT_IMAGE);
                          }
                      }
                  } else {
                      prod_images.push(config.DEFAULT_IMAGE);
                      thumb_images.push(config.DEFAULT_IMAGE);
                  }
                  prodData["prod_image"] = prod_images;
                  prodData["thumb_image"] = thumb_images;
      
                  returnedProducts.push(prodData);
              }
          }
          return returnedProducts;
      }
      
        variant["prod_image"]  = prod_images;
        variant["thumb_image"] = thumb_images;
        returnedVariants.push(variant);
    }
    return returnedVariants;

  }


  async function getProductDetailsByVariant (req, result) {
    // console.log(result)
       returnedProducts = [];
         for (const element of result) { 
              let prodData = {
                              "_id": element._id,
                              "prod_name": element.prod_name,
                              // "isLiked": await API.isLikedCheck(element._id,req.verifyUser.id),
                               "rating_average" : (element.average_rating) ? element.average_rating : "0.0",
                               "rating_user_count" : (element.rating_user_count) ? element.rating_user_count : null,
                               "count_views" : element.count_views,
                               "prod_unit": element.prod_unit,
                               "featured": element.featured,
                               };
              returnedProducts.push(prodData);
         }
         return returnedProducts;
  }

  function getProductsImages(prod_id, user_id){
    let imgeData = [{ 'image' : '','thumb' : '' }];
    productsThumbModel.find({prod_id :prod_id, user_id : user_id  }).select('image_name').then(async (result)=>{
       if(result.length > 0){
        //console.log(result)
        
            for(let i = 0; i< result.length; i++){
                let prod_image = [];
                let thumb_image = [];
                if(result[i].image_name != null){
                    prod_image.push(config.APP_URL+'uploads/products/'+result[i].image_name); 
                    let fileArr  = result[i].image_name.split('.');
                    thumb_image.push(config.APP_URL+'uploads/brands/'+fileArr[0]+'_thumb.'+fileArr[1]);
                }else{
                    prod_image.push(config.DEFAULT_IMAGE); 
                    thumb_image.push(config.DEFAULT_IMAGE);
                }
                  
                imgeData['image'] = prod_image;
                imgeData['thumb'] = thumb_image;
                return imgeData;
            }
         }
    });
    
    //return imgeData;
  }

  API.myOrdersList = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {};
        if(!req.body.user_id){
            res.json({
              status : 0,
              message: `User id field required.`,
              data:[]
            });
            return;
        }

        where.order_userid = req.body.user_id;

        if(req.body.order_id){
            where._id = req.body.order_id;
        }
       
        await ordersModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){

           // let returnedCate = [];
           // for (let i = 0; i < result.length; i++) {
            //  returnedCate.push(result[i].transform());
            //}
            res.json({
                status : 1,
                message: 'Orders list fetch successfully.',
                data: result
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch orders list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };
  

  API.getMyOrderProducts = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {};
        if(!req.body.user_id){
            res.json({
              status : 0,
              message: `User id field required.`,
              data:[]
            });
            return;
        }

        where.order_userid = req.body.user_id;

        if(req.body.order_id){
            where._id = req.body.order_id;
        }
       
        await ordersModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){
              returnResult =[];
            for(const order of result){
              let products = await orderProducts.find({order_id : order._id});
              //console.log(products);
              if(products.length > 0){
                for(const element of products){
					      let res = {};
                    res = { 'order_id' : order._id,
                            'order_uniqueid' : order.order_uniqueid,
                            'order_status' : element.order_status,
                            'sub_orderid' : element._id,
                            'order_Option':element.prod_size,
                            'order_qty' : element.prod_quantity, 
                            'order_price' : element.prod_price,
                            'order_subTotal' : element.prod_subtotal,
                            'order_date' : moment(order.createdAt).format('DD-MMM-YYYY'),
                            'return_order' : false
                            };   

                      let orderVariant =  await productsVariantsModel.findOne(({_id : element.order_vid})).populate('prod_id');

                      let resulttt = await getVariantsDetails(req, [orderVariant]);
                      if(resulttt.length){
                          res =  Object.assign(res, resulttt[0]);
                      }
                      let tr = element.trackingDetails;
                      let track = { 'orderProcess' :  '',
                                    'ready_to_ship' : '', 
                                    'local_ware_house' : '', 
                                    'order_deliver_on' : '',
                                  };
                      if(tr){
                          track.orderProcess = (tr.confirmed) ? moment(tr.confirmed).format('DD-MMM-YYYY') : '';
                          track.ready_to_ship = (tr.readytoDispatch) ? moment(tr.readytoDispatch).format('DD-MMM-YYYY') : '';
                          track.local_ware_house = (tr.dispatched) ? moment(tr.dispatched).format('DD-MMM-YYYY') : '';
                          track.order_deliver_on = (tr.delivered) ? moment(tr.delivered).format('DD-MMM-YYYY') : '';
                      }
                    
                      if(element.order_status == 4){
                        var given = moment(tr.delivered, "YYYY-MM-DD");
                        var current = moment().startOf('day');
                        //Difference in number of days
                        let diffrence = given.diff(current, 'days', false)+2; // true|false for fraction value
                       
                        //console.log(diffrence)
                          if(diffrence < 0){
                              res.return_order = true;
                          }
                      }
                      


                      res.tracking = track;

                      returnResult.push(res);
                   
                }
              }
              
            }



            res.json({
                status : 1,
                message: 'Orders item list fetch successfully.',
                data: returnResult
              });
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch orders list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };



  API.isLikedCheck = async(prod_id, prod_userid) => {
      let result = await likesModel.find({like_pid :prod_id, like_uid : prod_userid  }).select('like_pid');
      if(result.length > 0){
          return 1; 
      }else{
          return 0;
      }
  }

  API.doProducstLikes = async (req, res) => {
    try {
        let where ={};
        if(!req.body.user_id){
            res.json({
              status : 0,
              message: `User id field required.`,
            });
            return;
        }else if(!req.body.product_id){
            res.json({
              status : 0,
              message: `Product variant id field required.`,
            });
            return;
        }

        where.like_uid = req.body.user_id;
        where.like_pid = req.body.product_id;

        likesModel.findOne(where, function(err,result){
        if(result) {
            likesModel.findOneAndDelete(where, (err, removeLike) => {
              if(!err) {
                  res.send({ status: 1,'message':'You unlike this product.','data':removeLike})
              } else {
                  res.send({ status:0,'message':'Something went wrong. '+err.message,'data':{} });
              }
          })
        }else{
            let newLike = new likesModel(where);
  
            newLike.save( async function(err, Likes){
              if(!err){
                  res.json({status : 1, message:'You liked this product.', data : Likes });
              }else{
                  res.json({status : 0, message:'Something went wrong. '+err.message,  data : {} });
              }
        });
  
        }
      });
  
      } catch (err) {
        res.json({status : 0, 'message':err.message});
      }
  };

  API.getMyWishlist = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {};
        if(!req.body.user_id){
            res.json({
              status : 0,
              message: `User id field required.`,
              data:[]
            });
            return;
        }

        where.like_uid = req.body.user_id;

        await likesModel.find(where).populate('like_pid').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
          if(result.length > 0){

            console.log(result)
            let returnResult =[];
              for (const [key , element ] of Object.entries(result)) { 
                  if(element.like_pid){
                    let res = {};
                    /*let res = {
                          "_id": element._id,
                          "like_pid": {},
                          "like_uid": element.like_uid,
                          "createdAt": element.createdAt,
                          "updatedAt": element.updatedAt,
                          }*/
                    let resulttt = await getVariantsDetails(req, [element.like_pid]); //await getProductDetails(req, [element.like_pid]);
                    if(resulttt.length){
                      res =  resulttt[0];
                    }
                    returnResult.push(res);
                  }
            }
			  
			  if(returnResult.length > 0){
				  res.json({
					  status : 1,
					  message: 'Wishlist list fetch successfully.',
					  data: returnResult
					});
			  }else{
					res.json({
						status : 0,
						message: `We couldn't fetch Wishlist list.`,
						data:[]
					});
			  }
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch Wishlist list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };

  API.createReviewRating = async (req, res) => {
    try {
        let where ={};
        if(!req.body.user_id){

            res.json({
              status : 0,
              message: `User id field required.`,
            });
            return;
        }else if(!req.body.product_id){
            res.json({
              status : 0,
              message: `Product id field required.`,
            });
            return;
        }else if(!req.body.prod_rating){
            res.json({
              status : 0,
              message: `Rating field required.`,
            });
            return;
        }else if(!req.body.prod_review){
          res.json({
            status : 0,
            message: `Review field required.`,
          });
          return;
        }

        where.rating_uid = req.body.user_id;
        where.rating_pid = req.body.product_id;

        ratingReviewModel.findOne(where, function(err,result){
        if(result) {
            res.send({ status: 1,'message':'You have already rated this product.','data':result})
        }else{
            where.rating = req.body.prod_rating;
            where.review = req.body.prod_review;

            let newReview = new ratingReviewModel(where);
  
            newReview.save( async function(err, Rating){
              if(!err){
                let aveRating = await calculateAverageRating(req.body.product_id);
                await productsModel.findOneAndUpdate({_id : req.body.product_id}, {average_rating : aveRating.averageRating, rating_user_count : aveRating.totalReviews});
                res.json({status : 1, message:'You have rated this product successfully.', data : Rating });
              }else{
                  res.json({status : 0, message:'Something went wrong. '+err.message,  data : [] });
              }
            });
          }
      });
  
      } catch (err) {
        res.json({status : 0, 'message':err.message});
      }
  };

  API.getProductsReviews = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
        let where = {};
       /* if(!req.body.product_id){
            res.json({
              status : 0,
              message: `Product id field required.`,
              data:[]
            });
            return;
        }*/
        if(req.body.product_id){
            where.rating_pid = req.body.product_id;
        }
        if(req.body.user_id){
            where.rating_uid = req.body.user_id;
        }
       
        await ratingReviewModel.find(where).populate('rating_pid').populate('rating_uid').skip(start).limit(dataLimit).then(async (result)=>{
          if(result.length > 0){
			    let returnResult =[];
            for (const [key , element ] of Object.entries(result)) { 
              if(element.rating_pid){
                let res = {};
                  res = {
                      "review_id": (element._id) ? element._id : '',
                      "rating_pid": (element.rating_pid) ? element.rating_pid._id : '',
                      "rating_uid": (element.rating_uid) ? element.rating_uid._id : '',
                      "rating_uname": (element.rating_uid) ? element.rating_uid.fullname : '',
                      "rating": element.rating,
                      "review": element.review,
                      "helpful_count": element.helpful_count,
                      "createdAt": moment(element.createdAt).format('DD-MMM-YYYY'),
                      }

                    if(element.rating_uid && element.rating_uid.profile_image != null){
                      res.rating_user_image = config.APP_URL+'uploads/users/'+element.rating_uid.profile_image;
                    }else{
                      res.rating_user_image = config.USER_DEFAULT_IMAGE;
                    }
                
                let resulttt = await getProductDetails(req, [element.rating_pid]);
                if(resulttt.length){
                  //res =  resulttt[0];
                  res =  Object.assign(res, resulttt[0]);
                }
					    returnResult.push(res);
				    }
          }
			  
			  if(returnResult.length > 0){
			  		res.json({
					  status : 1,
					  message: 'Reviews list fetch successfully.',
					  data: returnResult
					});
			  }else{
				  res.json({
					status : 0,
					message: `We couldn't fetch Reviews list.`,
					data:[]
				  });
			  }
                  
          } else {
              res.json({
                status : 0,
                message: `We couldn't fetch Reviews list.`,
                data:[]
              });
          }
        });
      } catch (err) {
        res.json({ status : 0, message : err.message });
      }
  };


API.orderPlaceOLD = async (req, res) => {
    try {

        const orderData = {};
        orderData.order_uniqueid   = await helper.generateUniqueId();
        orderData.order_userid     = req.body.user_id;
        orderData.order_amount     = req.body.total_amount;
        orderData.shipping_address = req.body.shipping_address;
        orderData.billing_address  = req.body.billing_address;
        orderData.order_tax        = req.body.order_tax;
        orderData.order_discount   = req.body.order_discount;
        orderData.order_discount_type = req.body.discount_type;
        orderData.payment_mode     = req.body.payment_mode;
        orderData.payment_status   = req.body.payment_status;
        orderData.payment_details  = req.body.payment_details;
        //orderData.order_status     = 2; // pending
        
        
        let order_pids = req.body.products_details;
        order_pids = JSON.parse(order_pids);
      
        let newOrder = new ordersModel(orderData);

        newOrder.save( async function(err, order){
          if(!err){
              for (const element of order_pids) { 
                    let pids = new orderProducts({
                                                'order_id' : order._id,
                                                'invoice_id'  : await helper.generateUniqueId(),
                                                'order_pid' : element.pid,
                                                'order_vid' : element.vid,
                                                'order_uid' : req.body.user_id,
                                                'seller_id' : element.seller_id,
                                                'prod_quantity' : element.qty,
                                                'prod_price' : element.price,
                                                'prod_subtotal' : element.subtotal,
                                              });

                    await pids.save();
              }
              
              insertNoti = new notificationsModel({ noti_status : 1,
                                                    noti_type: 1,
                                                    from_user: req.body.user_id,
                                                    to_user: req.body.user_id,
                                                    reference_id: order._id,
                                                  });
              insertNoti.save();

              res.json({status : 1, message:'Order placed successfully.', data : order });
          }else{
              res.json({status : 0, message:'Something went wrong in order place. '+err.message,  data : [] });
          }
        });
          
      } catch (err) {
        res.json({status : 0, 'message':err.message});
      }
  };

  API.orderPlace = async (req, res) => {
    try {

        const orderData = {};
        orderData.order_uniqueid   = await helper.generateUniqueId();
        orderData.order_userid     = req.body.user_id;
        orderData.order_amount     = req.body.total_amount;
        orderData.shipping_address = req.body.shipping_address;
        orderData.billing_address  = req.body.billing_address;
        orderData.order_tax        = req.body.order_tax;
        orderData.order_discount   = req.body.order_discount;
        orderData.order_discount_type = req.body.discount_type;
        orderData.payment_mode     = req.body.payment_mode;
        orderData.payment_status   = req.body.payment_status;
        orderData.payment_details  = req.body.payment_details;
        //orderData.order_status     = 2; // pending
        
        let salesCommision = 0;
        let saleCommi = await helper.getWebSetting('sales_commission');
        if(saleCommi){
            salesCommision = saleCommi;
        }
        let order_pids = req.body.products_details;
        order_pids = JSON.parse(order_pids);

        let newOrder = new ordersModel(orderData);

        newOrder.save( async function(err, order){
          if(!err){
            let seller_id ='';
            let invoiceDetails ='';
            
              for (const element of order_pids) {
                   
                    if(seller_id !== element.seller_id){  //seller invoice generate
                        let seller_invoice = new ordersInvoiceModel ({
                                                  invoice_unique_id  : await helper.generateUniqueId(),
                                                  main_order_id : order._id,
                                                  seller_id: element.seller_id,
                                                  order_uid : req.body.user_id,
                                              });
                          invoiceDetails  = await seller_invoice.save();  
                          seller_id = element.seller_id;                       
                    }
                        
                    let pids = new orderProducts({
                                                'order_id' : order._id,
                                                'invoice_id'  : invoiceDetails._id,
                                                'prod_unique_id'  : await helper.generateUniqueId(),
                                                'order_pid' : element.pid,
                                                'order_vid' : element.vid,
                                                'order_uid' : req.body.user_id,
                                                'seller_id' : element.seller_id,
                                                'prod_size':element.selectedSize,
                                                'prod_quantity' : element.qty,
                                                'prod_price' : element.price,
                                                'prod_subtotal' : element.subtotal,
                                                'trackingDetails' : { pending : new Date(),
                                                                      confirmed : '',
                                                                      readytoDispatch : '',
                                                                      dispatched : '',   
                                                                      delivered : '', 
                                                                      canceled : '',
                                                                      return_requested : '',
                                                                      refund_requested : '',
                                                                      refund_success : ''
                                                                  }
                                            });

                    await pids.save().then(async (subOrder) => {
                        
                        await helper.deductInventory(element.vid, - element.qty);
                     
                          await helper.deductSizeInventory(element.vid, element.selectedSize, -element.qty);
                        
                      
                        if(payModeArr.includes(req.body.payment_mode)){

                          let totalAmt = element.subtotal;
                          let debitCommission = ( parseFloat(totalAmt) * parseFloat(salesCommision) / 100 ).toFixed(2);
      
                          let commission = {maine_orderid : order._id,
                              invoice_id     : invoiceDetails._id, 
                              sub_orderid    : subOrder._id, 
                              seller_id      : element.seller_id,
                              debit          : debitCommission, 
                              credit         : 0,
                              entry_againts  : 4 ,   // 4 = Sales Commission
                              remark         : "Sales Commision",
                              status         : 1
                              };
                          await helper.insertOutstanding(commission);

                          let subTotalAmt  = parseFloat(totalAmt) - parseFloat(debitCommission);

                          let outstanding = {maine_orderid : order._id,
                                              invoice_id     : invoiceDetails._id, 
                                              sub_orderid    : subOrder._id, 
                                              seller_id      : element.seller_id,
                                              debit          : 0, 
                                              credit         : subTotalAmt,
                                              entry_againts  : 1 ,   // 1 = new order
                                              remark         : "New Order",
                                              status         : 1
                                            };
                            await helper.insertOutstanding(outstanding);
                            
                        }

                        insertNoti = new notificationsModel({ noti_status : 2,
                                                              noti_type: 1,
                                                              from_user: element.seller_id,
                                                              to_user: req.body.user_id,
                                                              reference_id: subOrder._id,
                                                            });
                        insertNoti.save();

                        sellerNoti = new notificationsModel({ noti_status : 9,
                                                              noti_type: 1,
                                                              from_user: req.body.user_id,
                                                              to_user: element.seller_id,
                                                              reference_id: subOrder._id,
                                                            });

                        sellerNoti.save();     
                        let  variant = await productsVariantsModel.findOne({_id : element.vid});                                    
                        let token =  await helper.getUserDetails(req.body.user_id, 'firebase_token');                                       
                        let notiMsg = { title : variant.pro_subtitle,
                                        image : await helper.getVariantSingleImage(element.vid),
                                        body : await helper.getNotiMsg(insertNoti.noti_status, type = 1) // type 1 for order
                                      };
                        const findArrey=variant.prod_sizes;
                         const findStrikeOutPrice=findArrey.find((e=>e.size===pids.prod_size))     
                             
                                      const user = await UserModel.findById(pids.order_uid);
                                      const seller= await UserModel.findById(seller_id);
                        await helper.sendNotification(notiMsg, token);
                        await helper.sendEmailForConfirmation(
                          user.email,
                          user.fullname,
                          pids.order_id,
                          pids.order_pid,
                          variant.pro_subtitle,
                          notiMsg.image,
                          pids.prod_size,
                          pids.prod_quantity,
                         findStrikeOutPrice.strikePrice,
                         findStrikeOutPrice.discount,
                          pids.prod_price,
                          pids.prod_subtotal,
                         "Pending" // Pass tracking details here
                      );
                      await helper.sendEmailForConfirmation(
                        seller.email,
                        seller.fullname,
                        pids.order_id,
                        pids.order_pid,
                        variant.pro_subtitle,
                        notiMsg.image,
                        pids.prod_size,
                        pids.prod_quantity,
                        findStrikeOutPrice.strikePrice,
                        findStrikeOutPrice.discount,
                        pids.prod_price,
                        pids.prod_subtotal,
                        "Pending" // Pass tracking details here
                    );
                    });
              }
              
              
              res.json({status : 1, message:'Order placed successfully.', data : order });
          }else{
              res.json({status : 0, message:'Something went wrong in order place. '+err.message,  data : [] });
          }
        });
          
      } catch (err) {
        res.json({status : 0, 'message':err.message});
      }
  };




API.getPaymentGateways = async (req, res) => {
    try {
        const data = [];
        settingData = await webSettingsModel.find();
        let page = {};
        let appSetings = {};
        appSetings.cod_status = 0;
        appSetings.RAZORPAY_DETAILS ={};
        appSetings.PAYSTACK_DETAILS ={};
        appSetings.STRIPE_DETAILS   ={};
        if(settingData.length>0){
            for (const element of settingData){
              
              if(element.key_name =='RAZORPAY_DETAILS'){
                  appSetings = Object.assign(appSetings,JSON.parse(element.value));
                  appSetings = Object.assign(appSetings,{'RAZORPAY_DETAILS' : JSON.parse(element.value)});
                  //data.push(appSetings)
              }  

              if(element.key_name =='PAYSTACK_DETAILS'){
                  appSetings = Object.assign(appSetings,{'PAYSTACK_DETAILS' : JSON.parse(element.value)});
                  //data.push(appSetings)
              } 

              if(element.key_name =='STRIPE_DETAILS'){
                  appSetings = Object.assign(appSetings,{'STRIPE_DETAILS' : JSON.parse(element.value)});
                  //data.push(appSetings)
              } 

              if(element.key_name =='PAYPAL_DETAILS'){
                  appSetings = Object.assign(appSetings,{'PAYPAL_DETAILS' : JSON.parse(element.value)});
                  //data.push(appSetings)
              } 

              if(element.key_name =='privacy_policy_page'){
                  appSetings.privacy_policy_page = JSON.parse(element.value);
                 // data.push(appSetings)
              }  

              if(element.key_name =='cash_on_delivery'){
                coddd_status = JSON.parse(element.value);
                appSetings.cod_status = coddd_status.status;
              }
              
            }
        }
        
        appSetings.currency_code   = "USD";
        appSetings.currency_symbol = "$";
        let currencies = await currenciesModel.findOne({status : 1});
        if(currencies){
            appSetings.currency_code   = currencies.currency_code;
            appSetings.currency_symbol = currencies.currency_symbol;
        }
          
        if(req.verifyUser.id){
            let uid =  req.verifyUser.id;
            appSetings.notifications_count =  await notificationsModel.countDocuments({to_user : uid, view_status : 0});
            appSetings.wishlist_count      =  await likesModel.countDocuments({like_uid : uid});
            appSetings.myorder_count       =  await orderProducts.countDocuments({order_uid : uid});
        }

        appSetings.support_contact_number = '1234567890';
            
        res.json({status : 1, message:'Payment Gateways details fetch successfully.', data : appSetings });
    } catch (err) {
        res.json({status : 0, 'message':err.message, data : [] });
    }
};


API.getNotifications = async (req, res) => {
  var start     = (req.body.start) ? req.body.start : 0 ;
  var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
    if(!req.body.user_id){
          res.json({
            status : 0,
            message: `User id field required.`,
            data:[]
          });
          return;
    }

    where = {}; 
    where.to_user = req.body.user_id;

    await notificationsModel.updateMany(where, {view_status : 1});

    await notificationsModel.find(where).skip(start).limit(dataLimit).then(async (result)=>{
        let retunData = [];
        if(result.length > 0){
          for(const element of result){
              let noti = {  noti_id : element._id,
                          noti_msg  : await helper.getNotiMsg(element.noti_status, element.noti_type) ,// type 1 for order, type 2 for support
                          noti_date : moment(element.createdAt).format('DD-MMM-YYYY'),
                          noti_status : element.noti_status,
                          noti_type :  element.noti_type,
                          ticket_id : null,
                          order_id  : null,
                          order_status : element.noti_status,
                        }
                        if(element.noti_type == 1){  // 1 for order
                            noti.order_id  = element.reference_id; 
                            let orderUniqueid = await orderProducts.findOne({_id : element.reference_id}).select('prod_unique_id');
                            if(orderUniqueid){
                                noti.order_id  = orderUniqueid.prod_unique_id; 
                            }
                            
                        }else if(element.noti_type == 2){  
                            noti.ticket_id =  element.reference_id;
                            let ticketUniqueid = await supportTicketModel.findOne({_id : element.reference_id}).select('ticket_uniqueid');
                            noti.ticket_id  = ticketUniqueid.ticket_uniqueid; 
                        }
                  

              retunData.push(noti);
          }
            res.json({status : 1, message:'Notification list fetch successfully.', data : retunData });
        }else{
            res.json({status : 0, message:'Notification not found.', data : retunData });
        }
    });
    
};

API.searchProducts = async (req, res) => {
  try {
    var start     = (req.body.start) ? parseInt(req.body.start) : 0 ;
    var dataLimit = (req.body.limit) ? parseInt(req.body.limit) : 10 ;
    let query = {};
    if(req.body.search_keyword){
		    let search_keyword = req.body.search_keyword;
		    let regex = new RegExp(search_keyword,'i');
    	  query = { $or: [{ prod_name : regex} , { prod_description : regex }] } ;
    }
    query.status = 1;
    
    let searchList = [];
    await productsModel.aggregate([
      { 
          $match: query 
      },
    ]).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
        if(result.length){
            for(const element of result){
                let prod = {//id : element._id ,
                            name : element.prod_name,
                            type : 'product'
                            };
                searchList.push(prod);
            }
        }


    });
     
   /* query = { $or: [{ brand_name : regex}] } ;
    await brandModel.aggregate([
      { 
          $match: query 
      },
    ]).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
        if(result.length){  
            for(const element of result){
              let brand = {//id : element._id ,
                          name : element.brand_name,
                          type : 'brand'
                          };
              searchList.push(brand);
            }
        }
    });

    query = { $or: [{ cate_name : regex}] } ;
    await categoryModel.aggregate([
      { 
          $match: query 
      },
    ]).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
        if(result.length){
            for(const element of result){
                let category = {//id : element._id ,
                            name : element.cate_name,
                            type : 'category'
                            };
                searchList.push(category);
            }
        }
    });*/
    if(searchList.length > 0){
        res.json({status : 1, message:'Search list fetch successfully.', data : searchList });
    }else{
        res.json({status : 1, message:'Not found.', data : searchList });
    }

  } catch (err) {
    res.json({status : 0, 'message':err.message, data : [] });
  }
};

API.GetMySearchContent = async (req, res) => {
  try {
    var start     = (req.body.start) ? parseInt(req.body.start) : 0 ;
    var dataLimit = (req.body.limit) ? parseInt(req.body.limit) : 10 ;
    if(!req.body.search_keyword){
          res.json({
            status : 0,
            message: `Search keyword field required.`,
            data:[]
          });
          return;
    }

    let searchType = (req.body.type)? req.body.type : '';

    let search_keyword = req.body.search_keyword;
    let regex = new RegExp(search_keyword,'i');
    let query = { $or: [{ prod_name : regex} , { prod_description : regex }] } ;
    let query1 = { $or: [{ brand_name : regex} ] } ;
    let query2 = { $or: [{ cate_name : regex} ] } ;
    let searchList = [];
    
    query.status = 1;
    query1.status = 1;
    query2.status = 1;

    let aggregate = [
              { 
                  $match: query 
              },
          ];
      if(searchType == 'brand'){
          aggregate = [
              {
                  "$lookup": {
                    "from": "brands",
                    "localField": "prod_brand",
                    "foreignField": "_id",
                    "pipeline" : [ {
                      $match : query1
                    } ],
                    "as": "brandarray"
                  }
              },
              {
                  $unwind: "$brandarray",
              }
            ]
          
      }
      
      if(searchType == 'category'){
          aggregate = [
              {
                  "$lookup": {
                    "from": "categories",
                    "localField": "prod_cate",
                    "foreignField": "_id",
                    "pipeline" : [ {
                      $match : query2
                    } ],
                    "as": "catearray"
                  }
                },
              {
                  $unwind: "$catearray",
              },
          ] 
      }
      
    await productsModel.aggregate(aggregate).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
       
        let retunData = [];
        if(result.length){
       
            resultt = result.map(doc => productsModel.hydrate(doc)); // raw data covert to mongoose doc
            for(const element of resultt){
                let searchVariant =  await productsVariantsModel.find(({status : 1, prod_id : element._id})).populate('prod_id');
                let searchProd = await getVariantsDetails(req, searchVariant);
                if(searchProd.length > 0){
                    for(const v of searchProd){
                        retunData.push(v);
                    }
                }
            }

           
            if(retunData.length > 0){
                res.json({status : 1, message:'Search list fetch successfully.', data : retunData });
            }else{
                res.json({status : 0, message:'Not found.', data : retunData });
            }
        }else{
            res.json({status : 0, message:'Not found.', data : retunData });
        }
    });

  } catch (err) {
      res.json({status : 0, 'message':err.message, data : [] });
  }
};

API.countView =  async (req, res)  => {
  // console.log(req.file);
   postData ={};
   if(!req.body.view_uid){
      res.json({
          status : 0,
          message: `User id field required.`,
          data:[]
        });
      return;
   }else if(!req.body.view_pid){
      res.json({
          status : 0,
          message: `Product id field required.`,
          data:[]
        });
      return;
  }
   postData.view_uid  = req.body.view_uid;
   postData.view_pid  = req.body.view_pid;
   
  await viewCountModel.findOne(postData).then(check=>{
      if (!check) {
          viewCountModel.create(postData).then(creatRes=>{

          productsModel.findOneAndUpdate({'_id':postData.view_pid},{$inc : {'count_views' : 1}}, {new: true}).exec();

          res.json({ status: 1 , message: 'View count Added Successfully!', 'data': creatRes });

        }).catch(err=>{
            res.json({ status: 0 , message: 'Something went wrong in insert view count.', data: err.message });
        });
      }else{
          res.json({ status: 0 , message: 'Already view count.', data: []});
      } 
  }).catch(err=>{
    res.json({ status: 0 , message: 'Something went wrong in insert view count.', data: err.message });
  });
   

}



API.getTrendingProductsList = async (req, res) => {
  try {
   //console.log(req.verifyUser.id);
    var start     = (req.body.start) ? parseInt(req.body.start) : 0 ;
    var dataLimit = (req.body.limit) ? parseInt(req.body.limit) : 10 ;
    let prod_type = (req.body.prod_type) ? req.body.prod_type : '' ;
      let where = {status : 1};
      let sort_by = { _id : 'desc' };

      where_variant ={};
      let pids = [];

    /*let aggregate =   aggregate([
        {
          $lookup: {
            from: 'products_variants', // <- schema from which data will be selected (same schema)
            "localField": "parent_id",
            "foreignField": "_id",
            pipeline: [
              { $match: { $expr: { $eq: ['$parentId', "$$id"] }, parentId: { $ne: null } } }
            ],
            as: 'parent'
          }
        }
      ])*/

      let aggregate = [
        { 
            $match: where 
        },
        {
          $lookup: {
            "from": 'products_variants', // <- schema from which data will be selected (same schema)
            "localField": "_id",
            "foreignField": "prod_id",
            pipeline: [
              { $match : { status: 1} } 
            ],
            as: 'variants'
          }
        },
        {
            $match: {
                "variants": {$ne: []}
            }
        }
      ];


      await productsModel.aggregate(aggregate).skip(start).limit(dataLimit).sort(sort_by).then(async (result)=>{
          if(result.length > 0){
            for(const p of result){
                pids.push(p._id);
            }
          } 
      });
      where_variant = { "prod_id": { "$in": pids }};
      where_variant.status = 1;
      await productsVariantsModel.find(where_variant).populate('prod_id').skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
        if(result.length > 0){
           // let returnedProducts = [];
            try {
              
              let retunData =  await getVariantsDetails(req, result);
                  res.json({
                      status : 1,
                      message: 'Products list fetch successfully.',
                      data: retunData
                  });

            } catch(err) {
                res.json({
                  status : 0,
                  message: 'Something went wrong please try again. '+ err.message,
                  data:[]
                });
            };
        } else {
            res.json({
              status : 0,
              message: `We couldn't fetch products list.`,
              data:[]
            });
        }
      });
    } catch (err) {
      res.json({ status : 0, message : err.message });
    }
};


API.getRecommendedProductsList = async (req, res) => {
  try {
    //console.log(req.verifyUser.id);
     var start     = (req.body.start) ? parseInt(req.body.start) : 0 ;
     var dataLimit = (req.body.limit) ? parseInt(req.body.limit) : 10 ;
       let where = {status : 1};
      await orderProducts.aggregate([
        /* {
           "$lookup": {
             "from": "products",
             "localField": "order_pid",
             "foreignField": "_id",
             "as": "products"
           }
         },*/
         {
           $group: {
             _id: {
               order_pid: "$order_pid"
             },
            /* prodDetails: {
               $first: "$$ROOT"
             },*/
             totalSold: {
               $sum: "$prod_quantity"
             }
           }
         }
         
       ]).skip(start).limit(dataLimit).sort({ totalSold : 'desc' }).then(async (result)=>{
         if(result.length > 0){
         
            let returnedProducts = [];
             try {
               for (const element of result) { 

                 where._id = element._id.order_pid;
                 where.status = 1;
                 await productsModel.findOne(where).then(async (prod)=>{
                  //console.log(prod);
                     if(prod){
                         let retunData = await getProductDetails(req, [prod]);
                         if(retunData.length > 0){
                             returnedProducts.push(retunData[0]);
                         }
                     }
                 });
               }
              
               res.json({
                       status : 1,
                       message: 'Recommended products list fetch successfully.',
                       data: returnedProducts
                     });

             } catch(err) {
                 res.json({
                   status : 0,
                   message: 'Something went wrong please try again. '+ err.message,
                   data:[]
                 });
             };
         } else {
             res.json({
               status : 0,
               message: `We couldn't fetch products list.`,
               data:[]
             });
         }
       });
     } catch (err) {
       res.json({ status : 0, message : err.message });
     }
};



API.getProductAverageRating = async(req, res) => {
    if(!req.body.prod_id){
      res.json({
        status : 0,
        message: `Product id field required.`,
        data:[]
      });
      return;
    }
    let prod_id = req.body.prod_id;
    let averageRating = await calculateAverageRating(prod_id);

    res.json({
        status : 1,
        message: 'Product average rating fetch successfully.',
        data: averageRating
    });
};

async function calculateAverageRating (prod_id){
    if(prod_id){
        
        let query = {rating_pid : mongoose.Types.ObjectId(prod_id)};
        
        let aggregate = [
            {
              $match: query,
            },
            {
              $group: {
                _id: {
                  rating: "$rating"
                },
                /* prodDetails: {
                  $first: "$$ROOT"
                },*/
                totalRating: {
                  $sum: "$rating"
                },
                ratingUserCount: {
                  $sum: 1
                }
                
              },
              
            }
        ];
        let ratingData = { averageRating : 0,
                      totalRatings  : 0,
                      totalReviews  : 0,
                      ratingInPercantage : {}
                    };
        let ratingInPercantage = {1 : 0, 2 : 0, 3 : 0, 4 : 0 , 5 : 0};

        let averageRating = 0;
      
        let result = await ratingReviewModel.aggregate(aggregate);
        //console.log(result);
        if(result.length > 0){
            let totalScore =0;
            let totalResponse = 0;
           
            for(const element of result){
                totalScore += parseInt(element._id.rating) * parseInt(element.ratingUserCount);
                totalResponse +=parseInt(element.ratingUserCount);
            } 

            for(const element of result){
                let per = Math.round(parseInt(element.ratingUserCount) / parseInt(totalResponse)*100);
                let rating = element._id.rating;
                ratingInPercantage[rating] = per;
            }

            averageRating =  parseFloat(totalScore /totalResponse).toFixed(1);

            ratingData.averageRating = averageRating;
            ratingData.totalRatings  = totalScore;
            ratingData.totalReviews  = totalResponse;
            ratingData.ratingInPercantage = ratingInPercantage;
            
            return ratingData;      

        }else{
            ratingData.ratingInPercantage = ratingInPercantage;
            return ratingData;
        }
    }
};

API.sendCustomerQuestion = async (req, res) => {
    if(!req.body.user_id){
        res.json({
          status : 0,
          message: `User id field required.`,
          data:[]
        });
        return;
    }

    if(!req.body.prod_id){
        res.json({
          status : 0,
          message: `Product id field required.`,
          data:[]
        });
        return;
    }

    if(!req.body.seller_id){
        res.json({
          status : 0,
          message: `Seller id field required.`,
          data:[]
        });
        return;
    }
    
    if(!req.body.question){
        res.json({
          status : 0,
          message: `Question field required.`,
          data:[]
        });
        return;
    }

    let customerQuestion = new customerQueriesModel({ seller_id : req.body.seller_id,
                                                      question_pid : req.body.prod_id,
                                                      question_uid : req.body.user_id,
                                                      question : req.body.question,
                                                    });
    customerQuestion.save( async function(err, result){
        if(!err){
            res.json({ status:1 , message: 'Questions send successfully.', data : result }); 
        }else{
            res.json({ status:0 , message: 'Something went wrong. '+err.message, data : [] }); 
        }
    });
};


API.getCustomerQuestions = async (req, res) => {

    if(!req.body.prod_id){
        res.json({
          status : 0,
          message: `Product id field required.`,
          data:[]
        });
        return;
    }
    
    let where = { question_pid : req.body.prod_id };
    await customerQueriesModel.find(where).populate('question_uid', 'fullname').then(async (result)=>{
        let retunData = [];
        if(result.length > 0){
          
            for(const element of result){
                let quetions ={
                                  _id: element._id,
                                  seller_id: element.seller_id,
                                  question_pid: element.property,
                                  question_uid: (element.question_uid) ? element.question_uid._id : null,
                                  question_uname : (element.question_uid) ? element.question_uid.fullname : null,
                                  question: element.question,
                                  answer: element.answer,
                                  status: element.status,
                                  createdAt : moment(element.createdAt).format('DD-MMM-YYYY'),
                              }
                retunData.push(quetions);
            }

          res.json({ status:1 , message: 'Customer questions list fetch successfully.', data : retunData }); 
        }else{
          res.json({ status:1 , message: 'Not found.', data : retunData }); 
        }
    }).catch(err=>{
        res.json({ status:0 , message: 'Something went wrong. '+err.message, data : [] });                    
    });
};


API.reviewHelpfulCount =  async (req, res)  => {
    if(!req.body.review_id){
        res.json({
            status : 0,
            message: `Review id field required.`,
            data:[]
          });
        return;
    }
    await ratingReviewModel.findOneAndUpdate({'_id':req.body.review_id},{$inc : {'helpful_count' : 1}}, {new: true}).then(creatRes=>{
        res.json({ status: 1 , message: 'Helpful count Added Successfully!', 'data': creatRes });
    }).catch(err=>{
        res.json({ status: 0 , message: 'Something went wrong in insert helpful count.', data: err.message });
    });
}

API.createSupportTicket = async (req, res) => {
    if(!req.body.user_id){
        res.json({
          status : 0,
          message: `User id field required.`,
          data:[]
        });
        return;
    }

    if(!req.body.sp_cateid){
        res.json({
          status : 0,
          message: `Category id field required.`,
          data:[]
        });
        return;
    }
    if(!req.body.seller_id){
      res.json({
        status : 0,
        message: `Seller id field required.`,
        data:[]
      });
      return;
  }


  if(!req.body.subject){
      res.json({
        status : 0,
        message: `Subject field required.`,
        data:[]
      });
      return;
  }

  let supportTicket = new supportTicketModel({  ticket_uniqueid: await helper.generateUniqueId(),
                                                ticket_sellerid : req.body.seller_id,
                                                ticket_pid : (req.body.sub_order_id) ? req.body.sub_order_id : null ,
                                                ticket_uid : req.body.user_id,
                                                ticket_cate : req.body.sp_cateid,
                                                subject : req.body.subject,
                                            });
  supportTicket.save( async function(err, result){
      if(!err){
          res.json({ status:1 , message: 'Ticket generated successfully.', data : result }); 
      }else{
          res.json({ status:0 , message: 'Something went wrong. '+err.message, data : [] }); 
      }
  });
};


API.getSupportTickets = async (req, res) => {

  if(!req.body.user_id){
      res.json({
        status : 0,
        message: `User id field required.`,
        data:[] 
      });
      return;
  }
  
  let where = { ticket_uid : req.body.user_id };
  await supportTicketModel.find(where).then(async (result)=>{
      let retunData = [];
      if(result.length > 0){
        
          for(const element of result){
              let ticket ={
                                _id: element._id,
                                ticket_uniqueid : element.ticket_uniqueid,
                                ticket_sellerid : element.ticket_sellerid,
                                ticket_uid: element.ticket_uid,
                                ticket_pid: element.ticket_pid,
                                ticket_cate : element.ticket_cate,
                                subject: element.subject,
                                status: element.status,
                                createdAt : moment(element.createdAt).format('DD-MMM-YYYY'),
                            }
              retunData.push(ticket);
          }

        res.json({ status:1 , message: 'Customer support ticket list fetch successfully.', data : retunData }); 
      }else{
        res.json({ status:1 , message: 'Not found.', data : retunData }); 
      }
  }).catch(err=>{
      res.json({ status:0 , message: 'Something went wrong. '+err.message, data : [] });                    
  });
};


API.getSupportTicketReply = async (req, res) => {

  if(!req.body.ticket_id){
      res.json({
        status : 0,
        message: `Ticket id field required.`,
        data:[] 
      });
      return;
  }
  
  let where = { ticket_id : req.body.ticket_id };
  await supportReplyModel.find(where).then(async (result)=>{
      let retunData = [];
      if(result.length > 0){
        
          for(const element of result){
              let ticketReply ={
                                _id: element._id,
                                ticket_id : element.ticket_id,
                                sender_id: element.sender_id,
                                receiver_id: element.receiver_id,
                                message: element.message,
                                createdAt : moment(element.createdAt).format('DD-MMM-YYYY'),
                            }
              retunData.push(ticketReply);
          }

        res.json({ status:1 , message: 'Customer support ticket reply list fetch successfully.', data : retunData }); 
      }else{
        res.json({ status:1 , message: 'Not found.', data : retunData }); 
      }
  }).catch(err=>{
      res.json({ status:0 , message: 'Something went wrong. '+err.message, data : [] });                    
  });
};


API.sendTicketReply = async (req, res) => {
  if(!req.body.ticket_id){
      res.json({
          status:0,
          message: 'Ticket id is missing.',
          data: ''
      });
      return;
  }

  if(!req.body.sender_id){
    res.json({
        status:0,
        message: 'Sender id is missing.',
        data: ''
    });
    return;
}

  if(!req.body.receiver_id){
      res.json({
          status:0,
          message: 'Receiver id is missing.',
          data: ''
      });
      return;
  }

  if(!req.body.reply_msg){
      res.json({
          status:0,
          message: 'Please enter Message.',
          data: ''
      });
      return;
  }
  let inserData = {   ticket_id : req.body.ticket_id,
                      sender_id : req.body.sender_id,
                      receiver_id :  req.body.receiver_id,
                      message : req.body.reply_msg
                  };
  await supportReplyModel.create(inserData).then(async result=>{
     res.json({ status: 1 , message: 'Reply send Successfully!.', data : result });
  }).catch(err=>{
      res.json({ status:0 , message: 'Something went wrong in send reply. '+err.message, data : {} });                    
  });
};


API.getSupportCategorList = async (req, res) => {
  try {
    var start     = (req.body.start) ? req.body.start : 0 ;
    var dataLimit = (req.body.limit) ? req.body.limit : 10 ;
      let where = {status : 1};
      await supportCategoryModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
       // console.log(result)
        if(result.length > 0){
            res.json({
              status : 1,
              message: 'Support category list fetch successfully.',
              data: result
            });
                
        } else {
            res.json({
              status : 0,
              message: `We couldn't fetch category list.`,
              data:[]
            });
        }
      });
    } catch (err) {
      res.json({ status : 0, message : err.message, data : []  });
    }
};



API.cancelOrder = async(req, res) => {
  try{
    if(!req.body.sub_orderid){
        res.json({
            status:0,
            message: 'Order id is missing.',
            data: ''
        });
        return;
    }
    
    if(!req.body.cancel_reason){
        res.json({
            status:0,
            message: 'Cancel reason field required.',
            data: ''
        });
        return;
    }

    if(!req.body.order_status){
      res.json({
          status:0,
          message: 'Order status field required.',
          data: ''
      });
      return;
  }

    let id = req.body.sub_orderid;
    let updateData = {};
    orderStatus = req.body.order_status;
    updateData.order_status = orderStatus;
    updateData.cancel_reason = req.body.cancel_reason; // 6 = cancel

    let orderDetails =  await orderProducts.findOne({_id : id}).populate('order_id', 'payment_mode payment_status');
        if(orderDetails){
            updateData.trackingDetails =  orderDetails.trackingDetails;
            let msg = 'Order cancel requested Successfully.';
            if(orderStatus == 8 ){
                updateData.trackingDetails.return_requested = new Date();
                msg = 'Order return requested Successfully.';

            }else if(orderDetails.order_status < 5){

                if(orderDetails.order_id.payment_mode == 'COD' && orderDetails.order_id.payment_status == 2){   //payment_mode = 1 for COD and payment_status = 2 unpaid 
                    updateData.trackingDetails.canceled = new Date();
                }else if(payModeArr.includes(orderDetails.order_id.payment_mode)  && orderDetails.order_id.payment_status == 1){    //payment_mode = 2 for RAZORPAY nd payment_status = 1 paid 
                    updateData.trackingDetails.refund_requested = new Date();
                    updateData.order_status = 7;
                } 
                
            }else{
                res.json({ status: 0 , message: 'You can not cancel order after shipped.', data: [] });
                return;
            }  

            await orderProducts.findOneAndUpdate({ "_id": id },updateData, {new: true}).then(async (result)=>{
                let insertNoti = new notificationsModel({   noti_status : orderStatus,
                                                            noti_type: 1,
                                                            from_user: orderDetails.seller_id,
                                                            to_user: orderDetails.order_uid,
                                                            reference_id: orderDetails._id,
                                                        });
                                                  
                insertNoti.save();

                let notiMsg = { title : 'Order '+ helper.orderStatusLable[orderStatus],
                                image : await helper.getVariantSingleImage(orderDetails.order_vid),
                                body : await helper.getNotiMsg(orderStatus, type = 1) // type 1 for order
                              };
                let token =  await helper.getUserDetails(orderDetails.order_uid, 'firebase_token');
                await helper.sendNotification(notiMsg, token);
                res.send({ status: 1,'message': msg ,'data':result});
                
            }).catch(err=>{
                res.json({ status: 0 , message: 'Something went wrong in order cancel requested. '+ err.message, data: [] });
            });

      }else{
         res.json({ status: 0 , message: 'Order not found please contact at support.', data: [] });
      }

  } catch (err) {
    res.json({ status : 0, message : err.message, data : []  });
  }
};






API.createCourierService = async(req, res) => {
    let inserCourier = new courierServicesModel({courier_name : 'courier_name'});
    inserCourier.save();
    res.json({ status:1 , message: 'Courier service added successfully.', data : [] });
}   

API.notificationTesting = async(req, res) => {

  if(req.body.user_id){
      let token =  await helper.getUserDetails(req.body.user_id, 'firebase_token');                                       
      let notiMsg = { title : 'Testing Notifications',
                      body : await helper.getNotiMsg(notistatus = 1, type = 1) // type 1 for order
                    };
      let resp = await helper.sendNotification(notiMsg, token);
                    console.log(resp);
      res.json({status:1,message: 'Message send',data: resp});
  }else{
      res.json({
        status:0,
        message: 'User id field required.',
        data: ''
      });
      return;

  }

}

module.exports = API;