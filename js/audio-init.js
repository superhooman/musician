var a;
const path = require("path");
const NotificationCenter = require("node-notifier").NotificationCenter;
var notifier = new NotificationCenter({
  customPath: path.join(
    __dirname,
    'musician.app/Contents/MacOS/musician'
  ),
});
var prev, next;
function audio() {
  var loop = false; //Повтор или нет
  var shuffle = false;
  function name() {
    $("#title").html($(".-selected").attr("data-title"));
    $("#artist").html($(".-selected").attr("data-artist"));
    notifier.notify({
      title: $(".-selected").attr("data-title"),
      message: $(".-selected").attr("data-artist")
    });
  }
  function nexttrack() {
    //следующий трек
    if (shuffle) {
      next = $(".item").siblings()[
        Math.floor($(".item").siblings().length * Math.random())
      ];
      if (next) {
        $(".-selected").removeClass("-selected");
        $(next).addClass("-selected");
        audio.load($(next).attr("data-src"));
        name();
        audio.play();
      } else {
        $(".-selected").removeClass("-selected");
        $("#list_music .item")
          .first()
          .addClass("-selected");
        first = $(".-selected").attr("data-src");
        name();
        audio.load(first);
        audio.play();
      }
    } else {
      next = $(".-selected").next();
      if (next.length) {
        $(".-selected").removeClass("-selected");
        next.addClass("-selected");
        audio.load($(next).attr("data-src"));
        name();
        audio.play();
      } else {
        $(".-selected").removeClass("-selected");
        $("#list_music .item")
          .first()
          .addClass("-selected");
        first = $(".-selected").attr("data-src");
        name();
        audio.load(first);
        audio.play();
      }
    }
  }
  function prevtrack() {
    //предыдущий трек
    if (shuffle) {
      prev = $(".item").siblings()[
        Math.floor($(".item").siblings().length * Math.random())
      ];
      if (prev) {
        $(prev)
          .addClass("-selected")
          .siblings()
          .removeClass("-selected");
        audio.load($(prev).attr("data-src"));
        name();
        audio.play();
      }
    } else {
      prev = $(".-selected").prev();
      if (prev.length) {
        prev
          .addClass("-selected")
          .siblings()
          .removeClass("-selected");
        audio.load($(prev).attr("data-src"));
        name();
        audio.play();
      }
    }
  }
  a = audiojs.createAll({
    //Инициализация audio.js
    trackEnded: function() {
      //На окончание трека
      if (!loop) {
        nexttrack();
      } else {
        audio.play();
      }
    }
  });
  var audio = a[0];
  $("#list_music .item")
    .first()
    .addClass("-selected");
  var first = $(".-selected").attr("data-src");
  name();
  audio.load(first);
  enable = false;
  audiocont = {
    //Небольшой доступ к функциям аудио
    ClickedItem: function(e) {
      //на клик по записи
      audio.load($(".-selected").attr("data-src"));
      name();
      audio.play();
      $(".play-pause").addClass("play");
    },
    Pause: function(e) {
      //пауза, но не совсем
      audio.pause();
    }
  };
  //Управление на клавиши
  require("electron").ipcRenderer.on("ping", (event, message) => {
    switch (message) {
      case "control:playPause":
        audio.playPause();
        break;
      case "control:nextTrack":
        nexttrack();
        break;
      case "control:prevTrack":
        prevtrack();
    }
  });
  $(document).keydown(function(e) {
    var unicode = e.charCode ? e.charCode : e.keyCode;
    if (unicode == 39) {
      nexttrack();
    } else if (unicode == 37) {
      prevtrack();
    } else if (unicode == 32) {
      audio.playPause();
    } else if (unicode == 76) {
      if (!loop) {
        loop = 1;
      } else {
        loop = 0;
      }
    }
  });
  //Управление на кнопки
  $("#next").click(function(e) {
    nexttrack();
  });
  $("#prev").click(function(e) {
    prevtrack();
  });
  $("#playpause").click(function(e) {
    audio.playPause();
  });
  //Луп кнопочка и ее цвет
  $("#loop").click(function(e) {
    if (!loop) {
      loop = 1;
      $("#loop").addClass("active");
    } else {
      loop = 0;
      $("#loop").removeClass("active");
    }
  });
  $("#shuffle").click(function() {
    if (!shuffle) {
      shuffle = 1;
      $("#shuffle").addClass("active");
    } else {
      shuffle = 0;
      $("#shuffle").removeClass("active");
    }
  });
}
