const mongoose = require("mongoose");
const UserModel = mongoose.model("users");
const categoryModel = mongoose.model("category");
const subCategoryModel = mongoose.model("sub_category");
const brandModel = mongoose.model("brands");
const attributesModel = mongoose.model("products_attributes");
const productsModel = mongoose.model("products");
const productsVariantsModel = mongoose.model("products_variants");
const productsThumbModel = mongoose.model("products_thumb");
const likesModel = mongoose.model("likes");
const ratingReviewModel = mongoose.model("products_ratings");
const promotionalBannerModel = mongoose.model("promotional_banner");
const config = require("../config/config");
const helper = require("../helpers/my_helper");
const fs = require("fs");
const PRODUCTS = {};

PRODUCTS.create_product = async (req, res) => {
  postData = {};

  postData.prod_name = req.body.pro_name;
  postData.prod_description = req.body.pro_desc;
  postData.prod_cate = req.body.pro_cate;
  postData.prod_subcate = req.body.pro_subcate;
  postData.prod_brand = req.body.pro_brand;
  postData.prod_unit = req.body.pro_unit;


  const existingProduct = await productsModel.findOne({ prod_name: postData.prod_name });
  if (existingProduct && (!req.body.id || existingProduct._id.toString() !== req.body.id)) { 
      return res.status(400).json({
          status: 0,
          message: "Product name already exists.",
      });
  }


  if (req.files) {
    for (let i = 0; i < req.files.length; i++) {
      await helper.createThumb(
        req.files[i],
        (height = 64),
        (width = 64),
        (uploadPath = "./public/uploads/products/")
      );
    }
  }

  if (req.body.id && req.body.id != 0) {
    postData.updatedAt = Date.now();
    await productsModel
      .findOneAndUpdate({ _id: req.body.id }, postData)
      .then(async (result) => {
        res
          .status(200)
          .json({
            status: 1,
            message: "Product Updated Successfully!",
            data: req.body.id,
            redirect: "dashboard/products",
          });
      })
      .catch((err) => {
        res
          .status(500)
          .json({
            status: 0,
            message: "Something went wrong in update product.",
            data: err.message,
          });
      });
  } else {
    postData.prod_sellerid = req.session.user.user_id;

    await productsModel
      .create(postData)
      .then((creatRes) => {
        res
          .status(200)
          .json({
            status: 1,
            message: "Product Added Successfully!",
            data: creatRes,
            redirect: "dashboard/add-product-variant/" + creatRes._id,
          });
      })
      .catch((err) => {
        res
          .status(500)
          .json({
            status: 0,
            message: "Something went wrong in insert product.",
            data: err.message,
          });
      });
  }
};

// PRODUCTS.create_product_variants = async (req, res) => {

//     postData ={};
//     postData.prod_id = req.body.prod_id;

//     postData.pro_subtitle = req.body.pro_subtitle;
//     postData.pro_sku = req.body.pro_sku;
//     postData.prod_unitprice = req.body.pro_unitprice;
//     postData.prod_strikeout_price = req.body.pro_strikeout_price;
//     postData.prod_purchase_price = req.body.pro_purchase_price;
//     postData.prod_quantity = req.body.pro_quantity;
//     postData.prod_discount = req.body.pro_discount;
//     postData.prod_discount_type = req.body.pro_discount_type;
//     postData.status             = 1;
//     if(req.body.prod_attributes){
//         req.body.prod_attributes['Colorname'] = helper.colorlist(req.body.prod_attributes.Color);
//         postData.prod_attributes = JSON.stringify(req.body.prod_attributes);
//     }
//     if(req.files){
//         for (let i = 0; i < req.files.length; i++) {
//             await helper.createThumb(req.files[i], height = 64, width = 64, uploadPath = "./public/uploads/products/");
//         }
//     }
//     let uid = await helper.uid(req);
//     if(req.body.prod_vid && req.body.prod_vid != 0) {

//         postData.updatedAt = Date.now();
//         await productsVariantsModel.findOneAndUpdate({_id:req.body.prod_vid , prod_id :  postData.prod_id},postData).then(async result=>{
//             if(req.files){
//                 let imageInsert = [];
//                 for (let i = 0; i < req.files.length; i++) {
//                    let imagesData = {
//                                     'prod_id' : req.body.prod_id,
//                                     'prod_variant_id' : req.body.prod_vid,
//                                     'user_id' : uid,
//                                     'image_name' : req.files[i].filename
//                                 };
//                     imageInsert.push(imagesData);
//                 }

//                 productsThumbModel.insertMany(imageInsert);
//             }
//             res.status(200).json({ status: 1 , message: 'Product variant Updated Successfully!', 'data': req.body.id });
//         }).catch(err=>{
//             res.status(500).json({ status:0 , message: 'Something went wrong in update product.', data: err.message });
//         });

//     } else {
//         postData.prod_sellerid = await helper.uid(req);

//         await  productsVariantsModel.create(postData).then(creatRes=>{

//             if(req.files){
//                 let imageInsert = [];
//                 for (let i = 0; i < req.files.length; i++) {
//                    let imagesData = {
//                                     'prod_id' :  req.body.prod_id,
//                                     'prod_variant_id' : creatRes._id,
//                                     'user_id' : uid,
//                                     'image_name' : req.files[i].filename
//                                 };
//                     imageInsert.push(imagesData);
//                 }
//                 productsThumbModel.insertMany(imageInsert);
//             }
//             res.status(200).json({ status: 1 , message: 'Product variant Added Successfully!', 'data': creatRes });
//         }).catch(err=>{
//             let m =  err.code == 11000 ? 'Please provide unique SKU.' : 'Something went wrong in insert product.' ;
//             res.status(500).json({ status: 0 , message: m , data: err.message });
//         })

//     }
// };

PRODUCTS.create_product_variants = async (req, res) => {
  try {
      let postData = {
          prod_id: req.body.prod_id,
          pro_subtitle: req.body.pro_subtitle,
          pro_sku: req.body.pro_sku,
          prod_unitprice: req.body.prod_unitprice,
          prod_strikeout_price: req.body.prod_strikeout_price,
          prod_purchase_price: req.body.pro_purchase_price,
          prod_quantity: req.body.pro_quantity,
          prod_discount: req.body.prod_discount,
          prod_discount_type: req.body.prod_discount_type,
          status: 1,
          updatedAt: Date.now()
      };

      // Default discount type
      postData.prod_discount_type = "default";

      // Handle color attributes
      if (req.body.prod_attributes) {
          req.body.prod_attributes['Colorname'] = helper.colorlist(req.body.prod_attributes.Color);
          postData.prod_attributes = JSON.stringify(req.body.prod_attributes);
      }

      let uid = await helper.uid(req);
      postData.prod_sellerid = uid;

      // Separate prod_sizes and array data
      let sizesData = [];
      if (req.body.prod_sizes && Array.isArray(req.body.prod_sizes)) {
          sizesData = req.body.prod_sizes.map((sizeObj, index) => ({
              size: sizeObj.size,
              quantity: sizeObj.quantity || 0,
              strikePrice: sizeObj.strikePrice || 0,
              discountType: sizeObj.discountType || "",
              discount: sizeObj.discount || "",
              price: sizeObj.price || 0,
              minOrder:sizeObj.minOrder||0,
              
          }));
      }

      // Handle additional arrays
      if (req.body.sizes && Array.isArray(req.body.sizes)) {
          req.body.sizes.forEach((size, index) => {
              const sizeObj = {
                  size: size,
                  quantity: req.body.quantities[index] || 0,
                  strikePrice: req.body.strikePrices[index] || 0,
                  discountType: req.body.discountTypes[index] || "",
                  discount: req.body.discounts[index] || 0,
                  price: req.body.prices[index] || 0,
                  minOrder:req.body.minOrders[index]||0,
             
              };

              // If sizesData already contains the size, update it; otherwise, add new size
              const existingIndex = sizesData.findIndex(item => item.size === sizeObj.size);
              if (existingIndex !== -1) {
                  sizesData[existingIndex] = { ...sizesData[existingIndex], ...sizeObj };
              } else {
                  sizesData.push(sizeObj);
              }
          });
      }

      postData.prod_sizes = sizesData;

      if (req.body.prod_vid && req.body.prod_vid != 0) {
          // Updating existing product variant
          const existingVariant = await productsVariantsModel.findOne({ _id: req.body.prod_vid, prod_id: postData.prod_id });

          if (existingVariant) {
              await productsVariantsModel.findOneAndUpdate(
                  { _id: req.body.prod_vid, prod_id: postData.prod_id },
                  postData
              ).then(async result => {
                  if (req.files) {
                      let imageInsert = [];
                      for (let i = 0; i < req.files.length; i++) {
                          let imagesData = {
                              'prod_id': req.body.prod_id,
                              'prod_variant_id': req.body.prod_vid,
                              'user_id': uid,
                              'image_name': req.files[i].filename
                          };
                          imageInsert.push(imagesData);
                      }
                      productsThumbModel.insertMany(imageInsert);
                  }
                  res.status(200).json({ status: 1, message: 'Product variant Updated Successfully!', 'data': result });
              }).catch(err => {
                  res.status(500).json({ status: 0, message: 'Something went wrong in update product.', data: err.message });
              });
          } else {
              res.status(404).json({ status: 0, message: 'Product variant not found.', data: null });
          }
      } else {
        // Creating new product variant
        if (req.body.sizes && Array.isArray(req.body.sizes)) {
            postData.prod_sizes = req.body.sizes.map((size, index) => ({
                size: size,
                quantity: req.body.quantities[index] || 0,
                strikePrice:req.body.strikePrices[index]||0,
                    discountType:req.body.discountTypes[index]||"",
                    discount:req.body.discounts[index]||"",
                price: req.body.prices[index] || 0,  // Add price
                minOrder:req.body.minOrders[index]||0,
                
            }));
        }

        await productsVariantsModel.create(postData).then(creatRes => {
            if (req.files) {
                let imageInsert = [];
                for (let i = 0; i < req.files.length; i++) {
                    let imagesData = {
                        'prod_id': req.body.prod_id,
                        'prod_variant_id': creatRes._id,
                        'user_id': uid,
                        'image_name': req.files[i].filename
                    };
                    imageInsert.push(imagesData);
                }
                productsThumbModel.insertMany(imageInsert);
            }
            res.status(200).json({ status: 1, message: 'Product variant Added Successfully!', 'data': creatRes });
        }).catch(err => {
            let m = err.code == 11000 ? 'Please provide unique SKU.' : 'Something went wrong in insert product.';
            res.status(500).json({ status: 0, message: m, data: err.message });
        });
    }
} catch (err) {
    res.status(500).json({ status: 0, message: 'Something went wrong.', data: err.message });
}
};






PRODUCTS.deleteProductVariantThumb = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Thumb id is missing.",
      data: "",
    });
    return;
  }
  let id = req.body.id.split("|");
  let thumb_id = id[0];
  let varnt_id = id[1];

  let ThumbDetails = await productsThumbModel.countDocuments({
    prod_variant_id: varnt_id,
  });
  if (ThumbDetails > 1) {
    productsThumbModel.findOneAndDelete(
      { _id: thumb_id },
      (err, previousImage) => {
        if (err) {
          res.send({ status: 0, message: err, data: "" });
        } else {
          filePath = "./public/uploads/products/";

          if (previousImage && previousImage.banner_image != null) {
            let imageName = previousImage.image_name;
            let mainImage = filePath + imageName;
            if (fs.existsSync(mainImage)) {
              fs.unlinkSync(mainImage); //file removed
            }
            let fileArr = imageName.split(".");
            let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];
            if (fs.existsSync(thumbPath)) {
              fs.unlinkSync(thumbPath); //file removed
            }
          }
          res.send({
            status: 1,
            message: "Thumb Deleted Successfully",
            data: "",
          });
        }
      }
    );
  } else {
    res.send({
      status: 0,
      message: "Unable to delete this last thumb.",
      data: "",
    });
  }
};
PRODUCTS.deleteProductVariantThumb = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Thumb id is missing.",
      data: "",
    });
    return;
  }
  let id = req.body.id.split("|");
  let thumb_id = id[0];
  let varnt_id = id[1];

  let ThumbDetails = await productsThumbModel.countDocuments({
    prod_variant_id: varnt_id,
  });
  if (ThumbDetails > 1) {
    productsThumbModel.findOneAndDelete(
      { _id: thumb_id },
      (err, previousImage) => {
        if (err) {
          res.send({ status: 0, message: err, data: "" });
        } else {
          filePath = "./public/uploads/products/";

          if (previousImage && previousImage.banner_image != null) {
            let imageName = previousImage.image_name;
            let mainImage = filePath + imageName;
            if (fs.existsSync(mainImage)) {
              fs.unlinkSync(mainImage); //file removed
            }

            let fileArr = imageName.split(".");
            let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];

            if (fs.existsSync(thumbPath)) {
              fs.unlinkSync(thumbPath); //file removed
            }
          }
          res.send({
            status: 1,
            message: "Thumb Deleted Successfully",
            data: "",
          });
        }
      }
    );
  } else {
    res.send({
      status: 0,
      message: "Unable to delete this last thumb.",
      data: "",
    });
  }
};




PRODUCTS.delete_category = async (req, res) => {
  try {
    // Extract the cateId from the request body
    const cateId = req.body.cateId;

    if (!cateId) {
      return res.status(400).json({
        status: 0,
        message: 'Category ID is required.',
      });
    }

    // Check if the category exists
    const category = await categoryModel.findById(cateId);
    if (!category) {
      return res.status(404).json({
        status: 0,
        message: 'Category not found.',
      });
    }

    // Check if there are subcategories for this category
    const hasSubcategories = await subCategoryModel.exists({ parent_id: cateId });
    if (hasSubcategories) {
      return res.status(400).json({
        status: 0,
        message: 'Category cannot be deleted because it has subcategories.',
      });
    }

    // If no subcategories, proceed with deletion
    await categoryModel.findByIdAndDelete(cateId);

    res.status(200).json({ status: 1, message: 'Category deleted successfully.' });
  } catch (error) {
    res.status(500).json({ status: 0, message: 'Error deleting category: ' + error.message });
  }
};



PRODUCTS.delete_product = async (req, res) => {
  try {
    // Extract the productId from the request body
    const productId = req.body.productId;

    if (!productId) {
      return res.status(400).json({
        status: 0,
        message: 'Product ID is required.',
      });
    }

    // Check if the product exists
    const product = await productsModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        status: 0,
        message: 'Product not found.',
      });
    }

    // Check if there are any variants associated with this product
    const variantCount = await productsVariantsModel.countDocuments({
      prod_id: productId,
    });

    if (variantCount > 0) {
      return res.status(400).json({
        status: 0,
        message: 'Cannot delete product because it has associated variants.',
      });
    }

    // If no variants exist, proceed with deleting the product
    await productsModel.findByIdAndDelete(productId);

    res.status(200).json({
      status: 1,
      message: 'Product deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: 'Error deleting product: ' + err.message,
    });
  }
};




PRODUCTS.delete_subcategory = async (req, res) => {
  try {
    // Extract the subCategoryId from the request body
    const subCategoryId = req.body.subCategoryId;

    if (!subCategoryId) {
      return res.status(400).json({
        status: 0,
        message: 'Subcategory ID is required.',
      });
    }

    // Check if the subcategory exists
    const subcategory = await subCategoryModel.findById(subCategoryId);
    if (!subcategory) {
      return res.status(404).json({
        status: 0,
        message: 'Subcategory not found.',
      });
    }

    // Check if the subcategory is referenced in any products
    const hasProducts = await productsModel.exists({
      prod_subcate: subCategoryId,
    });

    if (hasProducts) {
      return res.status(400).json({
        status: 0,
        message:
          'Subcategory cannot be deleted because it is associated with products.',
      });
    }

    // Proceed with deletion if no products are associated
    await subCategoryModel.findByIdAndDelete(subCategoryId);

    res.status(200).json({
      status: 1,
      message: 'Subcategory deleted successfully.',
    });
  } catch (err) {
    res.status(500).json({
      status: 0,
      message: 'Error deleting subcategory: ' + err.message,
    });
  }
};

PRODUCTS.create_category = async (req, res) => {
  postData = {};

  postData.cate_name = req.body.cate_name;
  postData.cate_tax = req.body.cate_tax;
  postData.cate_commission = req.body.cate_commission;
  filePath = "./public/uploads/category/";
  //Create thumb image
  if (req.file) {
    postData.cate_image = req.file.filename;
    await helper.createThumb(
      req.file,
      (height = 64),
      (width = 64),
      (uploadPath = filePath)
    );
  }

  if (req.body.id && req.body.id != 0) {
    await categoryModel
      .findOne({ cate_name: req.body.cate_name, _id: { $ne: req.body.id } })
      .then(async (checkCateExist) => {
        if (checkCateExist) {
          res
            .status(401)
            .json({ status: 0, message: "Category already exists.", data: "" });
        } else {
          if (req.file) {
            let previousImage = await categoryModel
              .findOne({ _id: req.body.id })
              .select("cate_image")
              .exec();
            if (previousImage) {
              if (previousImage.cate_image != null) {
                let imageName = previousImage.cate_image;
                let mainImage = filePath + imageName;
                if (fs.existsSync(mainImage)) {
                  fs.unlinkSync(mainImage); //file removed
                }

                let fileArr = imageName.split(".");
                let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];

                if (fs.existsSync(thumbPath)) {
                  fs.unlinkSync(thumbPath); //file removed
                }
              }
            }
          }
          postData.updatedAt = Date.now();
          await categoryModel
            .findOneAndUpdate({ _id: req.body.id }, postData)
            .then(async (result) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Category Updated Successfully!",
                  data: req.body.id,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in update category.",
                  data: err.message,
                });
            });
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json({
            status: 0,
            message: "Something went wrong in update category.",
            data: err.message,
          });
      });
  } else {
    await categoryModel
      .findOne({ cate_name: req.body.cate_name })
      .then((check) => {
        if (check) {
          res
            .status(401)
            .json({
              status: 0,
              message: "Category already exists.",
              data: check,
            });
        } else {
          postData.name = req.body.name;
          categoryModel
            .create(postData)
            .then((creatRes) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Category Added Successfully!",
                  data: creatRes,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in insert category.",
                  data: err.message,
                });
            });
        }
      });
  }
};

// PRODUCTS.create_subcategory = async (req, res) => {
//   postData = {};

//   postData.cate_name = req.body.cate_name;
//   filePath = "./public/uploads/subcategory/";
//   //Create thumb image
//   if (req.file) {
//     postData.cate_image = req.file.filename;
//     await helper.createThumb(
//       req.file,
//       (height = 64),
//       (width = 64),
//       (uploadPath = filePath)
//     );
//   }

//   if (req.body.id && req.body.id != 0) {
//     await subCategoryModel
//       .findOne({ cate_name: req.body.cate_name, _id: { $ne: req.body.id } })
//       .then(async (checkCateExist) => {
//         if (checkCateExist) {
//           res
//             .status(401)
//             .json({
//               status: 0,
//               message: "Category name already exists, Please try another one.",
//               data: "",
//             });
//         } else {
//           if (req.file) {
//             let previousImage = await subCategoryModel
//               .findOne({ _id: req.body.id })
//               .select("cate_image")
//               .exec();
//             if (previousImage) {
//               if (previousImage.cate_image != null) {
//                 let imageName = previousImage.cate_image;
//                 let mainImage = filePath + imageName;
//                 if (fs.existsSync(mainImage)) {
//                   fs.unlinkSync(mainImage); //file removed
//                 }

//                 let fileArr = imageName.split(".");
//                 let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];

//                 if (fs.existsSync(thumbPath)) {
//                   fs.unlinkSync(thumbPath); //file removed
//                 }
//               }
//             }
//           }
//           postData.updatedAt = Date.now();
//           await subCategoryModel
//             .findOneAndUpdate({ _id: req.body.id }, postData)
//             .then(async (result) => {
//               res
//                 .status(200)
//                 .json({
//                   status: 1,
//                   message: "Category Updated Successfully!",
//                   data: req.body.id,
//                 });
//             })
//             .catch((err) => {
//               res
//                 .status(500)
//                 .json({
//                   status: 0,
//                   message: "Something went wrong in update category.",
//                   data: err.message,
//                 });
//             });
//         }
//       })
//       .catch((err) => {
//         res
//           .status(500)
//           .json({
//             status: 0,
//             message: "Something went wrong in update category.",
//             data: err.message,
//           });
//       });
//   } else {
//     await subCategoryModel
//       .findOne({ cate_name: req.body.cate_name })
//       .then((check) => {
//         if (check) {
//           res
//             .status(401)
//             .json({
//               status: 0,
//               message: "Category name already exists, Please try another one.",
//               data: check,
//             });
//         } else {
//           postData.name = req.body.name;
//           postData.parent_id = req.body.main_cateid;
//           subCategoryModel
//             .create(postData)
//             .then((creatRes) => {
//               res
//                 .status(200)
//                 .json({
//                   status: 1,
//                   message: "Category Added Successfully!",
//                   data: creatRes,
//                 });
//             })
//             .catch((err) => {
//               res
//                 .status(500)
//                 .json({
//                   status: 0,
//                   message: "Something went wrong in insert category.",
//                   data: err.message,
//                 });
//             });
//         }
//       });
//   }
// };

PRODUCTS.create_subcategory = async (req, res) => {
  let postData = {
    cate_name: req.body.cate_name,
    parent_id: req.body.main_cateid, // Assuming this field represents the category's relation
    updatedAt: Date.now()
  };

  if (req.file) {
    postData.cate_image = req.file.filename;
    await helper.createThumb(req.file, 64, 64, "./public/uploads/subcategory/");
  }

  try {
    if (req.body.id && req.body.id != 0) {
      let checkCateExist = await subCategoryModel.findOne({
        cate_name: req.body.cate_name,
        _id: { $ne: req.body.id },
      });

      if (checkCateExist) {
        return res.status(401).json({
          status: 0,
          message: "Sub category name already exists, Please try another one.",
          data: ""
        });
      }

      if (req.file) {
        let previousImage = await subCategoryModel
          .findOne({ _id: req.body.id })
          .select("cate_image");

        if (previousImage && previousImage.cate_image) {
          let mainImage = `./public/uploads/subcategory/${previousImage.cate_image}`;
          let thumbPath = `./public/uploads/subcategory/${previousImage.cate_image.split(".")[0]}_thumb.${previousImage.cate_image.split(".")[1]}`;
          if (fs.existsSync(mainImage)) fs.unlinkSync(mainImage);
          if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
        }
      }

      await subCategoryModel.findOneAndUpdate({ _id: req.body.id }, postData);
      return res.status(200).json({
        status: 1,
        message: "Sub Category Updated Successfully!",
        data: req.body.id,
      });
    } else {
      let check = await subCategoryModel.findOne({
        cate_name: req.body.cate_name,
      });

      if (check) {
        return res.status(401).json({
          status: 0,
          message: "Sub Category name already exists, Please try another one.",
        });
      }

      postData.createdAt = Date.now();
      let creatRes = await subCategoryModel.create(postData);
      return res.status(200).json({
        status: 1,
        message: "Sub Category Added Successfully!",
        data: creatRes,
      });
    }
  } catch (err) {
    return res.status(500).json({
      status: 0,
      message: "Something went wrong.",
      data: err.message,
    });
  }
};


PRODUCTS.create_brand = async (req, res) => {
  postData = {};
  filePath = "./public/uploads/brands/";
  //Create thumb image
  if (req.file) {
    postData.brand_image = req.file.filename;
    await helper.createThumb(
      req.file,
      (height = 64),
      (width = 64),
      (uploadPath = filePath)
    );
  }

  postData.brand_name = req.body.brand_name;

  if (req.body.id && req.body.id != 0) {
    await brandModel
      .findOne({ brand_name: req.body.brand_name, _id: { $ne: req.body.id } })
      .then(async (checkBrandExist) => {
        if (checkBrandExist) {
          res
            .status(401)
            .json({
              status: 0,
              message: "Brand name already exists, Please try another one.",
              data: "",
            });
        } else {
          if (req.file) {
            let previousImage = await brandModel
              .findOne({ _id: req.body.id })
              .select("brand_image")
              .exec();
            if (previousImage && previousImage.brand_image != null) {
              let imageName = previousImage.brand_image;
              let mainImage = filePath + imageName;
              if (fs.existsSync(mainImage)) {
                fs.unlinkSync(mainImage); //file removed
              }

              let fileArr = imageName.split(".");
              let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];

              if (fs.existsSync(thumbPath)) {
                fs.unlinkSync(thumbPath); //file removed
              }
            }
          }

          postData.updatedAt = Date.now();
          await brandModel
            .findOneAndUpdate({ _id: req.body.id }, postData)
            .then(async (result) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Brand Updated Successfully!",
                  data: req.body.id,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in update brand.",
                  data: err.message,
                });
            });
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json({
            status: 0,
            message: "Something went wrong in update brand.",
            data: err.message,
          });
      });
  } else {
    await brandModel
      .findOne({ brand_name: req.body.brand_name })
      .then((check) => {
        if (check) {
          res
            .status(401)
            .json({
              status: 0,
              message: "Brand name already exists, Please try another one.",
              data: check,
            });
        } else {
          brandModel
            .create(postData)
            .then((creatRes) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Brand Added Successfully!",
                  data: creatRes,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in insert brand.",
                  data: err.message,
                });
            });
        }
      });
  }
};

PRODUCTS.create_attribute = async (req, res) => {
  postData = {};
  if (!req.body.attribute_name) {
    res.json({
      status: 0,
      message: `Attribute name field required.`,
      data: [],
    });
    return;
  } else if (!req.body.attributes_value) {
    res.json({
      status: 0,
      message: `Attribute value field required.`,
      data: [],
    });
    return;
  } else if (!req.body.attributes_cate) {
    res.json({
      status: 0,
      message: `Attribute category field required.`,
      data: [],
    });
    return;
  }
  postData.attribute_name = req.body.attribute_name;
  postData.attribute_value = JSON.stringify(req.body.attributes_value);
  postData.attribute_cate = req.body.attributes_cate;
  if (req.body.id && req.body.id != 0) {
    await attributesModel
      .findOne({
        attribute_name: req.body.attribute_name,
        _id: { $ne: req.body.id },
        attribute_cate: req.body.attributes_cate,
      })
      .then(async (checkExist) => {
        if (checkExist) {
          res
            .status(401)
            .json({
              status: 0,
              message: "Attribute name already exists, Please try another one.",
              data: "",
            });
        } else {
          postData.updatedAt = Date.now();
          await attributesModel
            .findOneAndUpdate({ _id: req.body.id }, postData)
            .then(async (result) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Attribute Updated Successfully!",
                  data: req.body.id,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in update attribute.",
                  data: err.message,
                });
            });
        }
      })
      .catch((err) => {
        res
          .status(500)
          .json({
            status: 0,
            message: "Something went wrong in update attribute.",
            data: err.message,
          });
      });
  } else {
    await attributesModel
      .findOne({
        attribute_name: req.body.attribute_name,
        attribute_cate: req.body.attributes_cate,
      })
      .then((check) => {
        if (check) {
          res
            .status(401)
            .json({
              status: 0,
              message: "Attribute name already exists, Please try another one.",
              data: check,
            });
        } else {
          attributesModel
            .create(postData)
            .then((creatRes) => {
              res
                .status(200)
                .json({
                  status: 1,
                  message: "Attribute Added Successfully!",
                  data: creatRes,
                });
            })
            .catch((err) => {
              res
                .status(500)
                .json({
                  status: 0,
                  message: "Something went wrong in insert Attribute.",
                  data: err.message,
                });
            });
        }
      });
  }
};

PRODUCTS.create_banner = async (req, res) => {
  postData = {};
  filePath = "./public/uploads/banners/";
  //Create thumb image
  if (req.file) {
    postData.banner_image = req.file.filename;
    await helper.createThumb(
      req.file,
      (width = 80),
      (height = 50),
      (uploadPath = filePath)
    );
  }

  postData.user_id = req.session.user.user_id;
  postData.banner_link = req.body.banner_link;
  promotionalBannerModel
    .create(postData)
    .then((creatRes) => {
      res
        .status(200)
        .json({
          status: 1,
          message: "Banner Added Successfully!",
          data: creatRes,
        });
    })
    .catch((err) => {
      res
        .status(500)
        .json({
          status: 0,
          message: "Something went wrong in insert banner.",
          data: err.message,
        });
    });
};

PRODUCTS.categorList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["cate_name"];
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
            $options: "i",
          };
        }
      }
    }
    await categoryModel
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

        mytable.recordsTotal = await categoryModel.countDocuments();
        mytable.recordsFiltered = await categoryModel.countDocuments(query);

        if (result.length > 0) {
          for (const [key, element] of Object.entries(result)) {
            //result.forEach(async function(element,key) {
            let checked = element.status ? "checked" : "";

            let thumb = await helper.getThumb(element.cate_image);
            mytable.data[key] = [
              ++start,
              '<img width="50px" src="/uploads/category/' + thumb + '">',
              element.cate_name,
              `<div class="toggle-wrap">
                                           <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateCateStatus">
                                           <label class="toggle-label" for="${element._id}"></label>
                                           </div>`,
              `<a href="javascript:void(0);" title="Edit" class="editCate" data-cate-id="${element._id}" data-cate-name="${element.cate_name}" data-cate-tax="${element.cate_tax}" data-commi-tax="${element.cate_commission}" style="margin-right: 10px;"><i class="fas fa-edit"></i></a>
              <a href="javascript:void(0);" title="Delete" class="deleteCate" data-cate-id="${element._id}"><i class="fa fa-trash"></i></a>`,

            ];
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

PRODUCTS.subCategorList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["cate_name"];
    var start = parseInt(req.query.start);
    var dataLimit = parseInt(req.query.length);
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
        if (
          requestColumn.searchable == "true" &&
          typeof column != "undefined"
        ) {
          query[column] = {
            $regex: text,
            $options: "i",
          };
        }
      }
    }

    await subCategoryModel
      .aggregate([
        {
          $match: {},
        },
        {
          $lookup: {
            from: "categories",
            localField: "parent_id",
            foreignField: "_id",
            as: "catArray",
          },
        },
        {
          $unwind: "$catArray",
        },
      ])
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

        mytable.recordsTotal = await subCategoryModel.countDocuments();
        mytable.recordsFiltered = await subCategoryModel.countDocuments(query);

        if (result.length > 0) {
          for (const [key, element] of Object.entries(result)) {
            let checked = element.status ? "checked" : "";
            let thumb = await helper.getThumb(element.cate_image);
            mytable.data[key] = [
              ++start,
              '<img width="50px" src="/uploads/subcategory/' + thumb + '">',
              element.cate_name,
              element.catArray["cate_name"],
              `<div class="toggle-wrap">
                <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateSubcateStatus">
                <label class="toggle-label" for="${element._id}"></label>
              </div>`,
              `<a href="javascript:void(0);" title="Edit" class="editSubCate" data-cate-id="${element._id}" data-cate-name="${element.cate_name}" data-maincate-id="${element.catArray["_id"]}" style="margin-right: 10px;"><i class="fas fa-edit"></i></a>
              <a href="javascript:void(0);" title="Delete" class="deleteSubCate" data-cate-id="${element._id}"><i class="fa fa-trash"></i></a>` 
             
            ];
            
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

PRODUCTS.brandsList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["brand_name"];
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
    await brandModel
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

        mytable.recordsTotal = await brandModel.countDocuments();
        mytable.recordsFiltered = await brandModel.countDocuments(query);

        if (result.length > 0) {
          for (const [key, element] of Object.entries(result)) {
            let checked = element.status ? "checked" : "";
            let thumb = await helper.getThumb(element.brand_image);
            mytable.data[key] = [
              ++start,
              '<img width="50px" src="/uploads/brands/' + thumb + '">',
              element.brand_name,
              `<div class="toggle-wrap">
                                           <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateBrandStatus">
                                           <label class="toggle-label" for="${element._id}"></label>
                                           </div>`,
              `<a href="javascript:void(0);" title="Edit" class="editBrand" data-brand-id="${element._id}" data-brand-name="${element.brand_name}" style="margin-right: 10px;"><i class="fas fa-edit"></i></a> 
              <a href="javascript:void(0);" title="Delete" class="deleteBrand" data-brand-id="${element._id}"><i class="fas fa-trash"></i></a>`,
              
            ];
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
// PRODUCTS.deleteBrand = async (req, res) => {
//   try {
//     const brandId = req.body.id;

//     await brandModel.findByIdAndDelete(brandId);

//     res.status(200).json({ status: 1, message: 'Brand deleted successfully.' });
//   } catch (err) {
//     res.status(400).json({ status: 0, message: 'Error deleting brand: ' + err });
//   }
// };

PRODUCTS.deleteBrand = async (req, res) => {
  try {
    const brandId = req.body.id; // Extract the id from the body

    // Check if the brand exists
    const brand = await brandModel.findById(brandId);
    if (!brand) {
      return res.status(404).json({
        status: 0,
        message: 'Brand not found.',
      });
    }

    // Check if any product is associated with this brand
    const productsUsingBrand = await productsModel.find({ prod_brand: brandId });
    if (productsUsingBrand.length > 0) {
      // If there are products using the brand, prevent deletion
      return res.status(400).json({
        status: 0,
        message: 'Brand cannot be deleted because it is associated with products.',
      });
    }

    // If no products are using the brand, proceed with deletion
    await brandModel.findByIdAndDelete(brandId);

    res.status(200).json({ status: 1, message: 'Brand deleted successfully.' });
  } catch (err) {
    res.status(400).json({ status: 0, message: 'Error deleting brand: ' + err });
  }
};





PRODUCTS.attributesList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["attribute_name"];
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
    await attributesModel
      .find(query)
      .populate("attribute_cate")
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

        mytable.recordsTotal = await attributesModel.countDocuments();
        mytable.recordsFiltered = await attributesModel.countDocuments(query);

        if (result.length > 0) {
          result.forEach(function (element, key) {
            let ulist = "<ol>";
            for (const a of JSON.parse(element.attribute_value)) {
              ulist += "<li>" + a + "</li>";
            }
            ulist += "</ol>";
            let cateName = element.attribute_cate
              ? element.attribute_cate.cate_name
              : "";
            let checked = element.status ? "checked" : "";
            mytable.data[key] = [
              ++start,
              element.attribute_name,
              ulist,
              cateName,
              `<div class="toggle-wrap">
                                           <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateAttributeStatus">
                                           <label class="toggle-label" for="${element._id}"></label>
                                           </div>`,
              `<a href="javascript:void(0);" title="Edit" class="editAttribute" data-attribute-id="${element._id}" data-attribute-name="${element.attribute_name} "data-url="edit_attribute" style="margin-right: 10px;"><i class="fas fa-edit"></i></a>
               <a href="javascript:void(0);" title="Delete" class="deleteAttribute" data-attribute-id="${element._id}" data-url="delete_attribute"><i class="fas fa-trash"></i></a>`,
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
PRODUCTS.deleteAttribute = async (req, res) => {
  try {
    const attributeId = req.body.id;

    if (!attributeId) {
      return res.status(400).json({ status: 0, message: "Invalid Attribute ID" });
    }

    // Find and delete the attribute by its ID
    await attributesModel.findByIdAndDelete(attributeId);

    res.status(200).json({ status: 1, message: "Attribute deleted successfully" });
  } catch (err) {
    res.status(500).json({ status: 0, message: "Error deleting attribute: " + err });
  }
};

PRODUCTS.productsList = async (req, res) => {
  try {
    let isAdmin = await helper.isAdmin(req);
    let uid =
      typeof req.session.user != "undefined"
        ? mongoose.Types.ObjectId(req.session.user.user_id)
        : mongoose.Types.ObjectId();
    let mquery = [];
    let query = { prod_sellerid: await helper.uid(req) };
    if (isAdmin) {
      query = {};
    }
    // array of columns that you want to show in table
    columns = ["prod_name", "prod_description"];
    let start = parseInt(req.query.start);
    let dataLimit = parseInt(req.query.length);
    let text = "";
    // check if global search is enabled and it's value is defined
    if (
      typeof req.query.search !== "undefined" &&
      req.query.search.value != ""
    ) {
      // get global search value
      text = req.query.search.value;

      for (let i = 0; i < req.query.columns.length; i++) {
        requestColumn = req.query.columns[i];
        column = columns[requestColumn.data];

        // if search is enabled for that particular field then create query
        if (
          requestColumn.searchable == "true" &&
          typeof column != "undefined"
        ) {
          let k = {};
          k[column] = {
            $regex: ".*" + text + ".*",
            $options: "i",
          };
          mquery.push(k);
        }
      }
    }

    if (mquery.length > 0) {
      query["$or"] = mquery;
    }
    await productsModel
      .aggregate([
        {
          $match: query,
        },
        {
          $lookup: {
            from: "brands",
            localField: "prod_brand",
            foreignField: "_id",
            as: "brandarray",
          },
        },
        {
          $unwind: "$brandarray",
        },
        {
          $lookup: {
            from: "categories",
            localField: "prod_cate",
            foreignField: "_id",
            as: "catearray",
          },
        },
        {
          $unwind: "$catearray",
        },
        {
          $lookup: {
            from: "sub_categories",
            localField: "prod_subcate",
            foreignField: "_id",
            as: "subcatearray",
          },
        },
        {
          $unwind: "$subcatearray",
        },
      ])
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

        mytable.recordsTotal = await productsModel.countDocuments(query);
        mytable.recordsFiltered = await productsModel.countDocuments(query);

        if (result.length > 0) {
          result.forEach(function (element, key) {
            let addVarientBtn = `<a href="/dashboard/add-product-variant/${element._id}" title="Add Variant" class="editProduct"><i class="fas fa-plus-square"></i></a>`;
            if (isAdmin) {
              addVarientBtn = "";
            }
            let checked = element.status ? "checked" : "";
            mytable.data[key] = [
              ++start,
              element.prod_name,
              element.brandarray["brand_name"],
              element.catearray["cate_name"],
              element.subcatearray["cate_name"],
              `<div class="toggle-wrap">
                                           <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateProductStatus">
                                           <label class="toggle-label" for="${element._id}"></label>
                                           </div>`,
              `<a href="/dashboard/add-product/${element._id}" title="Edit" class="editProduct"><i class="fas fa-edit"></i></a>
                                          ${addVarientBtn}
                                          <a data-href="products_variants_list?prod_id=${element._id}" data-title="Product Variants" data-cls="modal-lg" title="View Variants" class="openModalPopup"><i class="fas fa-list-alt"></i></a>
                                            <a href="#" title="Delete" class="deleteProduct" data-id="${element._id}"><i class="fas fa-trash-alt"></i></a>`,
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

PRODUCTS.productsVariantsList = async (req, res) => {
  try {
    if (req.query.prod_id && req.query.prod_id != 0) {
      let query = {
        prod_sellerid: await helper.uid(req),
        prod_id: req.query.prod_id,
      };

      let isAdmin = await helper.isAdmin(req);
      if (isAdmin) {
        query = { prod_id: req.query.prod_id };
      }

      await productsVariantsModel.find(query).then(async (result) => {
        if (result.length > 0) {
          let MyTbl = `
                        <table class="table table-striped table-bordered" style="width:100%">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>SKU</th>
                                    <th>Variant Name</th>
                                    <th>Color</th>
                                    <th>Sizes & Quantities</th>
                                    <th>Qty</th>
                                    <th>Status</th>
                                    <th>Edit</th>
                                </tr>
                            </thead>
                            <tbody>`;

          let start = 1;
          result.forEach(function (element, key) {
            let checked = element.status ? "checked" : "";
            let sizesQuantities = "";
            // Construct sizes and quantities string
            if (element.prod_sizes && element.prod_sizes.length > 0) {
              element.prod_sizes.forEach((sizeObj) => {
                sizesQuantities += `${sizeObj.size}: ${sizeObj.quantity}, `;
              });
              // Remove the last comma and space
              sizesQuantities = sizesQuantities.slice(0, -2);
            }
            MyTbl += `
            <tr>
                <td>${start++}</td>
                <td>${element.pro_sku}</td>
                <td>${element.pro_subtitle}</td>
                <td>${helper.colorlist(JSON.parse(element.prod_attributes).Color)}</td>
                <td>${sizesQuantities}</td>
                <td>${element.prod_quantity}</td>
                <td>
                    <div class="toggle-wrap">
                        <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateProductVariantStatus">
                        <label class="toggle-label" for="${element._id}"></label>
                    </div>
                </td>
                <td>
                    <a href="/dashboard/add-product-variant/${element.prod_id}/${element._id}" title="Edit Variant"><i class="fas fa-edit"></i></a>
                    <a href="#" class="deleteVariant" data-id="${element._id}" title="Delete Variant"><i class="fas fa-trash-alt"></i></a>
                </td>
            </tr>`;
          });

          MyTbl += `
                        </tbody>
                    </table>`;

          res.send(MyTbl);
        } else {
          res.send("No result found");
        }
      });
    } else {
      res.status(401).json({ status: 0, message: "Product id is required" });
    }
  } catch (err) {
    res.status(401).json({ status: 0, message: "Error: " + err });
  }
};

PRODUCTS.subCategoryListAjax = async (req, res) => {
  try {
    var start = req.body.start ? req.body.start : 0;
    var dataLimit = req.body.limit ? req.body.limit : 100;
    let where = {};
    if (req.body.sub_cate_id) {
      where._id = req.body.sub_cate_id;
    }
    if (req.body.cate_id) {
      where.parent_id = req.body.cate_id;
    }
    if (req.body.cate_name) {
      where.cate_name = req.body.cate_name;
    }
    await subCategoryModel
      .find(where)
      .skip(start)
      .limit(dataLimit)
      .sort({ _id: "desc" })
      .then(async (result) => {
        if (result.length > 0) {
          let returnedCate = [];
          result.forEach(function (element, key) {
            let cateData = {
              _id: element._id,
              cate_name: element.cate_name,
              status: element.status,
            };

            returnedCate.push(cateData);
          });

          res.json({
            status: 1,
            message: "Sub category list fetch successfully.",
            data: returnedCate,
          });
        } else {
          res.json({
            status: 0,
            message: `We couldn't fetch sub category list.`,
            data: [],
          });
        }
      });
  } catch (err) {
    res.json({ status: 0, message: err.message });
  }
};

PRODUCTS.reviewsList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["review"];
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
    let uid = await helper.uid(req);
    let query2 = { prod_sellerid: uid };
    let isAdmin = await helper.isAdmin(req);
    if (isAdmin) {
      query2 = {};
    }
    await ratingReviewModel
      .find(query)
      .populate({ path: "rating_pid", match: query2 })
      .populate("rating_uid")
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

        mytable.recordsTotal = result.length; //await ratingReviewModel.countDocuments(query);
        mytable.recordsFiltered = result.length; //await ratingReviewModel.countDocuments(query);

        if (result.length > 0) {
          result.forEach(function (element, key) {
            if (element.rating_pid && element.rating_uid) {
              mytable.data[key] = [
                ++start,
                element.rating_pid.prod_name,
                element.rating_uid.fullname,
                element.review,
                element.rating,
              ];
            }
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

PRODUCTS.wishList_old = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["prod_name"];
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
    await likesModel
      .find(query)
      .populate("like_pid")
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

        mytable.recordsTotal = await likesModel.countDocuments();
        mytable.recordsFiltered = await likesModel.countDocuments(query);

        if (result.length > 0) {
          for (const [key, element] of Object.entries(result)) {
            let totalInWishlist = await likesModel.countDocuments({
              like_pid: element.like_pid,
            });
            mytable.data[key] = [
              ++start,
              element.like_pid.prod_name,
              totalInWishlist,
            ];
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

PRODUCTS.wishList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["prod_name"];
    var start = parseInt(req.query.start);
    var dataLimit = parseInt(req.query.length);
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
    await likesModel
      .aggregate([
        {
          $lookup: {
            from: "products_variants",
            localField: "like_pid",
            foreignField: "_id",
            as: "products",
          },
        },
        {
          $project: {
            _id: 1,
            like_pid: 1,
            like_uid: 1,
            "products._id": 1,
            "products.pro_subtitle": 1,
          },
        },
        {
          $group: {
            _id: {
              like_pid: "$like_pid",
            },
            likedetail: {
              $first: "$$ROOT",
            },
            totalProductInWishlist: {
              $sum: 1,
            },
          },
        },
      ])
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

        mytable.recordsTotal = await likesModel.countDocuments(query);
        mytable.recordsFiltered = await likesModel.countDocuments(query);
        if (result.length > 0) {
          let i = 0;
          for (const [key, element] of Object.entries(result)) {
            if (element.likedetail.products.length) {
              //let totalInWishlist = await likesModel.countDocuments({like_pid : element.like_pid});
              let prodDetails = element.likedetail.products[0];
              if (prodDetails && typeof prodDetails !== "undefined") {
                mytable.data[i++] = [
                  ++start,
                  prodDetails.pro_subtitle,
                  element.totalProductInWishlist,
                ];
              }
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

PRODUCTS.bannersList = async (req, res) => {
  try {
    var query = {},
      // array of columns that you want to show in table
      columns = ["banner_image"];
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
    await promotionalBannerModel
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

        mytable.recordsTotal = await promotionalBannerModel.countDocuments();
        mytable.recordsFiltered = await promotionalBannerModel.countDocuments(
          query
        );

        if (result.length > 0) {
          result.forEach(function (element, key) {
            let banner_image = "";
            let thumb_image = "";
            if (element.banner_image != null) {
              banner_image =
                config.APP_URL + "uploads/banners/" + element.banner_image;
              let fileArr = element.banner_image.split(".");
              thumb_image =
                config.APP_URL +
                "uploads/banners/" +
                fileArr[0] +
                "_thumb." +
                fileArr[1];
            } else {
              banner_image = config.DEFAULT_IMAGE;
              // bannerData.thumb_image  = config.DEFAULT_IMAGE;
            }
            let checked = element.status ? "checked" : "";

            mytable.data[key] = [
              ++start,
              `<a href="${banner_image}" target="_blank"><img src="${thumb_image}"  alt="Banner"></a>`,
              `<a href="${element.banner_link}" target="_blank">${element.banner_link}</a>`,
              `<div class="toggle-wrap">
                                          <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="products/updateBannerStatus">
                                          <label class="toggle-label" for="${element._id}"></label>
                                          </div>`,
              `<a href="javascript:void(0);" title="Delete" class="deleteRecords" data-delete-id="${element._id}" data-url="products/delete_banner"><i class="fas fa-trash-alt"></i></a>`,
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

PRODUCTS.editAttributes = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Attribute id is missing.",
      data: "",
    });
    return;
  }

  let attribute_id = req.body.id;
  attributesModel.findOne({ _id: attribute_id }, (err, result) => {
    if (err) {
      res.send({ status: 0, message: err, data: "" });
    } else {
      // console.log(result)
      res.send({ status: 1, message: "Attribute found", data: result });
    }
  });
};

PRODUCTS.deleteBanner = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Banner id is missing.",
      data: "",
    });
    return;
  }
  let banner_id = req.body.id;
  filePath = "./public/uploads/banners/";
  promotionalBannerModel.findOneAndDelete(
    { _id: banner_id },
    (err, previousImage) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        //let  previousImage = await brandModel.findOne({_id: req.body.id}).select("brand_image").exec();
        if (previousImage && previousImage.banner_image != null) {
          let imageName = previousImage.banner_image;
          let mainImage = filePath + imageName;
          if (fs.existsSync(mainImage)) {
            fs.unlinkSync(mainImage); //file removed
          }

          let fileArr = imageName.split(".");
          let thumbPath = filePath + fileArr[0] + "_thumb." + fileArr[1];

          if (fs.existsSync(thumbPath)) {
            fs.unlinkSync(thumbPath); //file removed
          }
        }

        // console.log(cust)
        res.send({
          status: 1,
          message: "Banner Deleted Successfully",
          data: "",
        });
      }
    }
  );
};

PRODUCTS.updateCateStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Category id is missing.",
      data: "",
    });
    return;
  }

  categoryModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateSubcateStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Subcategory id is missing.",
      data: "",
    });
    return;
  }

  subCategoryModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateAttributeStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Attribute id is missing.",
      data: "",
    });
    return;
  }

  attributesModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateBrandStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Brand id is missing.",
      data: "",
    });
    return;
  }
  brandModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateBannerStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Banner id is missing.",
      data: "",
    });
    return;
  }
  promotionalBannerModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateProductStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Product id is missing.",
      data: "",
    });
    return;
  }
  productsModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

PRODUCTS.updateProductVariantStatus = async (req, res) => {
  if (!req.body.id) {
    res.json({
      status: 0,
      message: "Variant id is missing.",
    });
    return;
  }
  productsVariantsModel.findOneAndUpdate(
    { _id: req.body.id },
    { status: req.body.status },
    (err, result) => {
      if (err) {
        res.send({ status: 0, message: err, data: "" });
      } else {
        res.send({
          status: 1,
          message: "Status updated Successfully.",
          data: result,
        });
      }
    }
  );
};

module.exports = PRODUCTS;
