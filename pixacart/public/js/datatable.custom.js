$(document).ready(function() {

    // Basic table 
    $('#basic-data-table').DataTable({
        "paging": true,
        "ordering": true,
        "info": true,
        "order": [
            [3, "desc"]
        ],
        "columnDefs": [{
                "targets": [2],
                "visible": false,
                "searchable": false
            },
            {
                "targets": [3],
                "visible": false
            }
        ],
        "pagingType": "simple_numbers",
    });

    // Fix Height table 

    $('#fix-height-table').DataTable({
        "paging": false,
        "ordering": true,
        "info": false,
        "scrollY": "200px",
        "scrollCollapse": true,
        "language": {
            "decimal": ",",
            "thousands": "."
        },
    });


    // Responsive table 

    $('#responsive-table').DataTable({
        responsive: true,
    });

    //dom: '<"row"<"col-md-12"<"row"<"col-md-6"B><"col-md-6"f> > ><"col-md-12"rt> <"col-md-12"<"row"<"col-md-5"i><"col-md-7"p>>> >',
    //<"row"<"col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"B><"col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"f> >

    // Exportable table 

    $('#exportable-table').DataTable({
        dom: '<"data-table-control"<"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"<"row"<"col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"B><"col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12"f> > ><"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"rt> <"col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12"<"row"<"col-xl-5 col-lg-5 col-md-5 col-sm-12 col-12"i><"col-xl-7 col-lg-7 col-md-7 col-sm-12 col-12"p>>> >',
        buttons: {
            buttons: [{
                extend: 'copy',
                className: 'btn btn-primary sm-btn effect-btn'
            }, {
                extend: 'csv',
                className: 'btn btn-primary sm-btn effect-btn'
            }, {
                extend: 'excel',
                className: 'btn btn-primary sm-btn effect-btn'
            }, {
                extend: 'print',
                className: 'btn btn-primary sm-btn effect-btn'
            }]
        },

        "oLanguage": {
            "oPaginate": { "sPrevious": 'Prev' },
            "sInfo": "Showing page _PAGE_ of _PAGES_",
            "sSearch": 'Search',
            "sSearchPlaceholder": "Search...",
            "sLengthMenu": "Results :  _MENU_",
        },
        "stripeClasses": [],
        "lengthMenu": [5, 10, 20, 40],
        "pageLength": 10,
    });



});