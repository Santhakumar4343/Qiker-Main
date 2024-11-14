const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
    fullname :{ type: String,default:null},
    role: {type: Number,default:2},
    email :{ type: String},
    mobile :{ type: String,default:null},
    password :{ type: String,default:null},
    profile_image :{ type: String,default:null},
    address :{ type: String,default:null},
    city :{ type: String,default:null},
    postal_code :{ type: String,default:null},
    country :{ type: String,default:null},
    state :{ type: String,default:null},
    gst_no :{ type: String,default:null},
    status :{ type: Number, default:3},
    verify_otp:{ type: String,default:null},
    resetPasswordToken:{ type: String,default:null},
    firebase_token:{ type: String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const categorySchema = new mongoose.Schema({
    cate_name :{ type: String,default:null},
    cate_commission  :{ type: Number,default:0},
    cate_tax :{ type: Number,default:0},
    cate_image:{ type: String,default:null},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const subCategorySchema = new mongoose.Schema({
    parent_id :{ type: mongoose.Schema.Types.ObjectId,
                 ref: 'category',
                 required:true},
    cate_name :{ type: String,default:null},
    cate_image:{ type: String,default:null},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const brandSchema = new mongoose.Schema({
    brand_name :{ type: String,default:null},
    brand_image:{ type: String,default:null},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const productsAttributesSchema = new mongoose.Schema({
    attribute_name :{ type: String,default:null},
    attribute_value :{ type: String,default:null},
    attribute_cate :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'category',
                    required:true},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const productSchema = new mongoose.Schema({
    prod_sellerid :{ type: mongoose.Schema.Types.ObjectId,
                   ref: 'users',
                   required:true
                },
    prod_name:{ type: String,default:null,unique: true,required: true},
    prod_description    :{ type: String, default:null},
    prod_cate :{ type: mongoose.Schema.Types.ObjectId,
                 ref: 'category',
                 required:true
                },
    prod_subcate :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'sub_category',
                    required:true
                },
    prod_brand :{ type: mongoose.Schema.Types.ObjectId,
                  ref: 'brands',
                  required:true
                },
    
    prod_unit:{ type: String,default:null},
    prod_tax :{type: Number, default: 0},
    featured  :{ type: Number, default:0},
    count_views  :{ type: Number, default:0},
    average_rating : { type: String,default:null},
    rating_user_count : { type: Number,default:0},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const productVariantsSchema = new mongoose.Schema({

    prod_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'products',
        required: true
    },
    prod_sellerid: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true
    },
    pro_subtitle: {
        type: String,
        default: null,
        required: true
    },
    pro_sku: {
        type: String,
        unique: true,
        default: null,
        required: true
    },
    prod_attributes: {
        type: String,
        default: null
    },
    prod_unitprice: {
        type: Number,
        default: 0,
        get: getPrice
    },
    prod_purchase_price: {
        type: Number,
        default: 0,
        get: getPrice
    },
    prod_strikeout_price: {
        type: Number,
        default: 0,
        get: getPrice
    },
    prod_discount: {
        type: Number,
        default: 0
    },
    prod_discount_type: {
        type: String,
        default: null
    },
    prod_sizes: [{
        size: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            default: 0
        },
        strikePrice: {
            type: Number,
            default: 0
        },
        discountType: {
            type: String,
            default: ""
        },
        discount: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            default: 0
        }
    }],
    status: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    },
    prod_quantity:{ 
        type: Number,
         default:0
    },

    prod_id :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required:true
            },
    prod_sellerid :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
            },
    pro_subtitle:{ type: String,default:null,required:true}, 
    pro_sku:{ type: String, unique : true, default:null,required:true}, 
    prod_attributes:{ type: String,default:null},
    prod_unitprice    :{ type: Number, default:0, get : getPrice},
    prod_purchase_price :{type: Number, default:0, get : getPrice},
    prod_strikeout_price :{type: Number, default:0, get : getPrice},            
    prod_quantity :{type: Number, default:0},
    prod_discount:{ type: Number,default:0},
    prod_discount_type  :{ type: String, default:null},
    prod_quantity :{type: Number, default:0},
    status :{type: Number, default:0},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}

});



function getPrice(num){
    return (num).toFixed(2);
}

/*function getPrice(num){
    return (num/100).toFixed(2);
}*/

function setPrice(num){
    return num*100;
}

const orderSchema = new mongoose.Schema({
    order_uniqueid:{ type: String,default:null},
    order_userid :{ type: mongoose.Schema.Types.ObjectId,
                   ref: 'users',
                   required:true
                },
    order_amount :{ type: Number,default:null},
    shipping_address:{ type: String,default:null},
    billing_address:{ type: String,default:null},
    order_tax :{type: Number, default: 0},
    order_discount:{ type: Number,default:0},
    order_discount_type  :{ type: String, default:null},
    payment_mode :{type: String, default:null},
    payment_status :{type: Number, default:0},
    order_status    :{ type: Number, default:2},
    payment_details :{ type: String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const orderProductsSchema = new mongoose.Schema({
    order_id:{ type: mongoose.Schema.Types.ObjectId,
                 ref: 'orders',
                 required:true
     },
    invoice_id :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'orders_invoices',
                    required:true
            },
    prod_unique_id:{ type: String,default:null},
    order_pid :{ type: mongoose.Schema.Types.ObjectId,
                   ref: 'products',
                   required:true
                },
    order_vid :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'products_variants',
                //required:true
                }, 
    order_uid :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
                },
    seller_id :{ type: mongoose.Schema.Types.ObjectId,
                 ref: 'users',
                //required:true
                },
                prod_size:{type:String,default:null},
    prod_quantity:{ type: Number, default:0},
    prod_price :{ type: Number,default:0,  get : getPrice},
    prod_subtotal :{ type: Number,default:0,  get : getPrice},
    order_status : { type: Number, default:2},
    order_tracking_id : { type: String,default:null},
    courier_service : { type: mongoose.Schema.Types.ObjectId,
                        ref: 'courier_services',
                        //required:true
                    },
    order_courier_boy: { type: mongoose.Schema.Types.ObjectId, ref: 'courier_boys' },
    trackingDetails : { type: Object,default:null},
    cancel_reason : { type: String,default:null},
    returnDetails : { type: Object,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const orderInvoiceSchema = new mongoose.Schema({
    invoice_unique_id :{ type: String,default:null},
    main_order_id:{ type: mongoose.Schema.Types.ObjectId,
                 ref: 'orders',
                 required:true
     },
    seller_id :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                //required:true
                },
    order_uid :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
                },
    invoice_total :{ type: Number,default:0,  get : getPrice},
    invoice_status : { type: Number, default:2},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const likesSchema = new mongoose.Schema({
    like_pid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'products_variants',
                    required:true
                },
    like_uid:{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const productViewCountSchema = new mongoose.Schema({
    view_uid:{ type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required:true
        },
    view_pid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'products',
                    required:true
                },
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const productRatingSchema = new mongoose.Schema({
    rating_pid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'products',
                    required:true
                },
    rating_uid:{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    rating : { type: Number, default:0},
    review : { type: String,default:null},
    helpful_count : { type: Number, default:0},
    status  :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const productsThumbSchema = new mongoose.Schema({
    prod_id :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'products',
                required:true
            },
    prod_variant_id :{ type: mongoose.Schema.Types.ObjectId,
                        ref: 'products_variants',
                        required:true
                    },
    user_id :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
            },
    image_name:{ type: String,default:null},
    active_thumb  :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const promotionalBannerSchema = new mongoose.Schema({
    user_id :{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
            },
    banner_image:{ type: String,default:null},
    banner_link:{ type: String,default:null},
    status  :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const webSettingsSchema = new mongoose.Schema({
    key_name :{ type: String,default:null},
    value:{ type: String , default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const currenciesSchema = new mongoose.Schema({
    currency_code :{ type: String,default:null},
    currency_symbol:{ type: String,default:null},
    status  :{ type: Number, default:0},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const helpQuestionSchema = new mongoose.Schema({
    faq_question :{ type: String,default:null},
    faq_answer:{ type: String,default:null},
    status  :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const customerQueriesSchema = new mongoose.Schema({
    seller_id : { type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required:true
        },
    question_pid : { type: mongoose.Schema.Types.ObjectId,
            ref: 'products',
            required:true
        },
    question_uid :{ type: mongoose.Schema.Types.ObjectId,
            ref: 'users',
            required:true
        },
    question : { type: String,default:null},
    answer   :{ type: String,default:null},
    status   :{ type: Number, default:0},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const supportCategorySchema = new mongoose.Schema({
    sp_catename :{ type: String,default:null},
    status    :{ type: Number, default:1},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const supportTicketSchema = new mongoose.Schema({
    ticket_uniqueid : { type: String,default:null},
    ticket_sellerid :{ type: mongoose.Schema.Types.ObjectId,
                        ref: 'users',
                        required:true
                    },
    ticket_uid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    ticket_pid : { type: mongoose.Schema.Types.ObjectId,
                    ref: 'products',
                },
    ticket_cate : { type: mongoose.Schema.Types.ObjectId,
                    ref: 'support_categories',
                },
    subject : { type: String,default:null},
    priority : { type: Number,default:1},
    status  :{ type: Number, default:0},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});


const supportReplySchema = new mongoose.Schema({
    ticket_id : { type: mongoose.Schema.Types.ObjectId,
                    ref: 'support_tickets',
                    required:true
                },
    sender_id :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    receiver_id : { type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    message : { type: String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});




const notificationSchema = new mongoose.Schema({
    noti_status :{ type: Number,default:null},
    noti_type:{ type: Number,default:null},
    from_user:{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
            },
    to_user:{ type: mongoose.Schema.Types.ObjectId,
                ref: 'users',
                required:true
            },
    reference_id  :{ type: String, default:null},
    view_status  :{ type: Number, default:0},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
});

const firebase_Notification = new mongoose.Schema({
    user_ids :{type : String, default: null},
    noti_title :{type: String, default: null},
    noti_message : {type:String,default:null},
    target_link:{type:String,default:null},
    noti_image:{type:String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
})





const courierServicesSchema = new mongoose.Schema({
    service_name: { type: String,required: true  },
    email: { type: String,required: true },
    password: { type: String,required: true },
    phone_number: { type: String, required: true },
    address :{ type: String,default:null},
    city :{ type: String,default:null},
    postal_code :{ type: String,default:null},
    country :{ type: String,default:null},
    state :{ type: String,default:null},
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});
const courierBoysSchema = new mongoose.Schema({
    service_name: { type: String, default: null },
    email: { type: String, default: null },
    password: { type: String, default: null },
    phone_number: { type: String, default: null },
    address :{ type: String,default:null},
    city :{ type: String,default:null},
    postal_code :{ type: String,default:null,unique:true},
    country :{ type: String,default:null}, 
    state :{ type: String,default:null},
    courierService: { type: mongoose.Schema.Types.ObjectId, ref: 'courier_services' },
    status: { type: Number, default: 1 },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});




const outstandingSchema = new mongoose.Schema({
    maine_orderid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'orders',
                   // required:true
                },
    invoice_id :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'orders_invoices',
                   // required:true
                },
    sub_orderid :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'orders_products',
                    //required:true
                },
    seller_id :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    debit :{ type: Number,default:0},
    credit :{ type: Number,default:0},
    balance :{ type: Number,default:0},
    entry_againts :{ type: Number,default:null},
    reference_id : { type: String,default:null},
    status  :{ type: Number, default:1},
    remark :{ type: String,default:null},

    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
}); 


const withdrawRequestSchema = new mongoose.Schema({
    seller_id :{ type: mongoose.Schema.Types.ObjectId,
                    ref: 'users',
                    required:true
                },
    amount :{ type: Number,default:0},
    status  :{ type: Number, default:0},
    transaction_id  :{ type: String, default:null},
    remark :{ type: String,default:null},
    createdAt :{type: Date, default: Date.now},
    updatedAt :{type: Date, default: Date.now}
}); 



userSchema.method('transform', function() {
    var obj = this.toObject();
     //Rename fields
    obj.id = obj._id;
    delete obj._id;

    return obj;
});

categorySchema.method('transform', function() {
    var obj = this.toObject();
    //Rename fields
    obj.id = obj._id;
    delete obj._id;

    return obj;
});

const users        = mongoose.model('users',userSchema);
const category     = mongoose.model('category',categorySchema);
const subCategory  = mongoose.model('sub_category',subCategorySchema);
const brands       = mongoose.model('brands',brandSchema);
const products     = mongoose.model('products',productSchema);
const orders       = mongoose.model('orders',orderSchema);
const likes        = mongoose.model('likes',likesSchema);
const productsThumb  = mongoose.model('products_thumb',productsThumbSchema);
const productsRatings  = mongoose.model('products_ratings',productRatingSchema);
const promotionalBanner  = mongoose.model('promotional_banner',promotionalBannerSchema);
const productsAttributes = mongoose.model('products_attributes',productsAttributesSchema);
const webSettings = mongoose.model('website_settings',webSettingsSchema);
const orderProducts = mongoose.model('orders_products',orderProductsSchema);
const productVariants = mongoose.model('products_variants',productVariantsSchema);
const currencies = mongoose.model('currencies',currenciesSchema);
const helpQuestions = mongoose.model('help_questions_answers',helpQuestionSchema);
const viewCount = mongoose.model('product_view_count',productViewCountSchema);
const notifications = mongoose.model('notifications',notificationSchema);
const ordersInvoice = mongoose.model('orders_invoice',orderInvoiceSchema);
const customerQueries = mongoose.model('customer_queries',customerQueriesSchema);
const courierServices = mongoose.model('courier_services',courierServicesSchema);
const courierBoys = mongoose.model('courier_boys',courierBoysSchema);
const supportTickets = mongoose.model('support_tickets',supportTicketSchema);
const supportReplies = mongoose.model('support_replies',supportReplySchema);
const supportCategory = mongoose.model('support_categories',supportCategorySchema);
const outstandings = mongoose.model('outstandings',outstandingSchema);
const withdrawRequest = mongoose.model('withdraw_request',withdrawRequestSchema);
const firebaseNotification = mongoose.model('firebaseNotification',firebase_Notification)






module.exports = {
    users,
    category,
    subCategory,
    brands,
    products,
    orders,
    likes,
    productsThumb,
    productsRatings,
    promotionalBanner,
    productsAttributes,
    webSettings,
    orderProducts,
    productVariants,
    currencies,
    helpQuestions,
    viewCount,
    notifications,
    ordersInvoice,
    customerQueries,
    courierServices,
    courierBoys,
    supportTickets,
    supportReplies,
    supportCategory,
    outstandings,
    withdrawRequest,
    firebaseNotification
    
}