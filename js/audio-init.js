var a;
function audio() {
    var loop = 0;
    function name(){
        $('.im_dialog_header_title_label').text($('.-selected').attr('data-title'))
        $('.im_dialog_header_status_label').text($('.-selected').attr('data-artist'))
    }
    function nexttrack(){
        var next = $('.-selected').next();
        if (next.length){
            next.addClass('-selected').siblings().removeClass('-selected');
            audio.load($(next).attr('data-src'));
            name();
            audio.play();
            $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
        }else{
            $('.-selected').removeClass('-selected');
            $('#list_music .item').first().addClass('-selected');
            first = $('.-selected').attr('data-src');
            name();
            audio.load(first);
            audio.play();
            $('#mu').css("background", "url('img/icons.png') -30px 0px no-repeat")
        }
    }
    function prevtrack(){
        var prev = $('.-selected').prev();
        if (prev.length){
            prev.addClass('-selected').siblings().removeClass('-selected');
            audio.load($(prev).attr('data-src'));
            name();
            audio.play();
            $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
        }
    }
    a = audiojs.createAll({
        trackEnded: function() {
            if (!loop){
                nexttrack()
            }else{
                audio.play();
                $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
            }
        }
    });
    var audio = a[0];
    $('#list_music .item').first().addClass('-selected');
    var first = $('.-selected').attr('data-src');
    name();
    audio.load(first);
    enable = false;
    // Load in a track on click
    audiocont = {
        ClickedItem: function(e){
            audio.load($('.-selected').attr('data-src'));
            name();
            audio.play();
            $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
        },
        Pause: function(e){
            audio.playPause();
        }
    }
    // Keyboard shortcuts
    $(document).keydown(function(e) {
        var unicode = e.charCode ? e.charCode : e.keyCode;
        if (unicode == 39) {
            nexttrack()
        } else if (unicode == 37) {
           prevtrack()
        } else if (unicode == 32) {
            audio.playPause();
        } else if (unicode == 76) {
            if (!loop){
                loop = 1
            }else{
                loop = 0
            }
        }

    })
    $('#next').click(function(e) {
        nexttrack()
    })
    $('#prev').click(function(e) {
        prevtrack()
    })
    $('#playpause').click(function(e) {
        audio.playPause();
    })
    $('#loop').click(function(e) {
        if (loop === 0){
                loop = 1
                $( "#loop" ).fadeTo( "fast" , 1);
            }else{
                loop = 0
                $( "#loop" ).fadeTo( "fast" , 0.5);
            }
    })

};
