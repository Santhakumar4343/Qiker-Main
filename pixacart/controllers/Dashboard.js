const { Router } = require('express');
const express    = require('express');
const router     = express.Router();
const mongoose   = require('mongoose');
const UserModel  = mongoose.model('users');
const categoryModel  = mongoose.model('category');
const subCategoryModel  = mongoose.model('sub_category');
const brandModel = mongoose.model('brands');
const productsModel  = mongoose.model('products');
const attributesModel = mongoose.model('products_attributes');
const productsThumbModel  = mongoose.model('products_thumb');
const productsVariantsModel  = mongoose.model('products_variants');
const ordersModel  = mongoose.model('orders');
const currenciesModel   = mongoose.model('currencies');
const notificationsModel  = mongoose.model('notifications');
const { orderProducts } = require('../models/DatabaseModel');
const CourierService = require('../models/DatabaseModel').courierServices;
const {validationResult} = require('express-validator');
//const API        = require('../controllers/Api');
const config     = require('../config/config');
const helper     = require('../helpers/my_helper');
const API = require('./Api');
const fs = require('fs');
const DASHBOARD = {};



DASHBOARD.courierdashboard = async (req, res) => {
    let query = {seller_id : await helper.uid(req)}
    let isAdmin = await helper.isAdmin(req);
    let uid = await helper.uid(req)
    if(isAdmin){
        delete query.seller_id;
        uid = '';
    }

    let currency_symbol = "$";
    let currencies = await currenciesModel.findOne({status : 1});
    if(currencies){
        currency_symbol = currencies.currency_symbol;
    }

    let userCount = await UserModel.countDocuments({role : 3});
    
    let totalSale = await helper.getTotalSale(uid);
    let dailyOrderCount = await orderProducts.countDocuments(query);
    let totalRevenue = await helper.getOutstanding(uid);
    res.render('backend/courierdashboard', {
            viewTitle : 'Dashboard',
            pageTitle : 'Dashboard',
            userCount : userCount,
            dailyOrderCount : dailyOrderCount,
            totalSale : currency_symbol+' '+totalSale,
            totalRevenue : currency_symbol+' '+totalRevenue
    });
};
DASHBOARD.dashboard = async (req, res) => {
    let query = {seller_id : await helper.uid(req)}
    let isAdmin = await helper.isAdmin(req);
    let uid = await helper.uid(req)
    if(isAdmin){
        delete query.seller_id;
        uid = '';
    }

    let currency_symbol = "$";
    let currencies = await currenciesModel.findOne({status : 1});
    if(currencies){
        currency_symbol = currencies.currency_symbol;
    }

    let userCount = await UserModel.countDocuments({role : 3});
    
    let totalSale = await helper.getTotalSale(uid);
    let dailyOrderCount = await orderProducts.countDocuments(query);
    let totalRevenue = await helper.getOutstanding(uid);
    res.render('backend/dashboard', {
            viewTitle : 'Dashboard',
            pageTitle : 'Dashboard',
            userCount : userCount,
            dailyOrderCount : dailyOrderCount,
            totalSale : currency_symbol+' '+totalSale,
            totalRevenue : currency_symbol+' '+totalRevenue
    });
};

DASHBOARD.category = async (req, res) => {
    res.render('backend/category_list', {
            viewTitle : 'Categories',
            pageTitle : 'Categories List'
    });
};

// DASHBOARD.CourierService = async (req, res) => {
//     res.render('backend/courier_services', {
//             viewTitle : 'Courier Service',
//             pageTitle : 'Courier Service List'
//     });
// };

DASHBOARD.sub_category = async (req, res) => {
    let  cateList = await categoryModel.find({status: 1}).exec();
    res.render('backend/subcategory_list', {
            viewTitle : 'Sub Categories',
            pageTitle : 'Sub Categories List',
            cateList  : cateList
    }); 
};

DASHBOARD.product_attribute = async (req, res) => {
    let  cateList = await categoryModel.find({status: 1}).exec();
    res.render('backend/product_attribute', {
            viewTitle : 'Attributes',
            pageTitle : 'Attributes List',
            cateList  : cateList
    });
};

DASHBOARD.brands = async (req, res) => {
    res.render('backend/brands_list', {
            viewTitle : 'Brands',
            pageTitle : 'Brand List'
    }); 
};

DASHBOARD.products = async (req, res) => {
    let  cateList = await categoryModel.find({status: 1}).exec();
    res.render('backend/products_list', {
            isAdmin     : await helper.isAdmin(req),
            viewTitle   : 'Products',
            pageTitle   : 'Products List',
            cateList    : cateList
    }); 
};

DASHBOARD.add_product = async (req, res) => {
    let cateList = await categoryModel.find({status: 1}).exec();
    let brandsList = await brandModel.find({status: 1}).exec();
    let subcategoryList = await subCategoryModel.find({status: 1}).exec();
    var id = req.params.id;
    let prodDetails ={} ;
    let viewTitle = 'Add Product';
    let pageTitle = 'Add New Product';
    if(id){
        prodDetails = await productsModel.findOne({_id:id}).exec();
        viewTitle = 'Edit Product' ; 
        pageTitle = 'Edit Product';
    }
    
    res.render('backend/add_product', {
            viewTitle : viewTitle,
            pageTitle : pageTitle,
            cateList  : cateList,
            brandsList : brandsList,
            subcategoryList : subcategoryList,
            prodDetails : prodDetails
    }); 
};

DASHBOARD.add_product_variants = async (req, res) => {
    var prod_id = req.params.id;
    let prod_vid = (req.params.vid) ? req.params.vid : '';
    let prodDetails = {};
    let prodThumbs = [];
    let viewTitle = 'Add Product Variant';
    let pageTitle = 'products';

    let prodCate = await productsModel.findOne({ _id: prod_id }, { prod_cate: 1 }).lean().exec();
    let attributesData = await attributesModel.find({ attribute_cate: prodCate.prod_cate, status: 1 }).exec();

    if (prod_vid) {
        prodDetails = await productsVariantsModel.findOne({ _id: prod_vid }).lean().exec();
        prodThumbs = await productsThumbModel.find({ prod_variant_id: prod_vid }).lean().exec();
        
        viewTitle = 'Edit Product Variant';
        pageTitle = 'products';
    }

    res.render('backend/add_products_variants', {
        viewTitle: viewTitle,
        pageTitle: pageTitle,
        prod_id: prod_id,
        prod_vid: prod_vid,
        prodDetails: prodDetails,
        prodThumbs: prodThumbs,
        attributesData: attributesData
    });
};

 

DASHBOARD.product_wishlist = async (req, res) => {
    res.render('backend/products_wishlist', {
            viewTitle : 'Products In Wishlist',
            pageTitle : 'Product In Wishlist',
    }); 
};

DASHBOARD.product_reviews = async (req, res) => {
    res.render('backend/reviews_ratings', {
            viewTitle : 'Reviews',
            pageTitle : 'Reviews',
    }); 
};

DASHBOARD.banner = async (req, res) => {
    res.render('backend/banners', {
            viewTitle : 'Banners',
            pageTitle : 'Banners',
    }); 
};

DASHBOARD.changeNotiStatus = async (req, res) => {
    let notiData = {};
    let uid = await helper.uid(req);
    where = {}; 
    where.to_user = uid;
    await notificationsModel.updateMany(where, {view_status : 1});
    notiData.notiCount =  await notificationsModel.countDocuments({to_user : uid, view_status : 0});
    res.json({status : 1, message:'Notification status change successfully.', data : notiData });
}   

DASHBOARD.getNotification = async (req, res) => {
    var start     = (req.body.start) ? req.body.start : 0 ;
    var dataLimit = (req.body.limit) ? req.body.limit : 5 ;
    let notiData = {};
    let uid = await helper.uid(req);
    
    notiData.notiCount =  await notificationsModel.countDocuments({to_user : uid, view_status : 0});
    notiData.notiList  = '<li><a href="javascript:void(0);"><h5>Not notifications found</h5></a></li>';
    where = {}; 
    where.to_user = uid;

    let notiHtml ='';
    await notificationsModel.find(where).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
        if(result.length > 0){
            for(const element of result){
               let notiMsg =  await helper.getNotiMsg(element.noti_status, element.noti_type);
               let notiLink = await helper.getNotiLink(element.noti_status, element.noti_type);
                    notiHtml += `<li>
                                    <a href="${notiLink}">
                                        <h5>${notiMsg}</h5>
                                        <!--p>Lorem ipsum dolor sit amet, consectetuer.</p-->
                                    </a>
                                </li>`;
            }
            notiData.notiList =  notiHtml;
            res.json({status : 1, message:'Notification list fetch successfully.', data : notiData });
        }else{
            res.json({status : 1, message:'Notification not found.', data : notiData });
        }    

    });
};

DASHBOARD.create_product = async (req, res) => {
    
    postData ={};
    postData.prod_userid = req.session.user.user_id;
    postData.prod_name   = req.body.pro_name;
    postData.prod_description = req.body.pro_desc;
    postData.prod_cate = req.body.pro_cate;
    postData.prod_subcate = req.body.pro_subcate;
    postData.prod_brand = req.body.pro_brand;
    postData.prod_unit = req.body.pro_unit;
    postData.prod_unitprice = req.body.pro_unitprice;
    postData.prod_strikeout_price = req.body.pro_strikeout_price;
    postData.prod_purchase_price = req.body.pro_purchase_price;
    postData.prod_tax = req.body.pro_tax;
    postData.prod_discount = req.body.pro_discount;
    postData.prod_discount_type = req.body.pro_discount_type;
    postData.prod_quantity = req.body.pro_quantity;
    postData.prod_groupid = req.body.pro_groupid;

    if(req.files){
        for (let i = 0; i < req.files.length; i++) {
            await helper.createThumb(req.files[i], height = 64, width = 64, uploadPath = "./public/uploads/products/");
        }
    }

    if(req.body.id && req.body.id != 0) {
        
        postData.updatedAt = Date.now();
        await productsModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
            if(req.files){
                let imageInsert = [];
                for (let i = 0; i < req.files.length; i++) {
                   let imagesData = {      
                                    'prod_id' : req.body.id,
                                    'user_id' : req.session.user.user_id,
                                    'image_name' : req.files[i].filename
                                };
                    imageInsert.push(imagesData);
                }
                
                productsThumbModel.insertMany(imageInsert);
            }
            res.status(200).json({ status: 1 , message: 'Product Updated Successfully!', 'data': req.body.id });
        }).catch(err=>{
            res.status(500).json({ status:0 , message: 'Something went wrong in update product.', data: err.message });                    
        });

    } else {
        
        await  productsModel.create(postData).then(creatRes=>{
            if(req.files){
                let imageInsert = [];
                for (let i = 0; i < req.files.length; i++) {
                   let imagesData = {      
                                    'prod_id' : creatRes._id,
                                    'user_id' : creatRes.prod_userid,
                                    'image_name' : req.files[i].filename
                                };
                    imageInsert.push(imagesData);
                }
                productsThumbModel.insertMany(imageInsert);
            }
            res.status(200).json({ status: 1 , message: 'Product Added Successfully!', 'data': creatRes });
        }).catch(err=>{
            res.status(500).json({ status: 0 , message: 'Something went wrong in insert product.', data: err.message });
        })
          
    }
};



DASHBOARD.create_category = async (req, res)  => {

    postData ={};

    postData.cate_name = req.body.cate_name;
    postData.cate_tax = req.body.cate_tax;
    filePath = './public/uploads/category/';
    console.log(postData); 
    //Create thumb image
    if(req.file){
        postData.cate_image = req.file.filename;
        await helper.createThumb(req.file, height = 64, width = 64, uploadPath = filePath);
    }

    if(req.body.id && req.body.id != 0) {
        await categoryModel.findOne({'cate_name':req.body.cate_name,'_id': {$ne: req.body.id}}).then(async checkCateExist=>{
            if (checkCateExist) {
                res.status(401).json({status:0 , message:'Category name already exists, Please try another one.',data:''})
            } else {      
                
                if(req.file){
                    let  previousImage = await categoryModel.findOne({_id: req.body.id}).select("cate_image").exec();
                    if(previousImage){
                        if(previousImage.cate_image != null){
                            let imageName = previousImage.cate_image;
                            let mainImage = filePath+imageName;
                            if (fs.existsSync(mainImage)) {
                                fs.unlinkSync(mainImage); //file removed
                            }

                            let fileArr   = imageName.split('.');
                            let thumbPath = filePath+fileArr[0]+'_thumb.'+fileArr[1];

                            if (fs.existsSync(thumbPath)) {
                                fs.unlinkSync(thumbPath); //file removed
                            }
                        }   
                    }
                }
                postData.updatedAt = Date.now();
                await categoryModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                    res.status(200).json({ status: 1 , message: 'Category Updated Successfully!', 'data': req.body.id });
                }).catch(err=>{
                    res.status(500).json({ status:0 , message: 'Something went wrong in update category.', data: err.message });                    
                });
            }
        }).catch(err=>{
            res.status(500).json({ status: 0, message: 'Something went wrong in update category.', data: err.message });
        })
    } else {
        await categoryModel.findOne({'cate_name':req.body.cate_name}).then(check=>{
            if (check) {
                res.status(401).json({status: 0 ,message:'Category name already exists, Please try another one.',data:check})
            } else {
                postData.name = req.body.name;
                categoryModel.create(postData).then(creatRes=>{
                    res.status(200).json({ status: 1 , message: 'Category Added Successfully!', 'data': creatRes });
                }).catch(err=>{
                    res.status(500).json({ status: 0 , message: 'Something went wrong in insert category.', data: err.message });
                })
            }
        })
    }
}

DASHBOARD.create_subcategory = async (req, res)  => {

    postData ={};

    postData.cate_name = req.body.cate_name;
    filePath = './public/uploads/subcategory/';
    //Create thumb image
    if(req.file){
        postData.cate_image = req.file.filename;
        await helper.createThumb(req.file, height = 64, width = 64, uploadPath = filePath);
    }

    if(req.body.id && req.body.id != 0) {
        await subCategoryModel.findOne({'cate_name':req.body.cate_name,'_id': {$ne: req.body.id}}).then(async checkCateExist=>{
            if (checkCateExist) {
                res.status(401).json({status:0 , message:'Category name already exists, Please try another one.',data:''})
            } else {   
                if(req.file){
                    let  previousImage = await subCategoryModel.findOne({_id: req.body.id}).select("cate_image").exec();
                    if(previousImage){
                        if(previousImage.cate_image != null){
                            let imageName = previousImage.cate_image;
                            let mainImage = filePath+imageName;
                            if (fs.existsSync(mainImage)) {
                                fs.unlinkSync(mainImage); //file removed
                            }

                            let fileArr   = imageName.split('.');
                            let thumbPath = filePath+fileArr[0]+'_thumb.'+fileArr[1];

                            if (fs.existsSync(thumbPath)) {
                                fs.unlinkSync(thumbPath); //file removed
                            }   
                        }
                    }
                }                 
                postData.updatedAt = Date.now();
                await subCategoryModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                    res.status(200).json({ status: 1 , message: 'Category Updated Successfully!', 'data': req.body.id });
                }).catch(err=>{
                    res.status(500).json({ status:0 , message: 'Something went wrong in update category.', data: err.message });                    
                });
            }
        }).catch(err=>{
            res.status(500).json({ status: 0, message: 'Something went wrong in update category.', data: err.message });
        })
    } else {
        await subCategoryModel.findOne({'cate_name':req.body.cate_name}).then(check=>{
            if (check) {
                res.status(401).json({status: 0 ,message:'Category name already exists, Please try another one.',data:check})
            } else {
                postData.name = req.body.name;
                postData.parent_id = req.body.main_cateid;
                subCategoryModel.create(postData).then(creatRes=>{
                    res.status(200).json({ status: 1 , message: 'Category Added Successfully!', 'data': creatRes });
                }).catch(err=>{
                    res.status(500).json({ status: 0 , message: 'Something went wrong in insert category.', data: err.message });
                })
            }
        })
    }

}

DASHBOARD.create_brand = async (req, res)  => {
  
    postData ={};
    filePath = './public/uploads/brands/';
    //Create thumb image
    if(req.file){
        postData.brand_image = req.file.filename;
        await helper.createThumb(req.file, height = 64, width = 64, uploadPath = filePath);
    }

    postData.brand_name = req.body.brand_name;

    if(req.body.id && req.body.id != 0) {
        await brandModel.findOne({'brand_name':req.body.brand_name,'_id': {$ne: req.body.id}}).then(async checkBrandExist=>{
            if (checkBrandExist) {
                res.status(401).json({status:0 , message:'Brand name already exists, Please try another one.',data:''})
            } else {                    
                if(req.file){
                    let  previousImage = await brandModel.findOne({_id: req.body.id}).select("brand_image").exec();
                    if(previousImage && previousImage.brand_image != null){
                        let imageName = previousImage.brand_image;
                        let mainImage = filePath+imageName;
                        if (fs.existsSync(mainImage)) {
                            fs.unlinkSync(mainImage); //file removed
                        }

                       let fileArr   = imageName.split('.');
                       let thumbPath = filePath+fileArr[0]+'_thumb.'+fileArr[1];

                        if (fs.existsSync(thumbPath)) {
                            fs.unlinkSync(thumbPath); //file removed
                        }   
                    }
                }

                postData.updatedAt = Date.now();
                await brandModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                    res.status(200).json({ status: 1 , message: 'Brand Updated Successfully!', 'data': req.body.id });
                }).catch(err=>{
                    res.status(500).json({ status:0 , message: 'Something went wrong in update brand.', data: err.message });                    
                });
            }
        }).catch(err=>{
            res.status(500).json({ status: 0, message: 'Something went wrong in update brand.', data: err.message });
        })
    } else {
        await brandModel.findOne({'brand_name':req.body.brand_name}).then(check=>{
            if (check) {
                res.status(401).json({status: 0 ,message:'Brand name already exists, Please try another one.',data:check})
            } else {
                brandModel.create(postData).then(creatRes=>{
                    res.status(200).json({ status: 1 , message: 'Brand Added Successfully!', 'data': creatRes });
                }).catch(err=>{
                    res.status(500).json({ status: 0 , message: 'Something went wrong in insert brand.', data: err.message });
                })
            }
        })
    }

}


DASHBOARD.categorList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['cate_name'];
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
        await categoryModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await categoryModel.countDocuments();
            mytable.recordsFiltered = await categoryModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
            
                    mytable.data[key] = [ ++start,
                                          element.cate_name,
                                          helper.statusLable[element.status],
                                          `<a href="javascript:void(0);" title="Edit" class="editCate" data-cate-id="${element._id}" data-cate-name="${element.cate_name}"><i class="fas fa-edit"></i></a>`
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

DASHBOARD.subCategorList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['cate_name'];
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
        await subCategoryModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await subCategoryModel.countDocuments();
            mytable.recordsFiltered = await subCategoryModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
            
                    mytable.data[key] = [ ++start,
                                          element.cate_name,
                                          helper.statusLable[element.status],
                                          `<a href="javascript:void(0);" title="Edit" class="editSubCate" data-cate-id="${element._id}" data-cate-name="${element.cate_name}"><i class="fas fa-edit"></i></a>`
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

  DASHBOARD.brandsList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['brand_name'];
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
        await brandModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await brandModel.countDocuments();
            mytable.recordsFiltered = await brandModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
            
                    mytable.data[key] = [ ++start,
                                          element.brand_name,
                                          helper.statusLable[element.status],
                                          `<a href="javascript:void(0);" title="Edit" class="editBrand" data-brand-id="${element._id}" data-brand-name="${element.brand_name}"><i class="fas fa-edit"></i></a>`
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

  DASHBOARD.productsList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['prod_name'];
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
        await productsModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await productsModel.countDocuments();
            mytable.recordsFiltered = await productsModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
            
                    mytable.data[key] = [ ++start,
                                          element.prod_name,
                                          element.prod_purchase_price,
                                          element.prod_unitprice,
                                          element.featured,
                                          helper.statusLable[element.status],
                                          `<a href="/dashboard/add-product/${element._id}" title="Edit" class="editProduct"><i class="fas fa-edit"></i></a>`
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

  DASHBOARD.subCategoryListAjax = async (req, res) => {
    try {
      var start     = (req.body.start) ? req.body.start : 0 ;
      var dataLimit = (req.body.limit) ? req.body.limit : 100 ;
        let where = {};
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
  }


  DASHBOARD.getMonthlySale = async(req, res) => {
    let totalSale = 0;
    let query = {}; 
    let seller_id = await helper.uid(req);
    let isAdmin = await helper.isAdmin(req);
    if(!isAdmin){
        query = {seller_id : mongoose.Types.ObjectId(seller_id) };
    }

    query.order_status = 1; // 1 for deliverd
    await orderProducts.aggregate([
        { 
            $match:  query
        },
        {
            $group: {
                _id: { month: { $month: "$createdAt" }},
                totalSale: {
                    $sum: "$prod_subtotal"
                }
            }
        }
        
    ]).then(async (result)=>{
        console.log(result)
        var sale = [];
        for(const mon of [0,1,2,3,4,5,6,7,8,9,10,11]){  
            for(var ele of result){
              if(typeof ele.totalSale !== 'undefined' && ele['_id']['month'] == mon+1){
                    sale[mon]= ele['totalSale'];
                    continue;
                }else if(sale[mon] != null ){
                  continue;
                }else{
                    sale[mon]=0;
                }
            }
        }

        res.json({
            status : 1,
            message: ``,
            data:sale
          });
    });

    
};

module.exports = DASHBOARD;