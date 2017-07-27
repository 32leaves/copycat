
var WebUiClient = function() {
    this.socket = io.connect('/');
    this.socket.on('connect', function() {
        $('#connectionStatus').html('online');
    });
    this.socket.on('disconnect', function() {
        $('#connectionStatus').html('offline');
    });

    this.socket.on('new_job', function(id, source) {
        var newrow = "";
        newrow += "<div class=\"row job\" id=\"job" + id + "\">";
        newrow += "<div class=\"two columns source\">" + source + "</div>"
        newrow += "<div class=\"eight columns\">";
        newrow += "<div class=\"progressbar\">";
        newrow += "<div class=\"bar\" style=\"width: 0%\"></div>";
        newrow += "</div>";
        newrow += "</div>";
        newrow += "<div class=\"one column progress\">0%</div>";
        newrow += "</div>";
        $('.container').append(newrow);
    });

    this.socket.on('progress', function(id, progress) {
        var row = $('#job' + id);
        if(!row) return;

        var perc = progress + "%";
        $('.bar', row).width(perc);
        $('.progress', row).html(perc);
    });
};

$(function() {
    var ui = new WebUiClient();
});
