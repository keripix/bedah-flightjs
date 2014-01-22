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
      //     // 
      //     // Metode yang hendak dibungkus dalam contoh di bawah
      //     // ini, memiliki nama `announce`.
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
          // Bagaimana dengan ini: `base.bind(this);` ?
          // 
          // Tujuannya adalah untuk memasang `scope` dari `base` kepada metode
          // yang menjalankan `around` ini.
          args[0] = base.bind(this);

          // Kita tetap akan memberikan akses terhadap parameter asli
          // `base` sehingga dapat kita akses di `advice`.
          for (; i < l; i++) args[i + 1] = arguments[i];

          // Setelah semuanya telah dipersiapkan, kita kembalikan `advice` ini.
          // Alhasil, `base` sudah tergantikan oleh `advice`.
          return wrapped.apply(this, args);
        };
      },

      // Menerapkan `advice` jenis `before` pada `base`.
      // Contoh menggunakannya:
      // 
      // ```
      // define(function() {
      //   function withDrama() {
      //     this.before('announce', function() {
      //       clearThroat();
      //     });
      //   }

      //   return withDrama;
      // });
      // ```
      before: function(base, before) {
        var beforeFn = (typeof before == 'function') ? before : before.obj[before.fnName];
        return function composedBefore() {
          // Jalankan `advice` kita
          beforeFn.apply(this, arguments);
          // sebelum `base` dijalankan.
          return base.apply(this, arguments);
        };
      },

      // Menerapkan `advice` jenis `after` pada `base`.
      // Contoh menggunakannya:
      // 
      // ```
      // define(function() {
      //   function withDrama() {
      //     this.after('announce', function() {
      //       clearThroat();
      //     });
      //   }

      //   return withDrama;
      // });
      // ```
      after: function(base, after) {
        var afterFn = (typeof after == 'function') ? after : after.obj[after.fnName];
        return function composedAfter() {
          // Jalankan `base`. Kita perlu menangkap kembalian yang diberikan
          // oleh `base`.
          var res = (base.unbound || base).apply(this, arguments);
          // Kemudian kita jalankan `advice`.
          afterFn.apply(this, arguments);
          // Berikan keluaran asli ketika `base` dijalankan.
          return res;
        };
      },

      // `withAdvice` adalah sebuah mixin. Mixin ini memungkinkan komponen
      // non-flightJS, untuk menerapkan AOP.
      // 
      // Mekanisme mixin dari flightJS akan dibahas pada module `compose`.
      withAdvice: function() {
        // *Looping* ini menambahkan metode berikut pada mixin `withAdvice`.
        // Alhasil, `withAdvice` memperoleh metode:
        // 
        // - before()
        // - after()
        // - around()
        ['before', 'after', 'around'].forEach(function(m) {
          // this.before
          // this.after
          // this.around
          // 
          // Parameter ketiga metode di atas sama dengan parameter
          // dari tiga jenis advice yang telah dibahas sebelumnya,
          // yaitu:
          // 
          // `base, fn`
          // 
          // Jadi, `method` adalah metode yang hendak dibungkus
          // oleh advice (`fn`)
          this[m] = function(method, fn) {
            // Akan dibahas pada module `compose`
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
