$(document).ready(function () {

    $.ajax({
        type: "GET",
        url: '/genres',
        success: function (data) {
        
            var template = kendo.template($("#genreTemplate").html());
            
            var genres = $("#genres");
            
            genres.empty();

            for (var i = 0; i < data.length; i++) {

                genres.append(template(data[i]));

            }
        
        },
        error: function (jqXHR, exception) {
            if (jqXHR.status == 401) {
                window.location = '/login.html';
            }
        },
        headers: {
            //MapAuth: getCookie('MapTicket')
        },
        dataType: 'json'
    });

});