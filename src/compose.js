// Module compose bertanggung jawab untuk menerapkan mixin.
// Mixin adalah mekanisme yang digunakan oleh FlightJS untuk
// berbagi kode dan fungsionalitas.
// 
// Misal Anda memiliki kode berikut:
// 
// ```javascript
// function withGerak() {
//   this.jalan = function() {
//   }
// }
// ```
// 
// Kemudian kita memiliki module berikut.
// 
// ```javascript
// function manusia() {
// }
// ```
// 
// Kita ingin module `manusia` di atas dapat bergerak. Kita dapat
// memanfaatkan mixin untuk melakukannya:
// 
// ```javascript
// function manusia() {
//   compose.mixin(this, [withGerak]);
// }
// ```
// 
// Dengan memanfaatkan `compose.mixin`, kita telah memasang mixin
// `withGerak` pada `manusia`.
// 
// Contoh di atas digunakan ketika kita hendak memanfaatkan API `mixin`
// pada komponen non-flightJS. Sementara komponen FlightJS sudah
// memiliki API ini. Kita akan membahas mengenai ini lebih lanjut.
define(

  [
    './utils',
    './debug'
  ],

  function(utils, debug) {
    'use strict';

    //enumerables are shims - getOwnPropertyDescriptor shim doesn't work
    var canWriteProtect = debug.enabled && !utils.isEnumerable(Object, 'getOwnPropertyDescriptor');

    //whitelist of unlockable property names
    var dontLock = ['mixedIn'];

    if (canWriteProtect) {
      //IE8 getOwnPropertyDescriptor is built-in but throws exeption on non DOM objects
      try {
        Object.getOwnPropertyDescriptor(Object, 'keys');
      } catch(e) {
        canWriteProtect = false;
      }
    }

    // Metode ini memungkinkan kita untuk mengubah nilai
    // *object descriptor* `writable` yang dimiliki oleh `obj`.
    // Dengan menentukan nilai `writable` tadi, kita dapat
    // menentukan apakah nilai dari properti yang dimiliki
    // oleh `obj` dapat diubah atau tidak. Ketentuan tersebut
    // tergantung pada nilai `isWritable` yang bertipekan
    // `Boolean`.
    function setPropertyWritability(obj, isWritable) {
      if (!canWriteProtect) {
        return;
      }

      var props = Object.create(null);

      // Baca tiap property yang dimiliki oleh `obj`.
      Object.keys(obj).forEach(
        function (key) {

          // Apakah property ini termasuk property yang
          // boleh diubah nilai `writable` nya?
          // 
          // Bila, ia maka kita ubah
          if (dontLock.indexOf(key) < 0) {

            // Ambil nilai *object descriptor*
            var desc = Object.getOwnPropertyDescriptor(obj, key);

            // Ubah nilai untuk `writable`.
            desc.writable = isWritable;

            // Rekam *object descriptor* yang baru
            props[key] = desc;
          }
        }
      );

      // Setelah *looping* di atas dijalankan, kita perlu
      // memasang *object descriptor* yang baru yang dimiliki
      // oleh `obj`.
      Object.defineProperties(obj, props);
    }

    // Metode ini bertugas untuk mengubah `obj[prop]` menjadi
    // `writable`. Kemudian, `op` akan di *mixin* ke dalam `obj`.
    // 
    // Salah satu pengguna dari metode ini adalah mixin `withAdvice`
    // pada module [advice](advice.html#section-16)
    function unlockProperty(obj, prop, op) {
      var writable;

      if (!canWriteProtect || !obj.hasOwnProperty(prop)) {

        // Bila `obj` tidak memiliki properti `prop`, maka kita
        // tidak perlu melakukan apa-apa terhadap `obj[prop]`.
        // 
        // Namun kita tetap perlu me-*mixin*-kan `op` pada `obj`.
        op.call(obj);
        return;
      }

      // Pertama, kita ingin membuat `obj[prop]` dapat diubah
      // nilainya.
      writable = Object.getOwnPropertyDescriptor(obj, prop).writable;
      Object.defineProperty(obj, prop, { writable: true });

      // Karena sekarang obj[prop] dapat diubah, maka kita pasang
      // *mixin* `op` pada `obj`.
      op.call(obj);

      // Kemudian kita kembalikan nilai `writable` milik `obj[prop]`
      // ke kondisi semula.
      Object.defineProperty(obj, prop, { writable: writable });

      // Mengapa kita melakukan semua langkah di atas? Mari kita
      // lihat contoh dar [advice](advice.html#section-16):
      // ```
      // withAdvice: function() {
      //   ['before', 'after', 'around'].forEach(function(m) {
      //     this[m] = function(method, fn) {
      //       compose.unlockProperty(this, method, function() {
      //         if (typeof this[method] == 'function') {
      //           this[method] = advice[m](this[method], fn);
      //         } else {
      //           this[method] = fn;
      //         }

      //         return this[method];
      //       });

      //     };
      //   }, this);
      // }
      // ```
      //   
      // Kita perlu mengingat bahwa module `advice` memiliki tiga
      // API:
      // 
      // - `before`
      // - `after`
      // - `around`
      // 
      // Ketiga API di atas akan melakukan *pembajakan* terhadap
      // metode yang dimiliki oleh suatu objek. Misal kita memiliki
      // komponen berikut
      // 
      // ```
      // function manusia() {
      //    
      //    this.gerak = function() {
      //      this.posisi++;
      //    };
      //    
      // }
      // ```
      // 
      // Kemudian kita ingin menambahkan sebuah `advice` bertipekan
      // `after` pada metode `gerak` di atas. Maka caranya adalah:
      // 
      // ```
      // function manusia() {
      //    // memasang advice jenis after
      //    this.after('gerak', function() {
      //      this.lompat = 1;
      //    });
      // }
      // ```
      // 
      // Pasca `this.after` dijalankan, nilai dari `this.gerak`
      // tidak lagi sama dengan nilai ketika ia pertama kali
      // didefinisikan:
      // 
      // ```
      // function() {
      //    this.posisi++;
      // }
      // ```
      // 
      // Tetapi, nilai `this.gerak` sudah dibajak oleh `this.after`,
      // sehingga ketika `this.gerak` dijalankan, ia pertama-tama
      // menjalankan metode asilnya, setelah itu dia menjalankan
      // `advice` yang telah dipasangkan oleh `this.after` di atas.
      // 
      // Agar tiga API dari `withAdvice` (yaitu `after`, `before`, dan
      // `around`) dapat berjalan, maka ia perlu untuk melakukan
      // `unlock` terhadap metode `gerak`. Dan inilah guna dari metode
      // `unlockProperty` di atas. Ia memungkinkan metode yang hendak
      // dibajak untuk diberi nilai baru (writable).
      // 
      // Bila kita tidak menjalankan `unlockProperty`, maka ada kemungkinan
      // metode yang hendak dibajak tidak bisa diberi nilai baru (tidak bisa
      // dibajak).
      // ------------------------------------------------
      
    }


    // Mengimplementasi `mixins` terhadap module `base`. `mixins` adalah
    // sebuah `Array`.
    // 
    // Contohnya:
    // 
    // ```javascript
    // compose.mixin(this, [withGerak, withMakan, withIstirahat]);
    // ```
    function mixin(base, mixins) {
      base.mixedIn = base.hasOwnProperty('mixedIn') ? base.mixedIn : [];

      mixins.forEach(function(mixin) {

        // Kita perlu mematikan bahwa `mixin` dengan nama yang sama
        // tidak ditambahkan lagi ke `base`, bila sebelumnya, nama
        // `mixin` tersebut telah digunakan.
        // 
        // Caranya adalah dengan mencari apakah `mixin` terdapat
        // di dalam properti `mixedIn` pada `base`. Properti `mixedIn`
        // digunakan untuk merekam `mixin` yang telah disuntikkan ke
        // `base`. Ia adalah sebuah `Array`.
        if (base.mixedIn.indexOf(mixin) == -1) {

          // Sebelum mixin di tambahkan, kita ingin menjaga
          // agar metode pada `mixin` tidak menindih metode pada
          // `base` bila keduanya memiliki nama yang sama.
          // 
          // Caranya adalah dengan memberi nilai `false`
          // pada *property descriptor* `writable` untuk tiap
          // property pada `base`. Dengan demikian, nilai
          // dari tiap property tersebut tidak dapat diubah.
          // 
          // Jadi, bila pada `base` terdapat metode `tambah`,
          // dan pada `mixin` juga terdapat metode `tambah`,
          // maka metode `tambah` pada `base` tidak akan
          // tergantikan oleh metode `tambah` pada `mixin`.
          setPropertyWritability(base, false);

          // Inilah cara memasang mixin ala FlightJS.
          mixin.call(base);
          base.mixedIn.push(mixin);
        }
      });

      // Setelah mixin diterapkan, kita pasang kembali
      // nilai *objek descriptor* `writable` menjadi `true`.
      // 
      // Salah satu konsekuensi dari `writable` ini adalah
      // kita dapat memasang `advice`. Silahkan lihat [module advice](advice.html)
      setPropertyWritability(base, true);
    }

    // Mempublikasikan API agar dapat dimanfaatkan module lain
    return {
      mixin: mixin,
      unlockProperty: unlockProperty
    };

  }
);
