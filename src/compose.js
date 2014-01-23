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

    function unlockProperty(obj, prop, op) {
      var writable;

      if (!canWriteProtect || !obj.hasOwnProperty(prop)) {
        op.call(obj);
        return;
      }

      writable = Object.getOwnPropertyDescriptor(obj, prop).writable;
      Object.defineProperty(obj, prop, { writable: true });
      op.call(obj);
      Object.defineProperty(obj, prop, { writable: writable });
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
