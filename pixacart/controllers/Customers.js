const mongoose   = require('mongoose');
const UserModel  = mongoose.model('users');
const helper          = require('../helpers/my_helper');
const { orderProducts } = require('../models/DatabaseModel');
const CUSTOMER ={};

CUSTOMER.customers = async (req, res) => {
    res.render('backend/customers_list', {
            viewTitle : 'Customers',
            pageTitle : 'Customers List'
    });
};

CUSTOMER.customersList = async (req, res) => {
    try {
        
        var query = {};

        query['role'] = 3;

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

                    let totalOrder = await orderProducts.countDocuments({order_uid : element._id });
                    
                    mytable.data[key] = [ ++start,
                                          element.fullname,
                                          element.email,
                                          element.mobile,
                                          totalOrder,
                                          helper.statusLable[element.status],
                                          //`<!--a href="javascript:void(0);" title="View" class="viewCustomer" data-cust-id="${element._id}"><i class="fas fa-eye"></i></a>
                                         // <a href="javascript:void(0);" title="Delete" class="deleteRecords" data-delete-id="${element._id}" data-url="/dashboard/delete_customer"><i class="fas fa-trash-alt"></i></a-->`
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
  

  CUSTOMER.deleteCustomer = async (req, res) => {
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




    module.exports = CUSTOMER;