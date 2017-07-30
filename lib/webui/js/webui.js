
var WebUiClient = function() {
    this.socket = io.connect('/');
    this.socket.on('connect', function() {
        $('#connectionStatus').addClass('online');
        $('#connectionStatus').removeClass('offline');
    });
    this.socket.on('disconnect', function() {
        $('#connectionStatus').addClass('offline');
        $('#connectionStatus').removeClass('online');
    });

    this.socket.on('new_job', function(id, source) {
        var newrow = "";
        newrow += "<div class=\"row job\" id=\"job" + id + "\">";
        newrow += "<div class=\"three columns source\">" + source + "</div>"
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

    this.socket.on('error', function(id, error) {
        var row = $('#job' + id);
        if(!row) return;

        var source = $('.source', row).html();
        $(row).html('<div class="three columns source">' + source + '</div><div class="eight columns"><strong>Error: </strong>' + error + '</div></div>')
    });


    this.socket.on('syncing', function(id) {
        var row = $('#job' + id);
        if(!row) return;

        var source = $('.source', row).html();
        $(row).html('<div class="three columns source">' + source + '</div><div class="eight columns"><strong>syncing</strong></div></div>')
    });

    this.socket.on('done', function(id) {
        var row = $('#job' + id);
        if(!row) return;

        $('.eight', row).html("done");
    });

    this.socket.on('drives', function(drives) {
        var content = drives.filter(function(d) { return d.priority <= 10; }).map(function(d) { return d.name }).join(" ");
        $('#destinations').html(content);
    });
};

$(function() {
    var ui = new WebUiClient();

    screenfull.request();
    $('#viewDestination').click(() => {
        screenfull.toggle();
    });
});
