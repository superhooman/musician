var timeout = 300;
var num_track = 0;
var get_offset = 0;
var audio_count = 50;
var get_id;
var get_token;
var playlists = {}
playlists.alb = []
function check_uid() { //Делим все по переменным
    var s = url;
    var i = s.indexOf("access_token=");
    var i2 = s.indexOf("&");
    var token = s.substr(i + 13, i2 - i - 13);
    var i3 = s.indexOf("user_id=");
    var uid = s.substr(i3 + 8);
    get_id = uid;
    get_token = token;
    get_music()
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
var i = 0
function get_playlists() { //Получаем плейлисты
    $.ajax({
        url: 'https://api.vk.com/method/audio.getAlbums?owner_id=' + get_id + '&count=100&offset=' + get_offset + '&access_token=' + get_token,
        dataType: "jsonp",
        async: !0,
        timeout: 5500,
        error: function(xhr, ajaxOptions, thrownError) {
            setTimeout('get_playlists()', timeout)
        },
        success: function(e) {
            var plnum = 0;
            for (var j in e.response) {
                console.log('Это j и она равна '+j)
                if (e.response[j].album_id != null) {
                    get_album_music(e.response[j].album_id, plnum)
                    $('#list_playlist').append('<div id="pl_'+plnum+'" plnum="'+plnum+'" albumid="'+ e.response[j].album_id+'" title="'+e.response[j].title+'" class="item-pl pl-other"><div class="item_icon"><i class="material-icons">library_music</i></div><div class="item-pl_text"><span id="audio_'+plnum+'"></span><h2 class="item-pl_title">'+ e.response[j].title +'</h2></div></div>')
                }
                plnum++
            }
            console.log(playlists.alb)
            $('.item-pl').click(function(e){
                get_offset = 0;
                if(a){
                    audiocont.Pause()
                }
                $('#list_music').empty()
                $('#title-pl').text($(this).attr('title'))

                if ($(this).attr('id') == 'pl_0'){
                    create_music(playlists.alb[0])
                }else{
                    create_music(playlists.alb[$(this).attr('plnum')])
                }
                music_list()
            })
            
        }
    });
}
function fg(){
    
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
            playlists.alb[0] = e.response
            if (e.response.length == 200){
                $('#audio_0').html('Более 200 аудио')
            }else{
                $('#audio_0').html(e.response.length + ' аудио')
            }
            
            $('#pl_0').removeClass('hidden')
        }
    })
}

function get_album_music(albumid, id){ //Получаем аудио из определенного плейлиста
    $.ajax({
        url: 'https://api.vk.com/method/audio.get?owner_id=' + get_id + '&album_id='+albumid+'&count=200&offset=' + get_offset + '&access_token=' + get_token,
        dataType: "jsonp",
        async: !0,
        timeout: 1000,
        error: function(xhr, ajaxOptions, thrownError) {
            setTimeout('get_music()', timeout)
        },
        success: function(e){
            playlists.alb[id] = e.response
            $('#audio_'+id).html(playlists.alb[id].length + ' аудио')
        }
    })
}

function create_music(e){
  //Раскидываем музыку в муз.лист
    for (var j in e) {
        get_offset++;
        if (e[j].aid != null && e[j].content_restricted !== 1) {
            $('#list_music').append('<div onmouseover="getdrag('+e[j].aid+')" id="'+ e[j].aid +'" class="item" data-src="' + e[j].url + '" data-title="' + e[j].title + '" data-artist="' + e[j].artist + '" data-duration="' + e[j].duration + '"><div class="item-container"><div class="item_icon"><i class="material-icons">music_note</i></div><div class="item_content"><h2 class="item_title">' + e[j].title + '</h2><h3 class="item_subtitle">'+ e[j].artist +'</h3></div></div><div class="item-buttons"><i class="material-icons">more_vert</i></div><div class="drop"><a target="_blank" class="material-icons icons" href="'+ e[j].url+'" download="'+ e[j].artist +' - '+ e[j].title + '.mp3.mp3" title="Скачать">file_download</a><a onclick="$(this).parent().parent().remove()" class="material-icons icons" title="Удалить">clear</a></div></div>')
        }
    }
    $('.item-container').click(function(e) { //Песня на клик
        $(this).parent('.item').addClass('-selected').siblings().removeClass('-selected');
        audiocont.ClickedItem()
    })
    $('.item-buttons').click(function(e){
        $('.drop.is-active').removeClass('is-active')
        $('.material-icons.rot').removeClass('rot')
        $(this).children('.material-icons').toggleClass('rot')
        $(this).parent().children('.drop').toggleClass('is-active')
        $(this).parent().children('.drop').mouseleave(function(){
            $('.drop.is-active').removeClass('is-active')
            $('.material-icons.rot').removeClass('rot')
        })
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
