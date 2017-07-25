var timeout = 300;
var num_track = 0;
var get_offset = 0;
var audio_count = 50;
var get_id;
var get_token;

function check_uid() { //Делим все по переменным
    var s = url;
    var i = s.indexOf("access_token=");
    var i2 = s.indexOf("&");
    var token = s.substr(i + 13, i2 - i - 13);
    var i3 = s.indexOf("user_id=");
    var uid = s.substr(i3 + 8);
    get_id = uid;
    get_token = token;
    get_playlists();
}

function pad2(num) { //Перевод однозначных в двухзначные
    if (num < 10) num = "0" + num;
    return num
}

function sec2time(seconds) { //Секунды в минуты:секунды
    var m = Math.floor(seconds / 60);
    var s = seconds % 60;
    return pad2(m) + ":" + pad2(s)
}

var enable = true
var prev = 0;

function get_playlists() { //Получаем плейлисты
    $.ajax({
        url: 'https://api.vk.com/method/audio.getAlbums?owner_id=' + get_id + '&count=100&offset=' + get_offset + '&access_token=' + get_token,
        dataType: "jsonp",
        async: !0,
        timeout: 5500,
        error: function(xhr, ajaxOptions, thrownError) {
            setTimeout('get_music()', timeout)
        },
        success: function(e) {
            var plnum = 1;
            for (var j in e.response) {
                if (e.response[j].album_id != null) {
                    $('#list_playlist').append('<div id="pl'+pad2(plnum)+'" albumid="'+ e.response[j].album_id+'" title="'+e.response[j].title+'" class="item-pl pl-other"><div class="item_icon"><i class="material-icons">library_music</i></div><h2 class="item-pl_title">'+ e.response[j].title +'</h2></div>')
                }
                plnum++
            }
            $('.item-pl').click(function(e){
                get_offset = 0;
                if(a){
                    audiocont.Pause()
                }
                $('#list_music').empty()
                $('#title-pl').text($(this).attr('title'))

                if ($(this).attr('id') == 'pl01'){
                    get_music()
                }else{
                    get_album_music($(this).attr('albumid'));
                }
                music_list()
            })
        }
    });
}
function get_music() { //Получаем аудио из основного плейлиста
    $.ajax({
        url: 'https://api.vk.com/method/audio.get?owner_id=' + get_id + '&count=200&offset=' + get_offset + '&access_token=' + get_token,
        dataType: "jsonp",
        async: !0,
        timeout: 1000,
        error: function(xhr, ajaxOptions, thrownError) {
            setTimeout('get_music()', timeout)
        },
        success: function(e){
          create_music(e)
        }
    })
}

function get_album_music(albumid){ //Получаем аудио из определенного плейлиста
    $.ajax({
        url: 'https://api.vk.com/method/audio.get?owner_id=' + get_id + '&album_id='+albumid+'&count=200&offset=' + get_offset + '&access_token=' + get_token,
        dataType: "jsonp",
        async: !0,
        timeout: 1000,
        error: function(xhr, ajaxOptions, thrownError) {
            setTimeout('get_music()', timeout)
        },
        success: function(e){
          create_music(e)
        }
    })
}

function create_music(e){
  //Раскидываем музыку в муз.лист
    for (var j in e.response) {
        get_offset++;
        if (e.response[j].aid != null && e.response[j].content_restricted !== 1) {
            $('#list_music').append('<div onmouseover="getdrag('+e.response[j].aid+')" id="'+ e.response[j].aid +'" class="item" data-src="' + e.response[j].url + '" data-title="' + e.response[j].title + '" data-artist="' + e.response[j].artist + '" data-duration="' + e.response[j].duration + '"><div class="item_icon"><i class="material-icons">music_note</i></div><div class="item_content"><h2 class="item_title">' + e.response[j].title + '</h2><h3 class="item_subtitle">'+ e.response[j].artist +'</h3></div></div>')
        }
    }
    $('.item').click(function(e) { //Песня на клик
        $(this).addClass('-selected').siblings().removeClass('-selected');
        audiocont.ClickedItem()
    })
    var el = document.getElementById('list_music');
    var sortable = Sortable.create(el);
    if(enable){
        audio()
    }
}

$(document).keydown(function(e) { //лайтовое управление
    var unicode = e.charCode ? e.charCode : e.keyCode;
    if (unicode == 40) {
        music_list()
    } else if (unicode == 38) {
        playlist_list()
    }
})

function music_list(){ //показать муз.лист
    $('#Playlists').animate({left: '-100%', opacity: 0}, 500);
    $('#Music').animate({opacity: 1}, 500);
}
function playlist_list(){ //показать плейлисты
    $('#Playlists').animate({left: '0%', opacity: 1}, 500);
    $('#Music').animate({opacity: 0}, 500);
}
function getdrag(id) {
  var track = document.getElementById(id)
  track.addEventListener("dragstart",function(evt){
    evt.dataTransfer.setData("DownloadURL","application/octet-stream:"+track.getAttribute("data-artist")+" - "+track.getAttribute("data-title")+".mp3:"+track.getAttribute("data-src"));
  },false);
}
