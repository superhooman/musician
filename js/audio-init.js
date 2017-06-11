var a;
var prev, next
function audio() {
    var loop = false; //Повтор или нет
    function name(){
        $('.im_dialog_header_title_label').text($('.-selected').attr('data-title'))
        $('.im_dialog_header_status_label').text($('.-selected').attr('data-artist'))
    }
    function nexttrack(){ //следующий трек
        next = $('.-selected').next();
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
    function prevtrack(){ //предыдущий трек
        prev = $('.-selected').prev();
        if (prev.length){
            prev.addClass('-selected').siblings().removeClass('-selected');
            audio.load($(prev).attr('data-src'));
            name();
            audio.play();
            $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
        }
    }
    a = audiojs.createAll({ //Инициализация audio.js
        trackEnded: function() { //На окончание трека
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
    audiocont = { //Небольшой доступ к функциям аудио
        ClickedItem: function(e){ //на клик по записи
            audio.load($('.-selected').attr('data-src'));
            name();
            audio.play();
            $('#playpause').css("background", "url('img/icons.png') -30px 0px no-repeat")
        },
        Pause: function(e){ //пауза, но не совсем
            audio.playPause();
        }
    }
    //Управление на клавиши
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
    //Управление на кнопки
    $('#next').click(function(e) {
        nexttrack()
    })
    $('#prev').click(function(e) {
        prevtrack()
    })
    $('#playpause').click(function(e) {
        audio.playPause();
    })
    //Луп кнопочка и ее цвет
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
