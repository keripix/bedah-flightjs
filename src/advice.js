define(

  [
    './compose'
  ],

  // `compose` menyediakan API untuk menerapkan Aspect Oriented Programming
  // (AOP) di FlightJS.
  // 
  // Secara sederhana, AOP adalah konsep dimana kita dapat *membungkus* suatu
  // metode tertentu. Jadi, kita dapat menjalankan suatu metode lain ketika
  // metode yang dibungkus tadi hendak dijalankan, telah dijalankan, ataupun
  // keduanya. *Metode lain* ini dinamakan `advice`.
  // 
  // Berikut adalah beberapa mekanisme AOP yang disediakan oleh FlightJS:
  // 
  // - `around`: advice dijalankan sebelum dan sesudah metode dijalankan
  // - `before`: advice dijalankan sebelum metode dijalankan
  // - `after`: advice dijalankan sesudah metode dijalankan
  function(compose) {
    'use strict';

    var advice = {

      // Menjalankan *advice* (`wrapped`) sebelum dan sesudah `base` dijalankan
      // Cara menggunakannya:
      // 
      // ```
      // define(function() {
      //   function withDrama() {
      //   
      //     // Menerapkan `advice`. Perhatikan bahwa metode asli
      //     // menjadi parameter pertama dari `around`.
      //     this.around('announce', function(basicAnnounce) {
      //       clearThroat();
      //       basicAnnounce();
      //       bow();
      //     });
      //   }

      //   return withDrama;
      // });
      // ```
      around: function(base, wrapped) {
        // Metode yang dikembalikan ini mengganti metode asli, `base`.
        return function composedAround() {
          // Kita tidak tahu, `base()` memiliki parameter apa saja.
          // Oleh karena itu, kita perlu mendeteksinya terlebih dahulu.
          var i = 0, l = arguments.length, args = new Array(l + 1);

          // Apa yang sedang dilakukan oleh baris ini? Kita perlu mengingat
          // kembali bagaimana metode `around` ini digunakan.
          // 
          // ```
          // this.around('announce', function(basicAnnounce) {
          //   clearThroat();
          //   basicAnnounce();
          //   bow();
          // });
          // ```
          // 
          // Ketika kita menerapkan `around`, maka `advice` kita akan menerima
          // metode yang hendak dibungkus sebagai parameter pertamanya.
          // 
          // Inilah mengapat kita perlu merekam metode yang hendak dibungkus
          // ini (`base`) sebagai anggota pertama dari `args`.
          // 
          // Jangan lupa untuk memasang `scope` dari `base` kepada metode yang
          // menjalankan `around` ini.
          args[0] = base.bind(this);
          for (; i < l; i++) args[i + 1] = arguments[i];

          return wrapped.apply(this, args);
        };
      },

      before: function(base, before) {
        var beforeFn = (typeof before == 'function') ? before : before.obj[before.fnName];
        return function composedBefore() {
          beforeFn.apply(this, arguments);
          return base.apply(this, arguments);
        };
      },

      after: function(base, after) {
        var afterFn = (typeof after == 'function') ? after : after.obj[after.fnName];
        return function composedAfter() {
          var res = (base.unbound || base).apply(this, arguments);
          afterFn.apply(this, arguments);
          return res;
        };
      },

      // a mixin that allows other mixins to augment existing functions by adding additional
      // code before, after or around.
      withAdvice: function() {
        ['before', 'after', 'around'].forEach(function(m) {
          this[m] = function(method, fn) {

            compose.unlockProperty(this, method, function() {
              if (typeof this[method] == 'function') {
                this[method] = advice[m](this[method], fn);
              } else {
                this[method] = fn;
              }

              return this[method];
            });

          };
        }, this);
      }
    };

    return advice;
  }
);
