var timeout = 300;
var num_track = 0;
var get_offset = 0;
var audio_count = 50;
var not_loaded = true;
var get_id;
var get_token;
var playlists = {};
playlists.alb = [];

function check_uid() {
  //Делим все по переменным
  var s = resp;
  var i = s.indexOf("access_token=");
  var i2 = s.indexOf("&");
  var token = s.substr(i + 13, i2 - i - 13);
  var i3 = s.indexOf("user_id=");
  var uid = s.substr(i3 + 8);
  get_id = uid;
  get_token = token;
  get_music();
  //get_playlists();
}

function pad2(num) {
  //Перевод однозначных в двухзначные
  if (num < 10) num = "0" + num;
  return num;
}

function sec2time(seconds) {
  //Секунды в минуты:секунды
  var m = Math.floor(seconds / 60);
  var s = seconds % 60;
  return pad2(m) + ":" + pad2(s);
}

var enable = true;
var prev = 0;
var i = 0;

function get_playlists() {
  //Получаем плейлисты
  $.ajax({
    url:
      "https://api.vk.com/method/audio.getAlbums?owner_id=" +
      get_id +
      "&count=100&offset=" +
      get_offset +
      "&access_token=" +
      get_token,
    dataType: "jsonp",
    async: !0,
    timeout: 5500,
    error: function(xhr, ajaxOptions, thrownError) {
      setTimeout("get_playlists()", timeout);
    },
    success: function(e) {}
  });
}

function get_music() {
  //Получаем аудио из основного плейлиста
  $.ajax({
    url:
      "https://api.vk.com/method/audio.get?owner_id=" +
      get_id +
      "&count=200&offset=" +
      get_offset +
      "&access_token=" +
      get_token,
    dataType: "jsonp",
    async: !0,
    timeout: 1000,
    error: function(xhr, ajaxOptions, thrownError) {
      setTimeout("get_music()", timeout);
    },
    success: function(e) {
      create_music(e.response);
      if (e.response.length < 2) {
        not_loaded = false;
      }
    }
  });
}

function get_album_music(albumid, id) {
  //Получаем аудио из определенного плейлиста
  $.ajax({
    url:
      "https://api.vk.com/method/audio.get?owner_id=" +
      get_id +
      "&album_id=" +
      albumid +
      "&count=200&offset=" +
      get_offset +
      "&access_token=" +
      get_token,
    dataType: "jsonp",
    async: !0,
    timeout: 1000,
    error: function(xhr, ajaxOptions, thrownError) {
      setTimeout("get_music()", timeout);
    },
    success: function(e) {
      playlists.alb[id] = e.response;
    }
  });
}

function create_music(e) {
  get_offset = get_offset + 200;
  //Раскидываем музыку в муз.лист
  for (var j in e) {
    if (e[j].aid != null && e[j].content_restricted !== 1) {
      $("#list_music").append(
        '<div class="item" data-src="' +
          e[j].url +
          '" data-title="' +
          e[j].title +
          '" data-artist="' +
          e[j].artist +
          '" data-duration="' +
          e[j].duration +
          '"><div class="item-container"><div class="cover"></div><div class="cover_back"></div><div class="item_content"><h2 class="item_title">' +
          e[j].title +
          '</h2><h3 class="item_subtitle">' +
          e[j].artist +
          "</h3></div></div></div>"
      );
    }
  }
  not_loaded = true;
  $(".item-container").click(function(e) {
    //Песня на клик
    $(this)
      .parent(".item")
      .addClass("-selected")
      .siblings()
      .removeClass("-selected");
    audiocont.ClickedItem();
  });
  var el = document.getElementById("list_music");
  var sortable = Sortable.create(el, {
    animation: 200,
    setData: function(dataTransfer, dragEl) {
      dataTransfer.setData(
        "DownloadURL",
        "application/octet-stream:" +
          dragEl.getAttribute("data-artist") +
          " - " +
          dragEl.getAttribute("data-title") +
          ".mp3:" +
          dragEl.getAttribute("data-src")
      );
    }
  });
  if (enable) {
    audio();
  }
}

$("#list_cont").scroll(function() {
  if (not_loaded) {
    if (
      $("#list_cont").scrollTop() + $("#list_cont").height() + 2000 >
      $("#list_music").height()
    ) {
      if (get_offset == 600) {
        not_loaded = false;
        showmessage(
          '\
          <p>Загрузка более 600 аудиозаписей будет влиять на производительность</p>\
          <div class="button-cont">\
            <a class="button-clear" onclick="get_music(); hidemessage()">Загрузить</a>\
            <a class="button" onclick="hidemessage()">Хорошо</a>\
          </div>\
        '
        );
        return;
      }
      not_loaded = false;
      get_music();
    }
  }
});

$(document).click(function(event) {
  if (
    !$(event.target).closest("#popover").length ||
    !$(event.target).closest("#settings").length
  ) {
    if ($("#popover").is(".active")) {
      $("#popover").removeClass("active");
    }
  }
});

$(document).keydown(function(e) {
  //лайтовое управление
  var unicode = e.charCode ? e.charCode : e.keyCode;
  if (unicode == 40) {
    music_list();
  } else if (unicode == 38) {
    playlist_list();
  }
});

function music_list() {
  //показать муз.лист
  $("#Playlists").animate(
    {
      left: "-100%",
      opacity: 0
    },
    500
  );
  $("#Music").animate(
    {
      opacity: 1
    },
    500
  );
}

function playlist_list() {
  //показать плейлисты
  $("#Playlists").animate(
    {
      left: "0%",
      opacity: 1
    },
    500
  );
  $("#Music").animate(
    {
      opacity: 0
    },
    500
  );
}

function showmessage(text) {
  $("#message .message").html(text);
  $("#message").show();
}

function hidemessage() {
  $("#message .message").html("");
  $("#message").hide();
}

$.fn.shuffle = function() {
  var allElems = this.get(),
    getRandom = function(max) {
      return Math.floor(Math.random() * max);
    },
    shuffled = $.map(allElems, function() {
      var random = getRandom(allElems.length),
        randEl = $(allElems[random]).clone(true)[0];
      allElems.splice(random, 1);
      return randEl;
    });

  this.each(function(i) {
    $(this).replaceWith($(shuffled[i]));
  });

  return $(shuffled);
};
