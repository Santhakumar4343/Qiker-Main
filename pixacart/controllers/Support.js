const mongoose   = require('mongoose');
const moment     = require('moment'); 
const UserModel  = mongoose.model('users');
const supportTicketModel  = mongoose.model('support_tickets');
const supportReplyModel  = mongoose.model('support_replies');
const supportCategoryModel  = mongoose.model('support_categories');
const customerQueriesModel   = mongoose.model('customer_queries');
const helper          = require('../helpers/my_helper');
const config          = require('../config/config');

const SUPPORT = {};

SUPPORT.supportTicket = async (req, res) => {
    res.render('support/support_tickets', { 
            viewTitle : 'Support Tickets',
            pageTitle : 'Support Tickets',
    });
};

SUPPORT.customerQuestionsAnswer = async (req, res) => {
    res.render('support/customer_questions', {
            viewTitle : 'Customers Questions',
            pageTitle : 'Customers Questions',
    });
};

SUPPORT.supportCategory = async (req, res) => {
    res.render('support/support_category', {
            viewTitle : 'Support Categories',
            pageTitle : 'Support Categories List'
    });
};


SUPPORT.ticketReply = async (req, res) => {
    let ticket_id = (req.params.id) ? req.params.id : '';
    if(ticket_id){
        let ticketDetails =  await supportTicketModel.findOne({_id : ticket_id}).populate('ticket_uid','fullname profile_image');
        let ticketReplies   =  await supportReplyModel.find({ticket_id : ticket_id});
        if(ticketDetails){
            if(ticketDetails.ticket_uid.profile_image != null){
                ticketDetails.ticket_uid.profile_image = config.APP_URL+'uploads/users/'+ticketDetails.ticket_uid.profile_image;
            }else{
                ticketDetails.ticket_uid.profile_image = config.USER_DEFAULT_IMAGE;
            }
        }
        //console.log(ticketDetails)
        res.render('support/ticket_reply', {
                viewTitle : 'Ticket Reply',
                pageTitle : 'Ticket Reply',
                ticketDetails : ticketDetails,
                ticketReplies :ticketReplies, 
                moment : moment
        });
    }else{
        res.redirect('support/tickets');
    }
};


SUPPORT.supportCategorList = async (req, res) => {
    try {
        
        var query = {},

        // array of columns that you want to show in table
        columns = ['sp_catename'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

            
            for (var i=0; i<columns.length; i++) {
                requestColumn = req.query.columns[i];
                column = columns[requestColumn.data];

                // if search is enabled for that particular field then create query
                if (requestColumn.searchable == 'true') {
                    query[column] = {
                        $regex: text, $options : 'i'
                    };
                }
            }
        }
        await supportCategoryModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await supportCategoryModel.countDocuments();
            mytable.recordsFiltered = await supportCategoryModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
                   let checked =  (element.status) ? 'checked' : '';
                    mytable.data[key] = [ ++start,
                                          element.sp_catename,
                                          `<div class="toggle-wrap">
                                           <input class="toggle-input d-none changeStatus" id="${element._id}" type="checkbox" ${checked} url="support/updateSuppoCateStatus">
                                           <label class="toggle-label" for="${element._id}"></label>
                                           </div>`,
                                           `<a href="javascript:void(0);" title="Edit" class="editSpCate" data-cate-id="${element._id}" data-cate-name="${element.sp_catename}"><i class="fas fa-edit"></i></a>`
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

SUPPORT.ticketList = async (req, res) => {
    try {
        
        var query = {ticket_sellerid : await helper.uid(req)},

        // array of columns that you want to show in table
        columns = ['subject'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

            
            for (var i=0; i<columns.length; i++) {
                requestColumn = req.query.columns[i];
                column = columns[requestColumn.data];

                // if search is enabled for that particular field then create query
                if (requestColumn.searchable == 'true') {
                    query[column] = {
                        $regex: text,  $options : 'i'
                    };
                }
            }
        }
        await supportTicketModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await supportTicketModel.countDocuments();
            mytable.recordsFiltered = await supportTicketModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
                    let status = `<label class="mb-0 badge badge-warning" title="" data-original-title="Pending">Open</label>`;
                    if(element.status==1){
                        status = `<label class="mb-0 badge badge-success" title="" data-original-title="Pending">Complete</label>`;
                    }
                    mytable.data[key] = [ ++start,
                                          element.subject,
                                          moment(element.createdAt).format('DD-MMM-YYYY HH:MM'),
                                          status,
                                          `<a href="ticket-reply/${element._id}" title="Reply" class="replyTicket" data-url="" data-ticket-id="${element._id}"><i class="fas fa-reply"></i></a>`
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


  SUPPORT.questionList = async (req, res) => {
    try {
        
        var query = {seller_id : await helper.uid(req)},

        // array of columns that you want to show in table
        columns = ['question'];
        var start = req.query.start;
        var dataLimit = req.query.length;
        // check if global search is enabled and it's value is defined
        if (typeof req.query.search !== 'undefined' && req.query.search.value != '') {

            // get global search value
            var text = req.query.search.value;

          
            for (var i=0; i<columns.length; i++) {
                requestColumn = req.query.columns[i];
                column = columns[requestColumn.data];

                // if search is enabled for that particular field then create query
                if (requestColumn.searchable == 'true') {
                    query[column] = {
                        $regex: text, $options : 'i'
                    };
                }
            }
        }
        await customerQueriesModel.find(query).skip(start).limit(dataLimit).sort({ _id : 'desc' }).then(async (result)=>{
            var mytable = {
                draw:req.query.draw,
                recordsTotal:0,
                recordsFiltered:0,
                data:[],
            }

            mytable.recordsTotal    = await customerQueriesModel.countDocuments(query);
            mytable.recordsFiltered = await customerQueriesModel.countDocuments(query);

           if(result.length > 0){
                result.forEach(function(element,key) {
                    let status = `<label class="mb-0 badge badge-danger" title="" data-original-title="Pending">Pending</label>`;
                    if(element.status==1){
                        status = `<label class="mb-0 badge badge-success" title="" data-original-title="Pending">Replyed</label>`;
                    }
                    mytable.data[key] = [ ++start,
                                          element.question,
                                          element.answer,
                                          status,
                                          `<a href="javascript:void(0);" title="Reply" class="replyQuestions" data-url="support/edit_question" data-question-id="${element._id}"><i class="fas fa-reply"></i></a>`
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


  SUPPORT.editQuestionAnswer = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'Question id is missing.',
            data: ''
        });
        return;
    }

    let que_id = req.body.id;
    customerQueriesModel.findOne({'_id':que_id}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''});
        } else {
            // console.log(result)
            res.send({ status: 1,'message':'Question found.','data':result});
        }
    });
};

SUPPORT.ticketReplySend = async (req, res) => {
    if(!req.body.ticket_id){
        res.json({
            status:0,
            message: 'Ticket id is missing.',
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
                        sender_id : await helper.uid(req),
                        receiver_id :  req.body.receiver_id,
                        message : req.body.reply_msg
                    };
    await supportReplyModel.create(inserData).then(async result=>{

        html = `<div class="outgoing-msg">
                    <div class="sent-msg">
                        <p>${result.message}</p>
                        <span class="time-date">${moment(result.createdAt).format('HH:MM | DD MMMM')}</span> 
                    </div>
                    <div class="incoming-msg-img">
                        <!--img src="https://via.placeholder.com/60x60" alt=""--> 
                    </div>
                </div>`;

       res.json({ status: 1 , message: 'Reply send Successfully!.', data : result , chatHtml : html});
    }).catch(err=>{
        res.json({ status:0 , message: 'Something went wrong in send reply. '+err.message, data : {} });                    
    });
};



SUPPORT.questionReply = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'Question id is missing.',
            data: ''
        });
        return;
    }

    if(!req.body.cust_answer){
        res.json({
            status:0,
            message: 'Please enter answer.',
            data: ''
        });
        return;
    }

    await customerQueriesModel.findOneAndUpdate({'_id' : req.body.id} ,{ 'answer' : req.body.cust_answer, 'status' : 1}, {upsert : true, new: true}).then(async result=>{
       res.json({ status: 1 , message: 'Answer send Successfully!.', data : result });
    }).catch(err=>{
        res.json({ status:0 , message: 'Something went wrong in send answer. '+err.message, data : {} });                    
    });
    
        
    
};

SUPPORT.createSupportCategory = async (req, res)  => {
    // console.log(req.file);
     postData ={};
     if(!req.body.cate_name){
        res.json({
            status : 0,
            message: `Category name field required.`,
            data:[]
          });
        return;
     }
    postData.sp_catename  = req.body.cate_name;
    if(req.body.id && req.body.id != 0) {
         await supportCategoryModel.findOne({'sp_catename':req.body.cate_name,'_id': {$ne: req.body.id}}).then(async checkExist=>{
            if (checkExist) {
                res.status(401).json({status:0 , message:'Category name already exists, Please try another one.',data:''})
            } else {                    
            postData.updatedAt = Date.now();
            await supportCategoryModel.findOneAndUpdate({'_id':req.body.id},postData).then(async result=>{
                res.status(200).json({ status: 1 , message: 'Category Updated Successfully!', 'data': req.body.id });
            }).catch(err=>{
                res.status(500).json({ status:0 , message: 'Something went wrong in update category.', data: err.message });                    
            });
            }
         }).catch(err=>{
             res.status(500).json({ status: 0, message: 'Something went wrong in update category.', data: err.message });
         })
     } else {
         await supportCategoryModel.findOne({'sp_catename':req.body.cate_name}).then(check=>{
             if (check) {
                 res.status(401).json({status: 0 ,message:'Category already exists, Please try another one.',data:check})
             } else {
                supportCategoryModel.create(postData).then(creatRes=>{
                     res.status(200).json({ status: 1 , message: 'Category Added Successfully!', 'data': creatRes });
                 }).catch(err=>{
                     res.status(500).json({ status: 0 , message: 'Something went wrong in insert category.', data: err.message });
                 })
             }
         })
     }
 
}

SUPPORT.updateSuppoCateStatus = async (req, res) => {
    if(!req.body.id){
        res.json({
            status:0,
            message: 'Category id is missing.',
            data: ''
        });
        return;
    }

    supportCategoryModel.findOneAndUpdate({'_id':req.body.id},{status : req.body.status}, (err, result) => {
        if(err) {
            res.send({ status:0,'message':err,'data':''})
        } else {
            res.send({ status: 1,'message':'Status updated Successfully.','data':result});
        }
    });
};

module.exports = SUPPORT;